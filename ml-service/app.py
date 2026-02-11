import os
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("GEMINI_API_KEY")
client = None

if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
        print("✅ Gemini AI Client Initialized")
    except Exception as e:
        print(f"⚠️ Failed to initialize Gemini Client: {e}")
else:
    print("⚠️ Warning: GEMINI_API_KEY not found. Running in Offline Mode.")

# --- LANGUAGE DETECTION LOGIC ---
def detect_language(code):
    # Python detection
    if re.search(r'\bdef\s+\w+', code) or re.search(r'\b(if|elif|else|for|while|class|try|except|finally|with)\b.*:\s*$', code, re.MULTILINE):
        return "python"
    if re.search(r'^\s*(import|from)\s+[\w\.]+', code, re.MULTILINE) and ";" not in code:
        return "python"

    # C detection
    if re.search(r'^\s*#include\s+[<"]', code, re.MULTILINE) or re.search(r'\bprintf\s*\(', code):
        return "c"
    if re.search(r'\bint\s+main\s*\(', code) and "{" in code:
        return "c"

    # Java detection
    if re.search(r'\b(public\s+|private\s+|protected\s+)?class\s+\w+', code) and re.search(r'\bpublic\s+static\s+void\s+main\s*\(', code):
        return "java"
    if re.search(r'\bSystem\.out\.println\s*\(', code):
        return "java"

    return "unknown"

# --- 1. SMART OFFLINE ANALYSIS ENGINE ---
def analyze_offline(code):
    time_complexity = "O(1)"
    space_complexity = "O(1)"
    warnings = []
    suggestions = []
    
    lines = code.split('\n')
    max_nesting = 0
    current_nesting = 0
    loop_count = 0
    is_logarithmic = False
    is_recursive = False
    has_dynamic_allocation = False
    
    func_match = re.search(r'(?:int|void|def|public|private)\s+(\w+)\s*[\(\{]', code)
    if func_match:
        func_name = func_match.group(1)
        calls = len(re.findall(rf'\b{func_name}\s*\(', code))
        if calls > 1:
            is_recursive = True

    has_braces = '{' in code and '}' in code
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('//') or stripped.startswith('#'):
            continue
            
        if re.search(r'\b(for|while)\b', stripped):
            loop_count += 1
            if has_braces:
                if '{' in stripped or not stripped.endswith(';'):
                    current_nesting += 1
            else:
                current_nesting += 1
                
            max_nesting = max(max_nesting, current_nesting)
            
            if re.search(r'(\*=|/=|>>|<<)', stripped):
                is_logarithmic = True
                
        if current_nesting > 0 and re.search(r'(\*=|/=|>>|<<)\s*[2-9]', stripped):
             is_logarithmic = True
             
        if re.search(r'\bnew\s+\w+\s*\[|malloc\b|calloc\b|\b[A-Z]\w*List\b', stripped):
            has_dynamic_allocation = True
        if re.search(r'\[.*\]\s*\*', stripped) or re.search(r'\blist\(', stripped): 
            has_dynamic_allocation = True

        if has_braces:
            if '}' in stripped:
                current_nesting = max(0, current_nesting - stripped.count('}'))

    if is_recursive:
        if re.search(r'\b\w+\s*\(.*\)\s*[\+\-\*\/]\s*\b\w+\s*\(', code):
             time_complexity = "O(2^n)"
             suggestions.append("Exponential recursion detected. Consider Dynamic Programming.")
        else:
             time_complexity = "O(n)"
             suggestions.append("Recursive solution. Ensure base case prevents StackOverflow.")
    else:
        if max_nesting == 0: 
            time_complexity = "O(1)"
        elif max_nesting == 1: 
            time_complexity = "O(log n)" if is_logarithmic else "O(n)"
        elif max_nesting == 2: 
            time_complexity = "O(n log n)" if is_logarithmic else "O(n^2)"
        elif max_nesting >= 3: 
            time_complexity = f"O(n^{max_nesting})"
            warnings.append(f"High complexity detected (O(n^{max_nesting})).")

    if has_dynamic_allocation:
        space_complexity = "O(n)"
        if max_nesting >= 2: space_complexity = "O(n^2)"
    elif is_recursive:
        space_complexity = "O(n) (Stack)"
    else:
        space_complexity = "O(1)"

    if "n^2" in time_complexity:
        suggestions.append("Nested loops detected. Try using HashMaps to optimize.")
    if is_logarithmic:
        suggestions.append("Logarithmic efficiency detected. Good job!")
    if loop_count == 0 and not is_recursive:
        suggestions.append("Constant time complexity. Very efficient.")
    
    if len(code) < 30:
        warnings.append("Code snippet is very short.")

    return {
        "time": time_complexity,
        "space": space_complexity,
        "warnings": warnings,
        "suggestions": suggestions
    }

# --- 2. AI ENHANCEMENT ---
def get_ai_enhancement(code, offline_result):
    if not client:
        return offline_result

    prompt = f"""
    You are an expert Senior Software Engineer.
    Analyze the code for Time and Space Complexity.

    Code:
    ```
    {code}
    ```

    Current Heuristic Estimate:
    - Time: {offline_result['time']}
    - Space: {offline_result['space']}

    Return JSON:
    {{
        "time": "Verified Time Complexity",
        "space": "Verified Space Complexity",
        "warnings": ["Critical issues (max 2 lines)"],
        "suggestions": ["Improvement advice (max 2 lines)"]
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"⚠️ AI Error: {e}")
        offline_result["suggestions"].append("AI is taking a break (Rate Limit). Showing offline results.")
        return offline_result

# --- 3. ROUTES ---
@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "ML Service Running", "port": 8000})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    code = data.get('code', '')
    requested_language = data.get('language', '').lower() # Get language from frontend

    if not code: 
        return jsonify({"time": "N/A"})
    
    # --- LANGUAGE DETECTION & VALIDATION ---
    detected_language = detect_language(code)
    
    # If frontend sent a language, validate it
    if requested_language and detected_language != "unknown":
        if requested_language != detected_language:
             return jsonify({
                "error": f"Language Mismatch: You selected {requested_language.capitalize()} but the code looks like {detected_language.capitalize()}.",
                "detected": detected_language
            })

    # 1. Run Offline Analysis
    result = analyze_offline(code)
    
    # 2. Enhance with AI
    final_result = get_ai_enhancement(code, result)
    
    return jsonify(final_result)

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    if not client:
        return jsonify({"answer": "I am in offline mode. Please check your API key."})
        
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=f"Explain simply: {data.get('question')} \n Code: {data.get('code')}"
        )
        return jsonify({"answer": response.text})
    except Exception as e:
        return jsonify({"answer": "I'm thinking too hard and need a break! (Rate Limit Reached). Please try again in 30 seconds."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
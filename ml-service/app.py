import os
import re
import json
import boto3
from dotenv import load_dotenv
load_dotenv()  # Load .env file
from botocore.exceptions import ClientError
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types

app = Flask(__name__)
CORS(app)

# ============================================================
# --- CLIENT INITIALIZATION: GEMINI + AWS BEDROCK ---
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None

AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION            = os.getenv("AWS_REGION", "us-east-1")
# ✅ Amazon Nova Micro — AWS native, always free, never Legacy
BEDROCK_MODEL_ID = "us.amazon.nova-micro-v1:0"
# 💳 Paid Claude models (require valid AWS payment method)
# BEDROCK_MODEL_ID = "us.anthropic.claude-3-5-haiku-20241022-v1:0"
# BEDROCK_MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
bedrock_client = None

# --- Init Gemini ---
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Gemini AI Client Initialized")
    except Exception as e:
        print(f"⚠️ Failed to initialize Gemini Client: {e}")
else:
    print("⚠️ GEMINI_API_KEY not found. Gemini disabled.")

# --- Init AWS Bedrock ---
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    try:
        bedrock_client = boto3.client(
            service_name="bedrock-runtime",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        print(f"✅ AWS Bedrock Client Initialized (Region: {AWS_REGION})")
    except Exception as e:
        print(f"⚠️ Failed to initialize Bedrock Client: {e}")
else:
    print("⚠️ AWS credentials not found. Bedrock disabled.")


# ============================================================
# --- LANGUAGE DETECTION ---
# ============================================================
def detect_language(code):
    if re.search(r'\bdef\s+\w+', code) or re.search(r'\b(if|elif|else|for|while|class|try|except|finally|with)\b.*:\s*$', code, re.MULTILINE):
        return "python"
    if re.search(r'^\s*(import|from)\s+[\w\.]+', code, re.MULTILINE) and ";" not in code:
        return "python"
    if re.search(r'^\s*#include\s+[<"]', code, re.MULTILINE) or re.search(r'\bprintf\s*\(', code):
        return "c"
    if re.search(r'\bint\s+main\s*\(', code) and "{" in code:
        return "c"
    if re.search(r'\b(public\s+|private\s+|protected\s+)?class\s+\w+', code) and re.search(r'\bpublic\s+static\s+void\s+main\s*\(', code):
        return "java"
    if re.search(r'\bSystem\.out\.println\s*\(', code):
        return "java"
    return "unknown"


# ============================================================
# --- OFFLINE ANALYSIS ENGINE ---
# ============================================================
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
        if max_nesting >= 2:
            space_complexity = "O(n^2)"
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


# ============================================================
# --- HELPER: IS RATE LIMIT ERROR? ---
# ============================================================
def is_rate_limit_error(e):
    """Detect 429 / RESOURCE_EXHAUSTED / ThrottlingException from any provider."""
    err_str = str(e).lower()
    return any(kw in err_str for kw in [
        "429", "resource_exhausted", "rate limit", "quota", "throttl", "too many requests"
    ])


# ============================================================
# --- AI PROVIDER 1: GEMINI ---
# ============================================================
def call_gemini(prompt, max_tokens=300):
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            max_output_tokens=max_tokens,
            temperature=0.2
        )
    )
    return response.text.strip()


# ============================================================
# --- AI PROVIDER 2: AWS BEDROCK (Amazon Nova Micro) ---
# ============================================================
def call_bedrock(prompt, max_tokens=300):
    # Nova uses a different schema from Anthropic Claude
    body = json.dumps({
        "messages": [
            {"role": "user", "content": [{"text": prompt}]}
        ],
        "inferenceConfig": {
            "maxTokens": max_tokens,
            "temperature": 0.2
        }
    })
    response = bedrock_client.invoke_model(
        body=body,
        modelId=BEDROCK_MODEL_ID,
        accept="application/json",
        contentType="application/json"
    )
    response_body = json.loads(response.get("body").read())
    # Nova response: output -> message -> content[0] -> text
    return response_body["output"]["message"]["content"][0]["text"].strip()


# ============================================================
# --- SMART AI ROUTER: Gemini → Bedrock → Offline ---
# ============================================================
def call_ai_with_fallback(prompt, max_tokens=300):
    """
    Tries Gemini first. If rate-limited or unavailable,
    automatically falls back to AWS Bedrock.
    Returns (text, provider_used).
    """
    # --- Attempt 1: Gemini ---
    if gemini_client:
        try:
            text = call_gemini(prompt, max_tokens)
            print("✅ AI Response from: Gemini")
            return text, "gemini"
        except Exception as e:
            if is_rate_limit_error(e):
                print(f"⚡ Gemini rate limit hit. Switching to AWS Bedrock... ({e})")
            else:
                print(f"⚠️ Gemini error: {e}. Trying Bedrock...")

    # --- Attempt 2: AWS Bedrock ---
    if bedrock_client:
        try:
            text = call_bedrock(prompt, max_tokens)
            print("✅ AI Response from: AWS Bedrock (Fallback)")
            return text, "bedrock"
        except Exception as e:
            print(f"⚠️ Bedrock also failed: {e}")

    # --- Both failed ---
    return None, "offline"


# ============================================================
# --- CLEAN JSON FROM AI RESPONSE ---
# ============================================================
def extract_json(text):
    """Strip markdown code fences and parse JSON."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return json.loads(text.strip())


# ============================================================
# --- AI ENHANCEMENT (used in /analyze) ---
# ============================================================
def get_ai_enhancement(code, offline_result):
    prompt = f"""You are a senior software engineer reviewing code for a developer.

Analyze this code:
```
{code}
```

Auto-detected complexity — Time: {offline_result['time']}, Space: {offline_result['space']}

Your job:
1. Verify or correct the complexity estimates
2. Write 1-2 WARNINGS about real risks in this code (performance, bugs, edge cases)
3. Write 1-2 TIPS that give concrete improvement advice

Format rules for warnings and tips:
- Start with a short bold label, e.g. "Nested Loop Risk:" or "Use a HashMap:"
- Follow with ONE clear sentence explaining WHY it matters or HOW to fix it
- Be specific to this actual code — no generic advice
- Keep each item under 20 words total

Reply with ONLY this JSON, no extra text:
{{
  "time": "<Big-O notation>",
  "space": "<Big-O notation>",
  "warnings": [
    "Label: one specific sentence about a real risk in this code.",
    "Label: one specific sentence about another risk (omit if none)."
  ],
  "suggestions": [
    "Label: one concrete actionable tip for this specific code.",
    "Label: one more tip (omit if only one is relevant)."
  ]
}}"""

    text, provider = call_ai_with_fallback(prompt, max_tokens=200)

    if text is None:
        offline_result["suggestions"].append("AI verification unavailable (both Gemini & Bedrock failed). Showing offline results.")
        return offline_result, "offline"

    try:
        result = extract_json(text)
        result["_ai_provider"] = provider  # Optional: expose which AI was used
        return result, provider
    except Exception as e:
        print(f"⚠️ JSON parse error from AI response: {e}")
        offline_result["suggestions"].append("AI response could not be parsed. Showing offline results.")
        return offline_result, "offline"


# ============================================================
# --- ROUTES ---
# ============================================================

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "ML Service Running",
        "port": 8000,
        "ai_providers": {
            "gemini": "enabled" if gemini_client else "disabled",
            "bedrock": "enabled" if bedrock_client else "disabled"
        }
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        code = data.get('code', '')
        requested_language = data.get('language', '').lower()

        if not code:
            return jsonify({"time": "N/A"})

        # Language detection & validation
        detected_language = detect_language(code)
        if requested_language and detected_language != "unknown":
            if requested_language != detected_language:
                return jsonify({
                    "error": f"Language Mismatch: You selected {requested_language.capitalize()} but the code looks like {detected_language.capitalize()}.",
                    "detected": detected_language
                })

        # 1. Offline analysis (always works)
        offline_result = analyze_offline(code)

        # 2. AI enhancement with automatic fallback
        final_result, provider = get_ai_enhancement(code, offline_result)
        final_result["_ai_provider"] = provider  # e.g. "gemini", "bedrock", "offline"

        return jsonify(final_result)

    except Exception as e:
        print(f"⚠️ Analyze route error: {e}")
        return jsonify({
            "time": "Analysis Error",
            "space": "Analysis Error",
            "warnings": ["An internal error occurred during analysis."],
            "suggestions": ["Please try again in a few seconds."]
        }), 500


@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    question = data.get('question', '')
    code = data.get('code', '')

    prompt = f"Explain simply: {question}\nCode:\n{code}"

    text, provider = call_ai_with_fallback(prompt, max_tokens=500)

    if text is None:
        return jsonify({
            "answer": "Both AI providers are currently unavailable (rate limit or credentials issue). Please try again later.",
            "_ai_provider": "offline"
        })

    print(f"✅ /ask-ai answered by: {provider}")
    return jsonify({
        "answer": text,
        "_ai_provider": provider
    })


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host='0.0.0.0', port=port, debug=debug)
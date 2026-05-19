import os
import re
import json
import socket
import boto3
from botocore.config import Config as BotocoreConfig
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
# --- ENVIRONMENT VALIDATION ---
# ============================================================
def validate_env():
    """Print a clear startup status for every required env variable."""
    print("\n" + "=" * 60)
    print("  CodeMind AI — ML Service Startup Check")
    print("=" * 60)

    checks = [
        ("GEMINI_API_KEY",        os.getenv("GEMINI_API_KEY"),        "Primary AI provider"),
        ("AWS_ACCESS_KEY_ID",     os.getenv("AWS_ACCESS_KEY_ID"),     "Bedrock fallback"),
        ("AWS_SECRET_ACCESS_KEY", os.getenv("AWS_SECRET_ACCESS_KEY"), "Bedrock fallback"),
        ("AWS_REGION",            os.getenv("AWS_REGION", "us-east-1"), "Bedrock region"),
    ]

    all_ok = True
    for name, value, purpose in checks:
        if value:
            masked = value[:6] + "…" if len(value) > 6 else "set"
            print(f"  ✅  {name:<26} {masked:<16} ({purpose})")
        else:
            print(f"  ❌  {name:<26} {'MISSING':<16} ({purpose})")
            if name not in ("AWS_REGION",):   # region has a default
                all_ok = False

    print("-" * 60)

    # Determine active providers
    has_gemini  = bool(os.getenv("GEMINI_API_KEY"))
    has_bedrock = bool(os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"))

    if has_gemini and has_bedrock:
        print("  🟢  Mode: Gemini (primary) → Bedrock (fallback) → Offline")
    elif has_gemini:
        print("  🟡  Mode: Gemini (primary) → Offline")
        print("  ⚠️   AWS credentials missing — Bedrock fallback disabled.")
    elif has_bedrock:
        print("  🟡  Mode: Bedrock (primary) → Offline")
        print("  ⚠️   GEMINI_API_KEY missing — Gemini disabled.")
    else:
        print("  🔴  Mode: Offline only — all AI providers disabled.")
        print("  ⚠️   Add GEMINI_API_KEY and/or AWS credentials to .env")

    print("=" * 60 + "\n")

validate_env()

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
        # http_options sets a hard timeout on ALL Gemini API calls
        # Must be set at client level — not in generate_content() — for cross-version compatibility
        gemini_client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=AI_TIMEOUT_SECONDS * 1000)
        )
        print("✅ Gemini AI Client Initialized")
    except Exception as e:
        # Older google-genai versions may not support http_options at client level either
        # Fall back to plain init — timeout handled by fallback chain instead
        try:
            gemini_client = genai.Client(api_key=GEMINI_API_KEY)
            print("✅ Gemini AI Client Initialized (no timeout — upgrade google-genai for timeout support)")
        except Exception as e2:
            print(f"⚠️ Failed to initialize Gemini Client: {e2}")
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
            config=BotocoreConfig(
                connect_timeout=10,
                read_timeout=10,
                retries={"max_attempts": 1}
            )
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
    has_hashmap = False
    has_sorting = False
    has_string_concat_in_loop = False
    in_loop = False

    # --- Recursion: stricter — function must call itself in its own body ---
    func_match = re.search(
        r'\b(?:def|int|void|public|private|protected)\s+(\w+)\s*\(', code)
    if func_match:
        func_name = func_match.group(1)
        body = code[func_match.end():]           # skip the definition line
        if re.search(rf'\b{func_name}\s*\(', body):
            is_recursive = True

    has_braces = '{' in code and '}' in code

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('//') or stripped.startswith('#'):
            continue

        # --- Loop detection ---
        is_loop_line = bool(re.search(r'\b(for|while)\b', stripped))
        if is_loop_line:
            loop_count += 1
            in_loop = True
            if has_braces:
                if '{' in stripped:
                    current_nesting += 1
            else:
                current_nesting += 1
            max_nesting = max(max_nesting, current_nesting)
            # Logarithmic: halving or doubling on the loop header line
            if re.search(r'(\*=\s*2|/=\s*2|>>=|<<=)', stripped):
                is_logarithmic = True

        # Logarithmic: floor-division halving anywhere inside a loop body
        # e.g.  mid = (low + high) // 2
        if current_nesting > 0 and re.search(r'=.*//\s*2\b', stripped):
            is_logarithmic = True

        if current_nesting > 0 and re.search(r'(\*=|/=|>>=|<<=)\s*[2-9]', stripped):
            is_logarithmic = True


        # --- Sorting → O(n log n) ---
        if re.search(r'\b(sorted|sort|Arrays\.sort|Collections\.sort|qsort)\b', stripped):
            has_sorting = True

        # --- Dynamic memory allocation ---
        if re.search(r'\bnew\s+\w+\s*\[|malloc\b|calloc\b', stripped):
            has_dynamic_allocation = True
        if re.search(r'\b(list|List|ArrayList|vector|deque|queue|stack)\b.*[\(\[]', stripped):
            has_dynamic_allocation = True

        # --- HashMap / Set → O(n) space, O(1) lookup ---
        if re.search(r'\b(dict|HashMap|HashSet|set|Map|defaultdict|Counter)\b', stripped):
            has_hashmap = True

        # --- String concat inside loop → hidden O(n²) ---
        # Catches: result += word  OR  result += "lit"  OR  str.concat()
        if in_loop and re.search(r'\w+\s*\+=\s*\w+|\+=\s*["\']|\bconcat\b', stripped):
            has_string_concat_in_loop = True

        # --- Close brace → decrease nesting ---
        if has_braces and '}' in stripped:
            current_nesting = max(0, current_nesting - stripped.count('}'))
            if current_nesting == 0:
                in_loop = False

    # ── TIME COMPLEXITY ───────────────────────────────────────────────
    if is_recursive:
        double_call = re.search(r'\b\w+\s*\(.*\)\s*[\+\-\*\/]\s*\b\w+\s*\(', code)
        if double_call:
            time_complexity = "O(2^n)"
            warnings.append("Exponential Recursion: Two recursive calls per frame — use memoization or DP to optimize.")
        else:
            time_complexity = "O(n)"
            suggestions.append("Recursion Depth: Ensure a clear base case exists to prevent stack overflow.")
    elif has_sorting and max_nesting <= 1:
        time_complexity = "O(n log n)"
        suggestions.append("Built-in Sort: Using optimized O(n log n) sort — best possible for comparison-based sorting.")
    elif max_nesting == 0:
        time_complexity = "O(1)"
    elif max_nesting == 1:
        time_complexity = "O(log n)" if is_logarithmic else "O(n)"
    elif max_nesting == 2:
        time_complexity = "O(n log n)" if is_logarithmic else "O(n²)"
    elif max_nesting >= 3:
        time_complexity = f"O(n^{max_nesting})"
        warnings.append(f"Deep Nesting: {max_nesting} nested loops create O(n^{max_nesting}) complexity — consider restructuring with helper functions.")

    # ── SPACE COMPLEXITY ──────────────────────────────────────────────
    if has_hashmap:
        space_complexity = "O(n)"
        suggestions.append("HashMap Tradeoff: Using O(n) extra memory enables O(1) lookups — an efficient space/time tradeoff.")
    elif has_dynamic_allocation:
        space_complexity = "O(n²)" if max_nesting >= 2 else "O(n)"
    elif is_recursive:
        space_complexity = "O(n)"
        suggestions.append("Stack Space: Each recursive call adds a frame — space grows linearly with input size.")
    else:
        space_complexity = "O(1)"

    # ── ADDITIONAL WARNINGS & TIPS ────────────────────────────────────
    if ("n²" in time_complexity or "n^2" in time_complexity) and not has_hashmap:
        suggestions.append("Optimization Tip: Replace the inner loop lookup with a HashSet or dict to reduce time to O(n).")
    if has_string_concat_in_loop:
        warnings.append("String Concat in Loop: Using '+=' on strings inside a loop is O(n²) — use a list and join() instead.")
    if is_logarithmic and not is_recursive:
        suggestions.append("Divide & Conquer Pattern: Halving/doubling detected — this is an efficient logarithmic algorithm.")
    if loop_count == 0 and not is_recursive:
        suggestions.append("Constant Time: No loops or recursion found — this is an optimal O(1) solution.")
    if len(code.strip()) < 30:
        warnings.append("Short Snippet: Code is very short — complexity analysis may be incomplete or inaccurate.")

    return {
        "time": time_complexity,
        "space": space_complexity,
        "warnings": warnings,
        "suggestions": suggestions
    }


# ============================================================
# --- HELPER: SHOULD WE FALLBACK? ---
# ============================================================
AI_TIMEOUT_SECONDS = 10

def is_rate_limit_error(e):
    """Detect 429 / RESOURCE_EXHAUSTED / ThrottlingException / Timeout."""
    if isinstance(e, (TimeoutError, socket.timeout)):
        return True
    err_str = str(e).lower()
    return any(kw in err_str for kw in [
        "429", "resource_exhausted", "rate limit", "quota",
        "throttl", "too many requests", "timeout", "timed out"
    ])


# ============================================================
# --- AI PROVIDER 1: GEMINI ---
# ============================================================
def call_gemini(prompt, max_tokens=300):
    # http_options timeout is set at client init level (cross-version compatible)
    # Do NOT pass http_options here — older google-genai versions don't support it in generate_content()
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
    Tries Gemini first. On rate limit (429), waits 2s and retries once.
    If still failing, falls back to AWS Bedrock, then offline.
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
                print("⚡ Gemini rate limit hit. Switching to Bedrock immediately...")
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
    prompt = f"""<role>
You are an Elite Senior Software Engineer and Expert Code Reviewer.
</role>

<task>
Perform a precise, professional code review. Analyze time/space complexity, identify critical risks, and suggest actionable optimizations.
</task>

<context>
Code snippet to analyze:
```
{code}
```
Baseline Offline Estimates: Time={offline_result['time']}, Space={offline_result['space']}
</context>

<rules>
1. Verify or correct the baseline complexity estimates based on your deep algorithmic analysis.
2. Write 1-2 WARNINGS focusing on performance bottlenecks, logical flaws, or dangerous edge cases.
3. Write 1-2 TIPS offering concrete code improvements or modern best practices.
4. Each warning/tip MUST start with a concise label (e.g., "Nested Loop Risk:" or "Use a HashMap:").
5. Each warning/tip MUST be a single sentence (max 20 words) explicitly tied to the provided code. No generic fluff.
6. Do NOT output markdown code blocks (like ```json) or any conversational text. Return ONLY valid JSON.
</rules>

<output_format>
{{
  "time": "<Verified Big-O notation>",
  "space": "<Verified Big-O notation>",
  "warnings": [
    "Label: specific sentence about a risk in this code.",
    "Label: specific sentence about a second risk (or omit)."
  ],
  "suggestions": [
    "Label: concrete actionable tip for this code.",
    "Label: second actionable tip (or omit)."
  ]
}}
</output_format>"""

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
# --- HELPER: CENTRALIZED ERROR RESPONSE ---
# ============================================================
def error_response(message, code=400, detail=None):
    """
    Always returns the same JSON shape:
      { "error": str, "code": int, "detail": str | None }
    Use this in every route so clients have a predictable error format.
    """
    body = {"error": message, "code": code}
    if detail:
        body["detail"] = detail
    return jsonify(body), code


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
            return error_response("No code provided.", 400)

        # Language detection & validation
        detected_language = detect_language(code)
        if requested_language and detected_language != "unknown":
            if requested_language != detected_language:
                return error_response(
                    f"Language mismatch: selected {requested_language.capitalize()}, "
                    f"but code looks like {detected_language.capitalize()}.",
                    code=422,
                    detail=f"detected:{detected_language}"
                )

        # 1. Offline analysis (always works)
        offline_result = analyze_offline(code)

        # 2. AI enhancement with automatic fallback
        final_result, provider = get_ai_enhancement(code, offline_result)
        final_result["_ai_provider"] = provider  # e.g. "gemini", "bedrock", "offline"

        return jsonify(final_result)

    except Exception as e:
        print(f"⚠️ Analyze route error: {e}")
        return error_response("Internal analysis error.", 500, detail=str(e))


@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    question = data.get('question', '').strip()
    code = data.get('code', '').strip()
    history = data.get('history', [])

    # Input validation
    if not question:
        return error_response("Question cannot be empty.", 400)
    if len(question) > 500:
        return error_response("Question too long (max 500 characters).", 400)

    # Build structured prompt with role + format instructions
    code_section = f"\n\nCode being analyzed:\n```\n{code[:3000]}\n```" if code else ""
    
    history_section = ""
    if history:
        history_text = "\n".join([f"{'Developer' if m['role']=='user' else 'AI'}: {m['text']}" for m in history])
        history_section = f"\n\nPrevious Conversation Context:\n{history_text}"

    prompt = f"""<role>
You are an Elite Senior Software Engineer mentoring a developer. Your communication style is direct, clear, and highly instructive.
</role>

<task>
Answer the developer's specific question regarding their code. Provide a concise, technically accurate, and directly applicable response following a strict markdown structure.
</task>

<context>{code_section}{history_section}

Current Developer's Question: {question}
</context>

<rules>
1. Anchor your explanation strictly to the provided code context. Do not give abstract theory unless directly relevant.
2. Use plain English and accessible language. Avoid unnecessary jargon, but use precise technical terms when appropriate.
3. If the question pertains to performance, explicitly mention Big-O notation.
4. Do NOT repeat or echo the developer's question.
5. Output ONLY the formatted markdown response. No pleasantries or conversational filler.
</rules>

<output_format>
Your response MUST be formatted EXACTLY using the following Markdown structure to maintain a premium, Claude-like analytical style:

### 💡 Core Explanation
[1-2 clear, dense sentences directly answering the developer's core question without fluff.]

### 🔍 Analytical Breakdown
*   **[Concept 1]:** [Brief explanation tied to the code]
*   **[Concept 2]:** [Brief explanation tied to the code]
*   **Complexity:** [Explicitly state Big-O Time and Space complexity if relevant]

### 🛠️ Actionable Recommendation
```[language]
# [Concise code snippet demonstrating the fix or best practice]
```
</output_format>"""

    text, provider = call_ai_with_fallback(prompt, max_tokens=500)

    if text is None:
        return error_response(
            "Both AI providers are unavailable. Please try again later.",
            code=503,
            detail="Gemini rate-limited and Bedrock unreachable or unconfigured."
        )

    print(f"✅ /ask-ai answered by: {provider}")
    return jsonify({
        "answer": text,
        "_ai_provider": provider
    })




if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host='0.0.0.0', port=port, debug=debug)
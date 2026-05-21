# CodeMind AI — Architecture & System Documentation

> A full-stack, three-tier application for AI-powered algorithmic complexity analysis.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [How a Request Flows End-to-End](#2-how-a-request-flows-end-to-end)
3. [Frontend (React)](#3-frontend-react)
4. [Backend (Node.js / Express)](#4-backend-nodejs--express)
5. [ML Service (Python / Flask)](#5-ml-service-python--flask)
6. [Database (MongoDB)](#6-database-mongodb)
7. [Environment Variables](#7-environment-variables)
8. [How to Run Locally](#8-how-to-run-locally)
9. [Unit Tests](#9-unit-tests)
10. [CI/CD Pipeline (GitHub Actions)](#10-cicd-pipeline-github-actions)
11. [Deployment on Render](#11-deployment-on-render)
12. [Cold Start & Performance](#12-cold-start--performance)
13. [Authentication & Security](#13-authentication--security)

---

## 1. System Overview

CodeMind AI is split into **three independent services** that communicate over HTTP, protected end-to-end by JWT authentication:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION LAYER (JWT)                                  │
│  Register / Login → JWT issued → stored in localStorage → sent as Bearer token       │
└──────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐        ┌────────────────────────┐        ┌──────────────────────────┐
│                         │        │                        │        │                          │
│   FRONTEND (React)      │──JWT──▶│   BACKEND (Node.js)    │───────▶│  ML SERVICE (Python)     │
│   Port: 3000            │        │   Port: 5000           │        │  Port: 8000              │
│   AuthGate / AuthCtx    │◀───────│   verifyToken guard    │◀───────│  Gemini → Bedrock →      │
└─────────────────────────┘        └────────────┬───────────┘        │  Offline fallback chain  │
                                                │                    └──────────────────────────┘
                                                │ Save / Read (user-scoped)
                                                ▼
                                   ┌────────────────────────────┐
                                   │   MongoDB Atlas            │
                                   │   users collection         │
                                   │   analyses collection      │
                                   │   (userId-scoped records)  │
                                   └────────────────────────────┘
```

**Architecture rules:**
- The Frontend **never** talks directly to the Python service — all requests go through the Node.js backend (API Gateway)
- Every API endpoint except `/auth/*` requires a valid JWT in the `Authorization: Bearer` header
- Each user sees **only their own** analysis history — records are scoped by `userId`
- CORS is restricted to the whitelisted frontend origin — no cross-site API calls allowed

---

## 2. How a Request Flows End-to-End

Here is the complete journey for a first-time user through registration, then analysis:

```
━━━ STEP 0: AUTHENTICATION (happens once per session) ━━━━━━━━━━━━━━━━━━━━━━━━━

User opens app
        │
        ▼
[0a] AuthGate checks localStorage for cm_token
     ├── Token found & valid → skip to MainApp
     └── No token → show LoginPage or RegisterPage

User submits Register form
        │
        ▼
[0b] LoginPage / RegisterPage → POST /auth/register (or /auth/login)
     Rate limiter: max 10 login / 5 register attempts per IP per window
        │
        ▼
[0c] server.js → bcrypt.hash(password, 12) → User.create() → jwt.sign()
     Returns: { token, user: { id, name, email } }
        │
        ▼
[0d] AuthContext.login() stores token + user in localStorage
     AuthGate re-renders → MainApp now visible

━━━ STEP 1–5: CODE ANALYSIS (every "ANALYZE CODE" click) ━━━━━━━━━━━━━━━━━━━━━

User clicks "ANALYZE CODE"
        │
        ▼
[1] App.js → POST /analyze
    Headers: { Authorization: "Bearer <jwt>" }
    Body: { code: "...", language: "java" }
    UI immediately shows SkeletonLoader (shimmer placeholder)
        │
        ▼
[2] server.js → verifyToken middleware
    ├── Invalid / expired token → 401/403, user forced back to login
    └── Valid token → req.user = { id, name, email }
    Input guard: code.length > 50,000 chars → 413 rejected
    MD5 hash → MongoDB cache lookup
    ├── Cache HIT  → ⚡ return cached result (~5ms). No AI call.
    └── Cache MISS → axios → POST http://localhost:8000/analyze
        │
        ▼
[3] app.py receives the code.
    Step A: validate_env() already ran at startup — clients pre-initialized.
    Step B: detect_language() — verifies language matches user selection.
    Step C: analyze_offline() — instant static heuristic analysis (no internet).
    Step D: get_ai_enhancement() — 3-tier AI fallback:
              ① Gemini Flash (10s timeout) → on 429 or timeout → ② immediately
              ② AWS Bedrock Nova Micro (10s timeout) → on error → ③
              ③ Offline result only (always succeeds)
    Returns: { time, space, warnings, suggestions, _ai_provider }
        │
        ▼
[4] server.js receives the result.
    Saves to MongoDB with { codeHash, userId: req.user.id } — user-scoped.
    Sends result + _id + _cached:false back to React.
        │
        ▼
[5] App.js receives the result.
    SkeletonLoader replaced by ResultPanel with TC, SC, warnings, tips.
    Adds to sidebar history (user sees only their own entries).
```

---

## 3. Frontend (React)

**Location:** `frontend/src/`

The frontend is a single-page React application. It has no page routing — the entire experience happens on one screen that dynamically changes based on state.

### 3.1 `App.js` — The Brain

This is the root component that holds all the application state and orchestrates everything.

**Location:** `frontend/src/`

The frontend is a single-page React application with a JWT-based auth gate. Unauthenticated users see Login/Register; authenticated users see the full dashboard.

### 3.1 `App.js` — Root Component

Wraps the app in `<AuthProvider>` and uses `<AuthGate>` to decide what to render.

**Architecture:**
```
<App>
  <AuthProvider>          ← provides user/token/login/logout globally
    <AuthGate>            ← shows Login or Register if not authenticated
      <MainApp />         ← full dashboard (previously the entire App component)
    </AuthGate>
  </AuthProvider>
</App>
```

**`MainApp` State Variables:**

| State | Type | Purpose |
|---|---|---|
| `code` | string | The code currently typed in the editor |
| `language` | string | Selected language: `"c"`, `"java"`, or `"python"` |
| `result` | object | The analysis result `{ time, space, warnings, suggestions }` |
| `loading` | boolean | `true` while waiting for the API — triggers SkeletonLoader |
| `isHistoryLoading` | boolean | `true` while fetching history from MongoDB — triggers sidebar skeleton |
| `hasAnalyzed` | boolean | Triggers the layout shift (editor + report side-by-side) |
| `isWarmedUp` | boolean | `false` until WarmupScreen confirms all services online |
| `history` | array | Past analyses loaded from MongoDB (user-scoped) |
| `darkMode` | boolean | `true` = dark theme, `false` = light theme |
| `topSectionHeight` | number | Height (px) of the editor area, draggable by user |

**Key Functions in `MainApp`:**

- **`authHeaders()`** — Memoized helper that returns `{ "Content-Type": "application/json", "Authorization": "Bearer <token>" }` for every fetch call.
- **`analyzeCode()`** — POSTs code+language to `/analyze` with auth header. Handles language mismatch 422 errors and cache-hit flags.
- **`loadFromHistory(item)`** — Repopulates the editor from a sidebar item.
- **`resetAnalysis()`** — Clears code, result, and layout back to the hero view.
- **Resize Logic** — `mousedown`/`mousemove`/`mouseup` listeners let the user drag the editor/AI panel border.

**On startup**, `MainApp` fetches `/history` with the JWT header to pre-populate the sidebar with the user's last 20 analyses.

---

### 3.2 Authentication Components

#### `context/AuthContext.js` — Global Auth State

- Provides `user`, `token`, `isAuthenticated`, `login()`, `logout()` to the entire app via React Context.
- On mount: reads `cm_token` and `cm_user` from `localStorage` so the session survives page refresh.
- `login(userData, jwt)` — saves both to state and `localStorage`.
- `logout()` — clears state and `localStorage`; `AuthGate` immediately shows `LoginPage`.
- Consumed via `const { token, user, logout } = useAuth()` in any component.

#### `components/LoginPage.js` — Login UI

- Full-screen glassmorphism card with three animated background orbs (cyan + violet).
- Fields: **Email**, **Password** (with show/hide toggle eye button).
- Error banner with shake animation on invalid credentials.
- On success: calls `AuthContext.login()` → `AuthGate` re-renders to `MainApp`.
- Link to switch to RegisterPage (no page navigation — state swap in `AuthGate`).

#### `components/RegisterPage.js` — Register UI

- Matches the LoginPage aesthetic exactly.
- Fields: **Full Name**, **Email**, **Password**, **Confirm Password**.
- Live **password strength meter** — 5-bar indicator, colour-coded (red → amber → green).
- Real-time **password match indicator** — shows `✓ Passwords match` / `Passwords do not match`.
- Auto-logs in after successful registration (no extra login step needed).

#### `UserBadge` (inline in `App.js`)

- Rendered inside the `Header` via `userSlot` prop.
- Shows a **gradient avatar circle** (user initials) + display name + chevron icon.
- Clicking opens a **dropdown** with user email and a red **Sign out** button.
- Clicking outside closes it (uses `mousedown` listener on `document`).
- Sign out calls `AuthContext.logout()` → `AuthGate` immediately shows `LoginPage`.

---

### 3.3 Component Breakdown

#### `Header.js`
- Displays the CodeMind AI brand name in the top navigation bar.
- Accepts a `userSlot` prop — renders whatever JSX is passed (used by `App.js` to inject `<UserBadge />`).
- Contains the **dark/light mode toggle** button alongside the user badge.
- Props: `darkMode`, `setDarkMode`, `userSlot`.

#### `Sidebar.js`
- A slide-in panel on the left side of the screen.
- Displays the history of past analyses as a list of clickable cards.
- Each card shows the language, timestamp, and a short summary.
- Clicking a card calls `loadFromHistory()` in `App.js`.
- Has a **"New Analysis"** button that calls `resetAnalysis()`.
- **Skeleton loader:** While `isHistoryLoading === true`, shows 4 shimmer rows (circular icon bone + text bone) instead of the real list. Once MongoDB responds, the real history replaces the skeleton. Uses the same `.skeleton-bone` CSS class as `SkeletonLoader.js`.

#### `CodeEditor.js`
- Powered by `@monaco-editor/react` for a premium, VS Code-like editing experience.
- Uses the `'Fira Code'` monospace font at `14px`.
- Configured to disable semantic and syntax validation during `beforeMount` (no distracting red squiggly lines), providing clean syntax highlighting without IDE-level noise.
- Fully controlled by React (value and onChange tied to the `code` state).

#### `ResultPanel.js`
- Displays the analysis result after a successful call.
- When `loading === true`, renders `<SkeletonLoader />` instead of real content.
- When data arrives, displays:
  1. **TC/SC Cards:** Two side-by-side cards with colour-coded top borders (cyan for TC, violet for SC).
  2. **Warnings & Tips (Interactive Grid):** Conditionally rendered lists of actionable insights parsed from the AI. Rendered as a responsive 2-column CSS Grid.
  3. Cards feature hover micro-interactions (translateY lift and shadow) and distinct bold headers (Red for Security/Performance, Blue for Actionable Improvements) without bullet markers. The literal "Label:" text from AI output is stripped for a cleaner look.

#### `SkeletonLoader.js`
- A premium shimmer loading placeholder that mirrors the exact layout of `ResultPanel`.
- Shown while `loading === true` — replaces the old plain `"Calculating..."` text.
- Structure matches the real result panel:
  - Two side-by-side cards (cyan/violet top borders) with animated shimmer bones for TC/SC labels and values.
  - A warning block (amber left border) with shimmer lines.
  - A tips block (cyan left border) with shimmer lines.
- Uses `<Bone>` sub-component for individual animated grey placeholder blocks.
- The shimmer animation sweeps a light gradient left-to-right at `1.6s` loop.
- Fully responsive to dark/light mode via CSS variables.

#### `ComplexityGraph.js`
- Renders a visual SVG line graph below the ResultPanel.
- Takes the `complexity` prop (e.g., `"O(n^2)"`) and maps it to a growth curve function.
- Plots points from `n=0` to `n=50` to visually show how the algorithm's runtime would scale.

#### `AiAssistant.js`
- A collapsible chat panel pinned to the bottom of the screen.
- Imports `useAuth` and passes `Authorization: Bearer <token>` on every `/ask-ai` fetch — required since `/ask-ai` is now a protected endpoint.
- **Claude-style Input Area:** Multi-line auto-resizing `<textarea>` (max 150px). `Enter` sends, `Shift+Enter` newlines.
- **Integrated Toolbar:** Bottom toolbar with `+` icon, `CodeMind AI` model label, and send button.
- **New Chat Control:** `+ New Chat` button clears conversation history.
- **Resizable:** Top and bottom drag handles resize chat window height.
- **Chat Flow:** User question → immediate UI append → POST `/ask-ai` → skeleton loader → AI markdown response.

---

### 3.3 `index.css` — The Theme System

The entire colour theme is managed using **CSS Custom Properties (Variables)** defined in `:root` and overridden in `.light-mode`.

**Dark Mode (default):**
```css
:root {
  --bg-main: #0f172a;       /* Page background (darkest) */
  --bg-panel: #1e293b;      /* Cards and panels */
  --bg-input: #1e293b;      /* Input fields and toolbars */
  --primary: #06b6d4;       /* Cyan — Time Complexity, highlights */
  --secondary: #8b5cf6;     /* Violet — Space Complexity */
  --warning: #facc15;       /* Amber — Warnings */
  --text-main: #e2e8f0;     /* Primary text */
  --text-dim: #94a3b8;      /* Secondary/muted text */
  --border: #334155;        /* Dividers and borders */
}
```

**Light Mode** overrides the same variables with lighter colours, so **no component needs to know about the current theme**.

**Skeleton Shimmer Animation (added):**
```css
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
.skeleton-bone {
  background: linear-gradient(90deg, var(--bg-input) 25%, var(--border) 50%, var(--bg-input) 75%);
  background-size: 600px 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
```
Skeleton card shells use the same `border-top` colours as real TC/SC cards (`--primary`, `--secondary`) so the layout feels like a true placeholder of the incoming result.

---

## 4. Backend (Node.js / Express)

**Location:** `backend/`
**Port:** `5000`

The Node.js server is the **API Gateway + Auth Server**. Its jobs:

1. **Authenticate** — Issue and verify JWT tokens via `/auth/*` routes.
2. **Authorize** — Verify JWT on every protected endpoint before processing.
3. **Cache** — Check MongoDB for a cached result before calling the ML service.
4. **Proxy** — Forward cache-miss requests to the Python ML service.
5. **Persist** — Save results with `userId` + MD5 hash to MongoDB.
6. **Serve** — Return user-scoped analysis history to the frontend.

### 4.1 File Structure

```
backend/
├── server.js                   ← Main entry point, mounts all routes
├── .env                        ← PORT, MONGO_URL, ML_SERVICE_URL, JWT_SECRET, FRONTEND_URL
├── models/
│   ├── User.js                 ← Mongoose schema: name, email, password (hashed)
│   └── Analysis.js             ← Mongoose schema: userId, code, language, result, codeHash
├── routes/
│   └── auth.js                 ← POST /auth/register, POST /auth/login, GET /auth/me
└── middleware/
    └── authMiddleware.js       ← verifyToken — reads Bearer token, attaches req.user
```

### 4.2 Middleware Stack

```js
// 1. Security headers (15 HTTP security headers)
app.use(helmet({ contentSecurityPolicy: false }));

// 2. CORS — whitelisted origins only (was fully open before)
app.use(cors({
  origin: ["http://localhost:3000", process.env.FRONTEND_URL, "https://codemind-frontend.onrender.com"],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

// 3. Body parser with 1MB payload limit (guards against oversized submissions)
app.use(express.json({ limit: "1mb" }));

// 4. Global rate limiter (all routes)
// 200 req / 15 min per IP — catches general abuse
app.use(globalLimiter);

// 5. Auth routes (mounted before verifyToken so login/register are public)
app.use("/auth", authRoutes);
```

**Helmet** sets these key headers:

| Header | Purpose |
|---|---|
| `X-Frame-Options: SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `Strict-Transport-Security` | Forces HTTPS |
| `X-DNS-Prefetch-Control: off` | Disables DNS prefetching |
| `Referrer-Policy: no-referrer` | Stops referrer leaking |

### 4.3 Request Caching (MD5)

Every `/analyze` request is hashed before calling the ML service:

```js
function hashCode(code) {
  return crypto.createHash("md5").update(code.trim()).digest("hex");
}
```

- `code.trim()` prevents cache misses from trailing whitespace.
- Hash stored in MongoDB as `codeHash` with `index: true` for O(1) lookup.
- Cache is **global** (not user-scoped) — two users submitting identical code share the same cached result, reducing AI costs.
- History records **are** user-scoped via `userId`.

```
POST /analyze  (with valid JWT)
    ↓
Input guard: code.length > 50,000? → 413 rejected
    ↓
hashCode(code) = "a3f8c1d2…"
    ↓
MongoDB.findOne({ codeHash })
    ├─ HIT  → ⚡ return cached result instantly (~5ms)
    └─ MISS → 🔍 call ML service → save with { codeHash, userId } → return fresh result
```

### 4.4 API Endpoints

#### Auth Routes (public — no JWT required)

##### `POST /auth/register`
- Rate limited: **5 requests / IP / hour** (prevent mass account creation)
- Body: `{ name, email, password }`
- Validates: all fields present, password ≥ 6 chars, email not already registered
- Action: `bcrypt.hash(password, 12)` → `User.create()` → `jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: "7d" })`
- Returns: `{ token, user: { id, name, email } }` with HTTP 201

##### `POST /auth/login`
- Rate limited: **10 requests / IP / 15 min** (prevent brute-force)
- Body: `{ email, password }`
- Action: `User.findOne({ email })` → `bcrypt.compare(password, user.password)` → `jwt.sign()`
- Returns: `{ token, user: { id, name, email } }` or 401 with `"Invalid email or password."`
- Generic error message used for both "user not found" and "wrong password" — prevents user enumeration

##### `GET /auth/me`
- Requires JWT (uses `verifyToken` middleware)
- Returns the current user's profile from the database
- Used by frontend on mount to validate a stored token is still valid

#### Protected Routes (JWT required via `verifyToken`)

##### `POST /analyze`
**Body:** `{ code: string, language: string }`

1. `verifyToken` checks `Authorization: Bearer <token>` header → attaches `req.user`
2. Input validation: rejects empty code, wrong type, or code > 50,000 chars (413)
3. MD5 cache lookup (global, not user-scoped)
4. Cache hit → return immediately with `_cached: true`
5. Cache miss → forward to Python ML service (40s axios timeout)
6. Save result with `{ codeHash, userId: req.user.id }` to MongoDB
7. Return result with `_id`, `_cached: false`

##### `GET /history`
1. `verifyToken` extracts `req.user.id`
2. Queries: `Analysis.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(20)`
3. Returns only **this user's** last 20 records (was returning all users' records before the fix)

##### `POST /ask-ai`
**Body:** `{ code: string, question: string, history: array }`

1. `verifyToken` required
2. Validates question is not empty
3. Proxies to `ML_SERVICE_URL/ask-ai` (40s timeout)
4. Returns `{ answer, _ai_provider }`

#### `GET /`
Health check. Returns: `{ status: "ok", service: "CodeMind Backend", port: PORT }`

---

## 5. ML Service (Python / Flask)

**Location:** `ml-service/app.py`
**Port:** `8000`

This is the intelligence core of CodeMind AI. It runs a startup validation, then handles requests through static analysis + AI enhancement.

### 5.1 Environment Validation (`validate_env`)

Runs **immediately at startup**, before any client is initialized. Prints a clear status table:

```
============================================================
  CodeMind AI — ML Service Startup Check
============================================================
  ✅  GEMINI_API_KEY           AIzaSy…         (Primary AI provider)
  ✅  AWS_ACCESS_KEY_ID        AKIAX4…         (Bedrock fallback)
  ✅  AWS_SECRET_ACCESS_KEY    wJalrX…         (Bedrock fallback)
  ✅  AWS_REGION               us-east-1       (Bedrock region)
------------------------------------------------------------
  🟢  Mode: Gemini (primary) → Bedrock (fallback) → Offline
============================================================
```

Missing keys are shown with `❌ MISSING` and the active mode is reported:

| Keys present | Mode shown |
|---|---|
| Both Gemini + AWS | 🟢 Gemini → Bedrock → Offline |
| Gemini only | 🟡 Gemini → Offline |
| AWS only | 🟡 Bedrock → Offline |
| Neither | 🔴 Offline only |

This eliminates silent startup failures — you always know what is active before the first request.

### 5.2 Language Detection (`detect_language`)

Before analyzing, the service verifies the submitted code using **regex pattern matching**:

| Language | Detection Signals |
|---|---|
| Python | `def` keyword, indented blocks (`:`), `import` without semicolons |
| C | `#include`, `printf`, `int main(` with braces |
| Java | `public class`, `public static void main`, `System.out.println` |

If the detected language does not match what the user selected, the service returns a `422` error response via `error_response()`.

### 5.3 Offline Heuristic Engine (`analyze_offline`)

This function runs **without the internet** using pure static code analysis. It reads the code line by line and looks for patterns:

**Time Complexity Logic:**

```
No loops, no recursion              → O(1)
1 level of looping                  → O(n)
1 loop with /=2 or >>= (halving)    → O(log n)
Built-in sort detected              → O(n log n)
2 nested loops                      → O(n²)
2 nested loops + halving            → O(n log n)
3+ nested loops                     → O(n^k) where k = nesting depth
Self-calling function (body scan)   → O(n) recursive
Two recursive self-calls (e.g. fib) → O(2^n) exponential
```

**Space Complexity Logic:**
```
No dynamic memory                   → O(1)
new[], malloc, ArrayList, vector    → O(n)
HashMap / dict / Counter / Set      → O(n)
Recursion detected                  → O(n) call stack
Dynamic alloc + 2+ nested loops     → O(n²)
```

**Additional Pattern Detection:**

| Pattern | What It Detects | Action |
|---|---|---|
| `sorted()`, `.sort()`, `Arrays.sort` | Built-in sorting | Reports O(n log n) |
| `dict`, `HashMap`, `Counter`, `defaultdict` | Hash structures | Reports O(n) space + tip |
| `+= variable` inside a loop | Hidden O(n²) string building | Warns to use `join()` |
| `mid = (lo + hi) // 2` in loop body | Floor-division halving | Reports O(log n) |
| Two recursive calls in function body | Exponential branching | Warns to use memoization/DP |
| Stricter recursion — body-only scan | Ignores function definition line | Reduces false positives |

**Warning / Suggestion format:**
All generated messages follow the `"Label: explanation"` pattern:
```
"Nested Loop Risk: comparing every pair causes O(n²) slowdown on large inputs."
"Use a HashMap: store seen values in a dict to reduce lookup to O(1)."
```

This step is instant (microseconds) — no network call ever made.

### 5.4 AI Enhancement (`get_ai_enhancement`) — Smart Fallback Chain

After offline analysis gives an initial estimate, this function runs a **3-tier fallback chain**:

```
① Gemini Flash (primary) — 10s hard timeout
        │  429 rate limit / timeout / any error?
        ▼  (switches immediately, no retry delay)
② AWS Bedrock — Amazon Nova Micro — 10s hard timeout
        │  Credentials missing / error / timeout?
        ▼
③ Offline result only (always works, no network)
```

**Tier 1 — Google Gemini (`gemini-2.0-flash`)**
- Sends the code + offline estimate in a structured prompt.
- Prompt instructs AI to write code-specific warnings in `"Label: sentence"` format.
- Uses `max_output_tokens=200`, `temperature=0.2` for fast, focused responses.
- **10-second HTTP timeout** via `http_options=types.HttpOptions(timeout=10_000)`.
- On `429`, timeout, or any error → switches to Tier 2 **immediately** (no wait).

**Tier 2 — AWS Bedrock (`us.amazon.nova-micro-v1:0`)**
- Uses Amazon Nova Micro: AWS-native, always free, never marked Legacy.
- Requires `us.` cross-region inference profile prefix (mandatory for all modern Bedrock models).
- **10-second connect + read timeout** via `botocore.config.Config(connect_timeout=10, read_timeout=10, retries={"max_attempts": 1})`.
- Uses Nova's request/response schema (different from Anthropic Claude):
  ```python
  # Request
  {"messages": [{"role": "user", "content": [{"text": prompt}]}],
   "inferenceConfig": {"maxTokens": 200, "temperature": 0.2}}
  # Response
  response_body["output"]["message"]["content"][0]["text"]
  ```
- If credentials missing or any error → falls through to Tier 3.

**Tier 3 — Offline Only**
- Returns the `analyze_offline()` result as-is.
- Appends a note to `suggestions`: `"AI verification unavailable. Showing offline results."`
- Always succeeds — zero external dependencies.

**Fallback detection** (`is_rate_limit_error`) catches all these cases:
- `TimeoutError`, `socket.timeout` (Python built-in timeouts)
- String keywords: `"429"`, `"resource_exhausted"`, `"rate limit"`, `"quota"`, `"throttl"`, `"timeout"`, `"timed out"`

The response always includes `_ai_provider`: `"gemini"` | `"bedrock"` | `"offline"`.

### 5.5 Centralized Error Response (`error_response`)

All Flask routes use a single helper for consistent error shapes:

```python
def error_response(message, code=400, detail=None):
    body = {"error": message, "code": code}
    if detail:
        body["detail"] = detail
    return jsonify(body), code
```

**Consistent error shape across all routes:**

| Route | Scenario | HTTP Code | Response |
|---|---|---|---|
| `/analyze` | No code in body | 400 | `{"error": "No code provided.", "code": 400}` |
| `/analyze` | Language mismatch | 422 | `{"error": "Language mismatch: ...", "code": 422, "detail": "detected:java"}` |
| `/analyze` | Internal exception | 500 | `{"error": "Internal analysis error.", "code": 500, "detail": "..."}` |
| `/ask-ai` | Both AI providers down | 503 | `{"error": "Both AI providers unavailable.", "code": 503, "detail": "..."}` |

Before this change, each route returned a different shape (`{"time": "N/A"}`, `{"answer": "..."}`, etc.), making frontend error handling inconsistent.

### 5.6 API Routes

#### `GET /`
Health check. Returns:
```json
{
  "status": "ML Service Running",
  "port": 8000,
  "ai_providers": {
    "gemini": "enabled",
    "bedrock": "enabled"
  }
}
```

#### `POST /analyze`
1. Extracts `code` and `language` from the request body.
2. Returns `error_response("No code provided.", 400)` if code is empty.
3. Runs `detect_language()` — returns `422` on mismatch.
4. Runs `analyze_offline()` for instant heuristic results (always runs).
5. Passes results to `get_ai_enhancement()` — Gemini → Bedrock → Offline.
6. Returns final merged JSON including `_ai_provider` field.

#### `POST /ask-ai`
1. Receives `{ code, question }` from the backend proxy.
2. **Validates input:** returns `400` if question is empty or exceeds 500 characters.
3. Builds a **structured prompt** with role + code context + format instructions:
   ```python
   prompt = f"""You are a senior software engineer helping a developer understand their code.

   Code being analyzed:
   ```
   {code[:3000]}
   ```

   Developer's question: {question}

   Instructions:
   - Answer in 2-4 sentences maximum
   - Be specific to the code shown above (if provided)
   - Use plain English — avoid unnecessary jargon
   - If the question is about complexity, mention Big-O notation
   - If you suggest an improvement, show a one-line code example
   - Do NOT repeat the question back"""
   ```
4. Code is capped at **3000 characters** to prevent token overflow on AI providers.
5. Routes through the same Gemini → Bedrock → Offline fallback chain.
6. Returns `{ answer, _ai_provider }` or `error_response(503)` if all providers fail.

---

## 6. Database (MongoDB)

**Database Name:** `codemind`
**Provider:** MongoDB Atlas (cloud) / `localhost:27017` (local dev)

MongoDB serves three purposes:
1. **Auth** — Stores user accounts in the `users` collection.
2. **History** — Stores analysis results per-user in the `analyses` collection.
3. **Cache** — `codeHash` field enables instant lookup for duplicate code submissions (global, not user-scoped).

### `users` Collection — `models/User.js`

```js
{
  name:      String,          // Display name (trimmed, min 2 chars)
  email:     String,          // Unique, lowercase, validated format
  password:  String,          // bcrypt hash (12 salt rounds) — NEVER stored plain
  createdAt: Date             // Auto-set on account creation
}
```

- `email` has `unique: true` — enforced at both schema and DB index level.
- Password is hashed via `bcrypt.hash(password, 12)` before storage.
- The `/auth/me` endpoint always selects with `.select("-password")` — hash never sent to client.

### `analyses` Collection — `models/Analysis.js`

```js
{
  userId:    ObjectId,        // Ref: users._id — INDEXED, scopes record to one user
  code:      String,          // The submitted source code
  language:  String,          // "c", "java", or "python"
  result:    Object,          // { time, space, warnings, suggestions, _ai_provider }
  codeHash:  String,          // MD5 of code.trim() — INDEXED for O(1) cache lookup
  timestamp: Date             // Auto-set to current time on save
}
```

- `userId` has `index: true` — fast per-user history queries.
- `codeHash` has `index: true` — fast global cache lookups.
- **Privacy rule:** every `Analysis.find()` call MUST include `{ userId: req.user.id }` to prevent data leakage.

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Port the Node.js server listens on |
| `MONGO_URL` | `mongodb://localhost:27017/codemind` | MongoDB connection string |
| `ML_SERVICE_URL` | `http://localhost:8000` | URL of the Python ML service |
| `JWT_SECRET` | *(required)* | Secret key for signing/verifying JWTs. Use a long random string in production. |
| `FRONTEND_URL` | *(optional)* | Additional CORS-allowed origin for production (e.g. `https://codemind-frontend.onrender.com`) |

### ML Service (`ml-service/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | Google Gemini API key — primary AI provider |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials for Bedrock fallback |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials for Bedrock fallback |
| `AWS_REGION` | `us-east-1` | AWS region for Bedrock |
| `FLASK_ENV` | `development` | Set to `production` on Render |

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `REACT_APP_BACKEND_URL` | `http://localhost:5000` | URL of the Node.js backend |
| `REACT_APP_ML_URL` | `http://localhost:8000` | URL of the ML service (used by WarmupScreen pings) |

> **REACT_APP_* variables** are baked into the static bundle at build time — they are NOT runtime env vars.

> **JWT_SECRET** must be a long random string in production. Never commit it to Git. Add to Render environment variables.

> **Startup validation:** The ML service prints a full status table on every start confirming which AI providers are active. See Section 5.1.

---

## 8. How to Run Locally

You need **3 terminals** running simultaneously.

**Terminal 1 — ML Service (Python):**
```bash
cd ml-service
# First time only:
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt   # all versions pinned

# Create ml-service/.env:
# GEMINI_API_KEY=your_gemini_key
# AWS_ACCESS_KEY_ID=your_aws_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret
# AWS_REGION=us-east-1

python app.py
# Prints env validation table, then:
# ✅ Gemini AI Client Initialized
# ✅ AWS Bedrock Client Initialized (Region: us-east-1)
# Runs on http://localhost:8000
```

**Terminal 2 — Backend (Node.js):**
```bash
cd backend
npm install   # first time only

# Create backend/.env:
# PORT=5000
# MONGO_URL=mongodb://localhost:27017/codemind
# ML_SERVICE_URL=http://localhost:8000
# JWT_SECRET=any_long_random_string_for_local_dev

node server.js
# 🚀 Node Backend running on http://localhost:5000
# ✅ MongoDB Connected
# 🛡️  CORS allowed origins: http://localhost:3000, ...
```

**Terminal 3 — Frontend (React) — Development Mode:**
```bash
cd frontend
npm install   # first time only

# Create frontend/.env:
# REACT_APP_BACKEND_URL=http://localhost:5000
# REACT_APP_ML_URL=http://localhost:8000

npm run dev   # ← USE THIS for development (hot-reload, no rebuild needed)
# Runs on http://localhost:3000 with instant source changes

# Only use these for production testing:
# npm run build   ← compiles src/ into build/ (~60 seconds)
# npm start       ← serves the compiled build/ folder
```

> **⚠️ Important:** `npm start` serves the pre-compiled `build/` folder, NOT the source files.
> Always use `npm run dev` during development for live hot-reload.

---

## 9. Unit Tests

**Location:** `ml-service/tests/test_analyze_offline.py`
**Framework:** `pytest`
**Config:** `ml-service/pytest.ini` (suppresses third-party DeprecationWarnings)

### Running Tests

```bash
cd ml-service
.\venv\Scripts\activate
.\venv\Scripts\python.exe -m pytest tests/ -v
```

Expected output:
```
12 passed in ~4s
```

### Test Coverage

All 12 tests cover every branch of the `analyze_offline()` function:

| # | Test                             | Input                  | Expected Time  | Expected Space |
|---|---                               |---                     |---             |---             |
| 1 | `test_constant_time`             | Simple addition        | `O(1)`         | `O(1)`         |
| 2 | `test_linear_single_loop`        | Linear search          | `O(n)`         | `O(1)`         |
| 3 | `test_quadratic_nested_loops`    | Bubble sort            | `O(n²)`        | `O(1)`         |
| 4 | `test_logarithmic_binary_search` | Binary search (`// 2`) | `O(log n)`     | `O(1)`         |
| 5 | `test_builtin_sort`              | `arr.sort()`           | `O(n log n)`   | `O(1)`         |
| 6 | `test_linear_recursion`          | Factorial              | `O(n)`         | `O(n)`         |
| 7 | `test_exponential_recursion`     | Fibonacci              | `O(2^n)`       | `O(n)`         |
| 8 | `test_hashmap_space`             | Two-sum with `dict`    | `O(n)`         | `O(n)`         |
| 9 | `test_string_concat_warning`     | `result += word` in loop | —            |Warning present |
| 10 | `test_deep_nesting_warning`     | Triple nested loop    | `O(n^3)`        |Warning present |
| 11 | `test_short_code_warning`| `x = 1`                | —              | Short snippet warning |
| 12 | `test_java_nested_loops`       | Java bubble sort (`{}` braces) | `O(n²)` | `O(1)`         |

### Bugs Found by Tests

The test suite caught **2 real bugs** in the offline engine that were fixed:

| Bug | Root Cause | Fix |
|---|---|---|
| `binary_search` was returning `O(n)` instead of `O(log n)` | `mid = (lo + hi) // 2` floor-division pattern wasn't detected | Added `=.*//\s*2\b` regex to the loop-body scan |
| `result += word` (variable concat) didn't trigger string concat warning | Regex only matched `+= "literal"` string literals | Broadened to `\w+\s*\+=\s*\w+` to catch variable concat |

---

## 10. CI/CD Pipeline (GitHub Actions)

**Location:** `.github/workflows/`

CodeMind AI uses **GitHub Actions** for automated testing and deployment. Every push to the `main` branch triggers a full pipeline that validates all three services and then deploys them to Render.

---

### 10.1 Workflow File Structure

```
.github/
└── workflows/
    ├── frontend.yml      ← CI: React build check (triggers on frontend/** changes)
    ├── backend.yml       ← CI: Node.js syntax check (triggers on backend/** changes)
    ├── ml-service.yml    ← CI: Pytest suite (triggers on ml-service/** changes)
    └── deploy.yml        ← CD: Full deploy to Render (triggers on push to main)
```

---

### 10.2 Pipeline Flow

```
Developer pushes to main
         │
         ▼
┌────────────────────────────────────────────────┐
│              GitHub Actions Triggered          │
└────────────────────────────────────────────────┘
         │
    ┌────┴──────────────────┐
    │                       │                      │
    ▼                       ▼                      ▼
[frontend-ci]        [backend-ci]         [ml-service-ci]
Install npm deps     Install npm deps     Install pip deps
npm install          node --check         python -m pytest
--legacy-peer-deps   server.js            test_analyze_offline.py
npm run build        (syntax only)        (12 tests, no API keys)
    │                       │                      │
    └───────────────────────┴──────────────────────┘
                            │ All 3 pass ✅
                            ▼
          ┌────────────────────────────────┐
          │   Deploy jobs run in parallel  │
          └────────────────────────────────┘
         ┌──────┬───────────┬──────────────┐
         ▼      ▼           ▼
 [deploy-frontend] [deploy-backend] [deploy-ml-service]
  curl Render       curl Render      curl Render
  webhook URL       webhook URL      webhook URL
         │               │                │
         └───────────────┴────────────────┘
                         │
                         ▼
                  [notify job]
              Prints deploy summary
              (URL, commit SHA, author)
```

---

### 10.3 Workflow Files Explained

#### `frontend.yml` — React CI

| Step | Command | Why |
|---|---|---|
| Checkout | `actions/checkout@v4` | Clone repo into VM |
| Node.js setup | `actions/setup-node@v4` (v18) | Install Node with npm cache |
| Install deps | `npm install --legacy-peer-deps` | React 19 needs this flag to bypass react-scripts peer dep conflict |
| Build | `npm run build` | Validates the whole app compiles correctly |
| Upload artifact | `actions/upload-artifact@v4` | Saves the `build/` folder for 7 days |

#### `backend.yml` — Node.js CI

| Step | Command | Why |
|---|---|---|
| Install deps | `npm install` | Installs express, mongoose, axios etc. |
| Syntax check | `node --check server.js` | Validates JS syntax without running the server (no MongoDB needed) |

#### `ml-service.yml` — Python CI

| Step | Command | Why |
|---|---|---|
| Python setup | `actions/setup-python@v5` (3.10) | Matches production Python version |
| Install deps | `pip install -r requirements.txt` | Installs flask, boto3, pytest etc. |
| Run tests | `python -m pytest tests/test_analyze_offline.py -v` | Runs all 12 offline tests — no API keys required |

#### `deploy.yml` — Full CD Pipeline

Runs all 3 CI jobs inline, then if all pass, triggers Render deploy hooks for all 3 services simultaneously.

---

### 10.4 GitHub Secrets Required

> ⚠️ **IMPORTANT:** All sensitive values MUST go in the **Secrets** tab — NOT the Variables tab.
> Secrets are encrypted and show as `***` in logs. Variables are visible in plain text.

Go to: **GitHub repo → Settings → Secrets and variables → Actions → Secrets tab → New repository secret**

#### Secrets (sensitive — always encrypted)

| Secret Name | Value | Used In |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | `deploy.yml` (ML service) |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `deploy.yml` (ML service) |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `deploy.yml` (ML service) |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render webhook URL for frontend | `deploy.yml` |
| `RENDER_DEPLOY_HOOK_BACKEND` | Render webhook URL for backend | `deploy.yml` |
| `RENDER_DEPLOY_HOOK_ML` | Render webhook URL for ML service | `deploy.yml` |

#### Variables (non-sensitive — visible in plain text)

| Variable Name | Value | Used In |
|---|---|---|
| `AWS_REGION` | `us-east-1` | `deploy.yml` |

**How to get a Render deploy hook URL:**
1. Go to [render.com](https://render.com) → your service
2. **Settings** → scroll to **Deploy Hook**
3. Copy the URL → paste as a GitHub **Secret** (not Variable)

---

### 10.5 CI/CD Status Badges

The README displays live status badges for each workflow:

```markdown
[![Frontend CI](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/frontend.yml/badge.svg)](…)
[![Backend CI](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/backend.yml/badge.svg)](…)
[![ML Service CI](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/ml-service.yml/badge.svg)](…)
[![Deploy to Render](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/deploy.yml/badge.svg)](…)
```

These badges show ✅ green (passing) or ❌ red (failing) in real time on the GitHub repo page.

---

### 10.6 Monitoring & Debugging

**Check pipeline status:**
→ `https://github.com/Meenbudha/code-complexity-reviewer/actions`

**Re-run a failed pipeline without a new commit:**
1. Go to the Actions tab
2. Click the red ❌ run
3. Top-right → click **"Re-run all jobs"**

**Trigger the pipeline with an empty commit (no file changes needed):**
```bash
git commit --allow-empty -m "Trigger CI/CD pipeline"
git push origin main
```

**If a deploy job is skipped (secret not set):**
The deploy step prints a warning and exits cleanly (green ✅) instead of failing:
```
⚠️ RENDER_DEPLOY_HOOK_FRONTEND secret not set — skipping deploy.
   Add it: GitHub repo → Settings → Secrets → Actions → New secret
```

**Key design decisions:**
- `deploy.yml` uses `needs: [frontend-ci, backend-ci, ml-service-ci]` so deploys **never happen if any test fails**
- Deploy hooks use a `if [ -z "$HOOK" ]` bash guard — missing secrets skip gracefully instead of crashing
- Offline pytest tests require **zero secrets** — they test pure Python logic only
- `--legacy-peer-deps` is used instead of `npm ci` because React 19 has a peer dependency conflict with `react-scripts 5`

---

### 10.7 Secrets vs Variables — Critical Distinction

This is a common mistake when setting up GitHub Actions for the first time.

| | **Secrets** tab | **Variables** tab |
|---|---|---|
| **Visibility in logs** | Masked as `***` | Shown in plain text |
| **Use for** | API keys, passwords, webhook URLs | App names, region, feature flags |
| **Risk if wrong** | N/A | Sensitive data exposed to anyone with repo access |
| **Example** | `GEMINI_API_KEY`, `AWS_SECRET_ACCESS_KEY` | `AWS_REGION` |

**Bug encountered:** All secrets were initially added to the **Variables** tab, which exposed `AWS_SECRET_ACCESS_KEY` and `GEMINI_API_KEY` in plain text in workflow logs.

**Fix applied:**
1. Deleted all entries from the Variables tab
2. Re-added sensitive keys under the **Secrets** tab
3. Kept only `AWS_REGION` in Variables (safe — not sensitive)
4. Re-ran the pipeline → all deploy hooks fired correctly ✅

---

## 11. Deployment on Render

All three services are deployed on **[Render](https://render.com)** (free tier). Each service is a separate Render **Web Service** connected to the same GitHub repository.

---

### 11.1 Live URLs

| Service | URL | Type |
|---|---|---|
| **Frontend** | https://codemind-frontend.onrender.com | Static Site / Web Service |
| **Backend** | *(your-backend-name).onrender.com* | Web Service (Node.js) |
| **ML Service** | *(your-ml-service-name).onrender.com* | Web Service (Python) |

---

### 11.2 Render Service Configuration

#### Frontend Service

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Publish Directory** | `build` |
| **Service Type** | Static Site |

**Environment Variables (set in Render → frontend → Environment):**

| Variable | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | `https://your-backend.onrender.com` |
| `REACT_APP_ML_URL` | `https://your-ml-service.onrender.com` |

> ⚠️ These must be set **before** building, because React bakes `REACT_APP_*` vars into the static bundle at build time — they are NOT runtime env vars.

#### Backend Service

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Service Type** | Web Service |

**Environment Variables:**

| Variable | Value |
|---|---|
| `PORT` | `5000` (or leave blank — Render assigns) |
| `MONGO_URL` | MongoDB Atlas connection string |
| `ML_SERVICE_URL` | `https://your-ml-service.onrender.com` |

#### ML Service

| Setting | Value |
|---|---|
| **Root Directory** | `ml-service` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app --workers 2 --timeout 60 --bind 0.0.0.0:$PORT` |
| **Service Type** | Web Service |

**Why gunicorn instead of `python app.py`:**

Flask's built-in dev server is **single-threaded** — it can only handle one request at a time. Under concurrent load (e.g. two users analyzing at the same time), the second request queues behind the first.

Gunicorn spawns **2 worker processes**, each handling requests independently:
```
gunicorn app:app --workers 2 --timeout 60 --bind 0.0.0.0:$PORT
                  ^^^^^^^^                  ^^^^^^^^^^^^^^^^^^^^^^
                  2 parallel workers        uses Render's assigned port
```

**`--timeout 60`** prevents gunicorn from killing long-running AI requests (AI calls can take 3–15s).

**Procfile** (`ml-service/Procfile`) contains the raw start command:
```
gunicorn app:app --workers 2 --timeout 60 --bind 0.0.0.0:$PORT
```

> ⚠️ **Render does NOT use Procfile format** (`web: command`). It runs the Start Command as a raw shell command. The `web:` prefix is Heroku syntax and causes `bash: web:: command not found`. Always set the Start Command directly in Render → service → Settings.

**Environment Variables:**

| Variable | Value |
|---|---|
| `PORT` | Assigned by Render |
| `GEMINI_API_KEY` | Google Gemini API key |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | `us-east-1` |
| `FLASK_ENV` | `production` |

---

### 11.3 Render Deploy Hooks

Each service exposes a **Deploy Hook URL** (Render → service → Settings → Deploy Hook). These are stored as GitHub Secrets and triggered by the `deploy.yml` CI/CD workflow after all CI checks pass.

| GitHub Secret | Purpose |
|---|---|
| `RENDER_DEPLOY_HOOK_FRONTEND` | Triggers frontend rebuild on Render |
| `RENDER_DEPLOY_HOOK_BACKEND` | Triggers backend rebuild on Render |
| `RENDER_DEPLOY_HOOK_ML` | Triggers ML service rebuild on Render |

**Flow:** `git push origin main` → GitHub Actions CI → all tests pass → `curl` deploy hooks → Render rebuilds all 3 services.

---

### 11.4 GitHub Secrets Summary (Full)

All secrets stored at: **GitHub repo → Settings → Secrets and variables → Actions → Secrets tab**

| Secret Name | Purpose | Used In |
|---|---|---|
| `GEMINI_API_KEY` | Primary AI provider | `deploy.yml` |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock fallback | `deploy.yml` |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock fallback | `deploy.yml` |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render webhook | `deploy.yml` |
| `RENDER_DEPLOY_HOOK_BACKEND` | Render webhook | `deploy.yml` |
| `RENDER_DEPLOY_HOOK_ML` | Render webhook | `deploy.yml` |
| `RENDER_BACKEND_URL` | Keep-alive ping | `keep-alive.yml` |
| `RENDER_ML_URL` | Keep-alive ping | `keep-alive.yml` |

**GitHub Variables (non-sensitive):**

| Variable Name | Value |
|---|---|
| `AWS_REGION` | `us-east-1` |

---

### 11.5 Render Rollback

Render keeps a history of all past successful deployments. The **Rollback** button appears on every historical deploy entry in the **Deploys** tab.

```
Render → your service → Deploys tab

✅ Deploy #5  (current/live)
✅ Deploy #4                     [Rollback]  ← visible on every past deploy
✅ Deploy #3                     [Rollback]
✅ Deploy #2                     [Rollback]
```

**The Rollback button being visible is normal — it does NOT indicate a problem.**

| Situation | Action |
|---|---|
| ✅ Green deploy + Rollback button | Everything is fine. Button is just available. |
| ❌ Red failed deploy | Check logs. Fix code or env vars. Do NOT rollback unless previous version worked. |
| New deploy breaks production | Click Rollback to instantly revert to previous working build |

**When to use Rollback:**
- A push broke the live app and you need to restore it immediately
- Buying time while debugging a regression

**When NOT to use Rollback:**
- The issue is a missing environment variable — rollback won't help; fix the env var
- First deployment (no previous version to roll back to)

---

## 12. Cold Start & Performance

### 12.1 The Problem — Render Free Tier Spin-Down

Render's free tier **spins down every service after 15 minutes of inactivity**. When a new request arrives, the service must "wake up" — this takes **30–90 seconds** per service.

**Symptom:** Opening `codemind-frontend.onrender.com` shows a working UI, but all API calls to the backend and ML service silently fail because those services are still waking up.

**Old workaround (manual, broken):** Users had to manually open the backend and ML service URLs first to wake them up before using the frontend.

---

### 12.2 Solution A — WarmupScreen Component

**File:** `frontend/src/components/WarmupScreen.js`

A full-screen splash that is shown **before the main app renders**. It simultaneously pings the backend and ML service until both respond, then auto-launches the app.

```
User opens codemind-frontend.onrender.com
            │
            ▼
  ┌────────────────────────────┐
  │   WarmupScreen renders      │
  │   • Pings Backend URL       │
  │   • Pings ML Service URL    │
  │   • Shows spinner per svc   │
  │   • Progress bar + timer    │
  └────────────────────────────┘
            │ Both services respond HTTP 200
            ▼
  ┌────────────────────────────┐
  │   Main App launches ✅       │
  │   All features functional   │
  └────────────────────────────┘
```

**Key behaviour:**
- Retries ping every **4 seconds** until both services respond
- Times out after **90 seconds** and shows a retry button
- Passes `onReady` callback to App.js via `useCallback` — memoized to prevent re-renders
- Uses `AbortController` to cancel in-flight fetch requests on cleanup

**Env vars required on Render frontend service:**
```
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
REACT_APP_ML_URL=https://your-ml-service.onrender.com
```

---

### 12.3 Solution B — Keep-Alive Cron Job

**File:** `.github/workflows/keep-alive.yml`

A GitHub Actions workflow that runs on a **cron schedule every 10 minutes**, pinging all 3 Render services to prevent them from ever reaching the 15-minute spin-down threshold.

```yaml
on:
  schedule:
    - cron: "*/10 * * * *"   # Every 10 minutes, 24/7
  workflow_dispatch:          # Also triggerable manually
```

**Why this works:** Render only spins down after **15 minutes** of no traffic. Pinging every 10 minutes keeps the inactivity timer reset permanently.

**Services pinged:**

| Service | URL Source | Behaviour on missing secret |
|---|---|---|
| Frontend | Hardcoded in yml | Always pinged |
| Backend | `RENDER_BACKEND_URL` secret | Skips gracefully with warning |
| ML Service | `RENDER_ML_URL` secret | Skips gracefully with warning |

**Failure handling:** `curl` uses `|| echo "timeout/waking"` fallback — a slow or waking service does **not** fail the GitHub Actions job.

---

### 12.4 Cold Start Timeline (Before vs After)

| Scenario | Before fix | After fix |
|---|---|---|
| First visit after inactivity | ❌ API calls fail silently | ✅ WarmupScreen handles it |
| Services wake-up visibility | ❌ Blank / broken UI | ✅ Status shown per service |
| Services staying awake | ❌ Manual URL opening needed | ✅ Auto-pinged every 10 min |
| Time to usable app | 30–90s (invisible) | 30–90s (visible progress) |
| After keep-alive is running | N/A | ~instant (never sleeps) |

---

### 12.5 Performance Notes

- **MongoDB cache** (MD5 hash) eliminates repeated AI calls for identical code — response time drops from ~3s to ~5ms on cache hit
- **3-tier AI fallback** (Gemini → Bedrock → Offline) ensures analysis always completes even if AI providers are down
- **gunicorn 2 workers** on ML service handles concurrent requests without queuing
- **40s axios timeout** on backend gives ML service enough time to complete AI calls on cold starts
- **`express.json({ limit: "1mb" })`** hard-caps request size at middleware level before any route logic runs

---

## 13. Authentication & Security

This section documents the complete auth system added in v2.0, the security decisions behind each layer, and what each component does.

---

### 13.1 Authentication Flow (Full Detail)

```
┌─────────────┐     POST /auth/register     ┌──────────────────────────────┐
│             │  { name, email, password }  │                              │
│  Register   │ ──────────────────────────▶ │  registerLimiter             │
│  Page       │                             │  (max 5/IP/hour)             │
│             │                             │         ↓                    │
│             │                             │  Validate fields             │
│             │                             │  Check email uniqueness      │
│             │                             │  bcrypt.hash(password, 12)   │
│             │                             │  User.create()               │
│             │                             │  jwt.sign({ id, name, email })│
│             │ ◀────────────────────────── │  → { token, user }           │
└─────────────┘                             └──────────────────────────────┘
      │
      │  AuthContext.login(user, token)
      │  localStorage.setItem("cm_token", token)
      │  localStorage.setItem("cm_user", JSON.stringify(user))
      ▼
┌─────────────┐
│  AuthGate   │  isAuthenticated = true → renders MainApp
│  re-renders │
└─────────────┘
      │
      │  Every subsequent API call:
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  App.js authHeaders()                                           │
│  Returns: { "Authorization": "Bearer eyJhbGci..." }            │
│  Used in: /analyze, /history, /ask-ai, /auth/me                │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  authMiddleware.js (verifyToken)                                │
│                                                                 │
│  1. Read header: req.headers.authorization                      │
│  2. Split: "Bearer <token>" → extract token                     │
│  3. jwt.verify(token, JWT_SECRET)                               │
│     ├── Invalid signature → 403 Forbidden                       │
│     ├── Expired (>7 days) → 401/403                             │
│     └── Valid → req.user = { id, name, email }                  │
│  4. next() → route handler runs                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 13.2 Security Layers (Defence in Depth)

Every request passes through multiple independent security layers:

| Layer | Implementation | What it stops |
|---|---|---|
| **CORS whitelist** | `cors({ origin: [whitelist] })` | Requests from unknown domains/origins |
| **Helmet headers** | `helmet()` | Clickjacking, MIME sniffing, protocol downgrade |
| **Payload size cap** | `express.json({ limit: "1mb" })` | Oversized request body attacks |
| **Global rate limit** | `rateLimit({ max: 200/15min })` | General API abuse / scraping |
| **Auth rate limit (login)** | `rateLimit({ max: 10/15min })` | Brute-force password attacks |
| **Auth rate limit (register)** | `rateLimit({ max: 5/hour })` | Mass account creation |
| **JWT verification** | `jwt.verify(token, JWT_SECRET)` | Unauthenticated access to protected routes |
| **Input validation** | Length checks, type checks | Code injection via oversized payloads |
| **bcrypt hashing** | `bcrypt.hash(password, 12)` | Credential exposure if DB is breached |
| **userId scoping** | `Analysis.find({ userId })` | Cross-user data leakage |
| **Password not returned** | `.select("-password")` | Hash never exposed in API responses |

---

### 13.3 JWT Token Details

| Property | Value | Reason |
|---|---|---|
| **Algorithm** | HS256 (default) | Symmetric \u2014 fast, sufficient for single-server |
| **Expiry** | `7d` (7 days) | Balance between security and UX (no frequent re-login) |
| **Payload** | `{ id, name, email, iat, exp }` | Minimal \u2014 never include sensitive data in JWT |
| **Storage** | `localStorage` | Accessible across page refreshes |
| **Header format** | `Authorization: Bearer <token>` | Standard OAuth2 Bearer scheme |
| **Secret** | `JWT_SECRET` env var | Long random string, never committed to Git |

**Token lifecycle:**
```
Registration/Login → token issued (7 day expiry)
      │
      ├── Page reload → AuthContext reads from localStorage → still authenticated
      ├── 401/403 from API → AuthContext.logout() → LoginPage shown
      └── User clicks Sign Out → localStorage cleared → LoginPage shown
```

---

### 13.4 `authMiddleware.js` \u2014 Implementation

```js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;   // { id, name, email } available to all route handlers
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
}

module.exports = verifyToken;
```

Applied to: `POST /analyze`, `GET /history`, `POST /ask-ai`, `GET /auth/me`
NOT applied to: `POST /auth/register`, `POST /auth/login`, `GET /` (health check)

---

### 13.5 Password Security \u2014 bcrypt

```js
// Registration: hash before storing
const hashed = await bcrypt.hash(password, 12);
// 12 salt rounds = ~250ms per hash — slow enough to deter brute force
// even with a breached database, cracking takes billions of years at scale

// Login: compare submitted password against stored hash
const isMatch = await bcrypt.compare(password, user.password);
// bcrypt.compare is timing-safe — no timing attack possible
```

**Why 12 rounds:** Each round doubles the computation time. At 12 rounds, hashing takes ~250ms on modern hardware. An attacker with a breached DB can only attempt ~4 guesses/second per core, making brute-force of strong passwords computationally infeasible.

---

### 13.6 New Files Added in v2.0

| File | Purpose |
|---|---|
| `backend/models/User.js` | Mongoose User schema (name, email, hashed password) |
| `backend/models/Analysis.js` | Mongoose Analysis schema (moved from inline in server.js, added userId) |
| `backend/routes/auth.js` | `/auth/register`, `/auth/login`, `/auth/me` with rate limiters |
| `backend/middleware/authMiddleware.js` | JWT verification middleware |
| `frontend/src/context/AuthContext.js` | Global auth state, localStorage persistence |
| `frontend/src/components/LoginPage.js` | Glassmorphism login UI with error handling |
| `frontend/src/components/RegisterPage.js` | Register UI with password strength meter |

---

### 13.7 Production Security Checklist

- [ ] `JWT_SECRET` set to a 64+ character random string in Render environment variables
- [ ] `JWT_SECRET` NOT committed to Git (confirmed in `.gitignore`)
- [ ] `FRONTEND_URL` set to your Render frontend URL in backend environment
- [ ] MongoDB Atlas IP whitelist includes only Render outbound IPs
- [ ] All `.env` files present in `.gitignore`
- [ ] CORS origin list does NOT include wildcard `*`
- [ ] Rate limiting confirmed active (check server startup logs)
- [ ] `FLASK_ENV=production` set on ML service (disables Flask debug mode)

# CodeMind AI — System Architecture Specification

> A resilient, full-stack three-tier system for real-time algorithmic complexity analysis and interactive AI software engineering mentorship.

---

## 1. Executive System Overview

CodeMind AI is structured as a decoupled, microservices-inspired architecture designed for high availability, fallback resilience, and user-isolated multi-tenancy.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                AUTHENTICATION & SECURITY LAYER                            │
│           JWT Authorization Header (Bearer) • CORS Whitelist • Helmet • Rate Limiting      │
└───────────────────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────┐         JWT Auth Header         ┌───────────────────────────┐
   │   FRONTEND           │ ──────────────────────────────> │   BACKEND (API Gateway)   │
   │   React 19 / Monaco  │ <────────────────────────────── │   Node.js / Express       │
   │   Port: 3000         │           JSON Payload          │   Port: 5000              │
   └──────────────────────┘                                 └─────────────┬─────────────┘
                                                                          │
                                                                          │ MD5 Cache Miss / Proxy
                                                                          ▼
   ┌──────────────────────────────────────────────────┐     ┌───────────────────────────┐
   │   MONGODB ATLAS                                  │     │   ML SERVICE (AI Engine)  │
   │   • users collection (bcrypt hashed)             │ <── │   Python / Flask          │
   │   • analyses collection (userId & codeHash indexed)│     │   Port: 8000              │
   └──────────────────────────────────────────────────┘     └─────────────┬─────────────┘
                                                                          │
                                                      3-Tier AI Fallback  │
                                                                          ▼
                                                            ┌───────────────────────────┐
                                                            │  1. Google Gemini Flash   │
                                                            │  2. AWS Bedrock Nova      │
                                                            │  3. Offline AST Engine    │
                                                            └───────────────────────────┘
```

### Key Architectural Principles
- **API Gateway Pattern:** The React frontend never communicates directly with the Python ML service. All requests flow through the Node.js API Gateway for validation, authentication, and caching.
- **Fail-Safe Resilience:** AI requests pass through a 3-tier fallback chain (Gemini Flash → AWS Bedrock → Offline Heuristic Engine) to guarantee zero downtime.
- **Strict Data Isolation:** All user records, history, and requests are strictly scoped by `userId` derived directly from validated JWTs.
- **MD5 Caching Layer:** Duplicate code submissions are intercepted at the Node.js gateway layer via MD5 hash lookups, reducing AI API costs and delivering sub-10ms response times.

---

## 2. Service Architecture & Components

### 2.1 Frontend Architecture (React)
- **Framework & Editor:** Built with React, featuring `@monaco-editor/react` for VS Code-like syntax editing.
- **State Management & Routing:** Single-page architecture with state-driven view swapping (`AuthGate` for authentication, tab navigation for Workspace vs. Pricing).
- **Core Components:**
  - `AuthContext.js`: Manages global JWT state and `localStorage` session persistence.
  - `LoginPage.js` / `RegisterPage.js`: Glassmorphism authentication interfaces with real-time password strength validation.
  - `CodeEditor.js`: Monaco instance configured with custom theme rules and disabled noisy squiggles for clean coding.
  - `ResultPanel.js` / `SkeletonLoader.js`: Displays Time (`O(N)`) and Space (`O(1)`) complexity cards, interactive risk indicators, and performance optimization tips with shimmer loading states.
  - `AiAssistant.js`: Resizable interactive chat interface supporting conversation history and prompt execution.
  - `PricingPage.js`: Tier comparison matrix detailing feature availability and quota limits.
  - `WarmupScreen.js`: Cold-start splash component that health-checks backend services before launching.

### 2.2 Backend Gateway (Node.js / Express)
- **Port:** `5000` | **Role:** Router, Authenticator & Cache Coordinator
- **Security Middlewares:**
  - `helmet()`: Enforces 15+ HTTP security headers.
  - `cors()`: Restricts requests to whitelisted origins (`http://localhost:3000`, production domain).
  - `express-rate-limit`: Prevents DDoS and brute-force attempts on sensitive `/auth/*` and `/analyze` routes.
  - `express.json({ limit: "1mb" })`: Rejects oversized payloads before parsing.
- **Core Endpoints:**
  - `POST /auth/register` & `POST /auth/login`: Issue 7-day signed JWT tokens.
  - `POST /analyze`: Authenticates JWT, computes MD5 hash of code, queries MongoDB cache, and proxies cache misses to ML Service.
  - `GET /history`: Returns user-scoped analysis history sorted by recency.
  - `POST /ask-ai`: Authenticates and proxies AI assistant queries to ML Service.

### 2.3 ML Service Engine (Python / Flask)
- **Port:** `8000` | **Role:** Algorithm Analysis & AI Provider Routing
- **Startup Guard (`validate_env`):** Inspects environment keys (`GEMINI_API_KEY`, `AWS_ACCESS_KEY_ID`, etc.) on boot and logs active provider capability mode.
- **Language Detector (`detect_language`):** Uses regex heuristics to verify language signatures (Python, C, Java, JS, Rust, Go, SQL).
- **Offline Heuristic Engine (`analyze_offline`):** Instant static AST pattern analysis evaluating loop nesting depths, recursion, sorting patterns (`O(n log n)`), hash maps (`O(n)` space), and hidden string concatenation traps.
- **Centralized Error Normalization (`error_response`):** Enforces unified `{ error, code, detail }` JSON structure across all Flask routes.

### 2.4 Database Architecture (MongoDB)
- **`users` Collection:** Stores user identity schemas with `email` (unique index) and `password` (hashed via `bcrypt`, 12 rounds).
- **`analyses` Collection:** Stores historical analysis results with `userId` (indexed for user scoping) and `codeHash` (indexed for O(1) cache matching).

---

## 3. End-to-End Request & Data Flow

```
[User Clicks "ANALYZE CODE"]
         │
         ▼
 1. React Frontend (App.js)
    ├── Attaches Authorization: Bearer <JWT>
    └── Sends POST /analyze to Node.js Backend (Port 5000)
         │
         ▼
 2. Node.js Backend (server.js)
    ├── verifyToken middleware validates JWT → Extracts req.user.id
    ├── Computes MD5 Hash = MD5(code.trim())
    ├── Checks MongoDB: Analysis.findOne({ codeHash })
    │     ├── CACHE HIT  ──> Returns cached JSON instantly (~5ms, _cached: true)
    │     └── CACHE MISS ──> Forwards request to Python ML Service (Port 8000)
         │
         ▼
 3. Python ML Service (app.py)
    ├── Runs detect_language() validation
    ├── Executes analyze_offline() static AST heuristic pass (<2ms)
    └── Executes get_ai_enhancement() 3-tier fallback:
          ├── Tier 1: Google Gemini (gemini-flash-lite-latest)
          ├── Tier 2: AWS Bedrock (us.amazon.nova-micro-v1:0)
          └── Tier 3: Offline Static Engine (Guaranteed Fallback)
         │
         ▼
 4. Completion & Persistence
    ├── Python ML Service returns unified result JSON to Node Backend
    ├── Node Backend saves record to MongoDB with { userId, codeHash }
    └── React Frontend renders ResultPanel & updates Sidebar history
```

---

## 4. Resilience & 3-Tier AI Fallback Model

To guarantee 99.9% analysis availability even during upstream API outages, the ML Service implements an automated 3-tier fallback strategy:

```
                  ┌─────────────────────────────────────────┐
                  │    Request Sent to get_ai_enhancement   │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ Tier 1: Google Gemini API               │
                  │ Model: gemini-flash-lite-latest         │
                  └────────────────────┬────────────────────┘
                                       │ Failure / 429 / Timeout / 503
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ Tier 2: AWS Bedrock API                 │
                  │ Model: us.amazon.nova-micro-v1:0        │
                  └────────────────────┬────────────────────┘
                                       │ Failure / Credentials Missing
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ Tier 3: Static Offline Engine           │
                  │ Pure Python AST Regex Parsing           │
                  └─────────────────────────────────────────┘
```

1. **Tier 1 (Google Gemini):** Primary AI provider executing deep algorithmic evaluation. Supports 60-second client timeouts and automated 1-second retry on transient 503/504 errors.
2. **Tier 2 (AWS Bedrock Nova Micro):** Industry-standard fallback model hosted on AWS infrastructure (`us.amazon.nova-micro-v1:0`), active if Gemini quota limits or outages occur.
3. **Tier 3 (Offline Heuristic Engine):** Local Python pattern analyzer running entirely without network access. Always succeeds as a fail-safe.

---

## 5. Security & Authentication Design

CodeMind AI adopts a zero-trust multi-layer defense matrix:

| Security Domain | Strategy & Implementation | Threat Prevented |
|---|---|---|
| **Authentication** | JSON Web Tokens (JWT), 7-day expiration, stored in `localStorage` | Unauthorized API usage |
| **Password Storage** | `bcrypt` hashing with 12 salt rounds (~250ms computation per hash) | Database credential leaks |
| **Data Isolation** | All queries forced to filter by `userId` derived from validated JWT | Cross-user data leakage |
| **API Protection** | `helmet()`, CORS origin whitelist, payload size cap (1MB) | XSS, Clickjacking, MIME spoofing |
| **Abuse Mitigation** | `express-rate-limit` (10 req/15min on login, 5 req/hr on register) | Brute-force & automated registration spam |
| **Input Validation** | Strict type checks & maximum length limits (50,000 chars code max) | Buffer overflow & prompt injection abuse |

---

## 6. Infrastructure, CI/CD & Deployment

### 6.1 Production Hosting Matrix (Render)
- **Frontend:** Render Static Site running compiled React bundle.
- **Backend:** Node.js Web Service running `server.js`.
- **ML Service:** Python Web Service running Gunicorn WSGI server (`gunicorn app:app --workers 2 --timeout 60`).

### 6.2 CI/CD Pipeline (GitHub Actions)
Located in `.github/workflows/`:
- **`frontend.yml`:** Installs dependencies (`--legacy-peer-deps`) and validates React production build.
- **`backend.yml`:** Checks Node.js syntax integrity (`node --check server.js`).
- **`ml-service.yml`:** Executes `pytest` offline suite (12 unit tests covering all Big-O complexity conditions).
- **`deploy.yml`:** Triggers Render production deployment webhooks only after all CI jobs pass.
- **`keep-alive.yml`:** Runs on a 10-minute cron schedule to ping Render free-tier web services, preventing cold-start hibernation.

---

## 7. Unified Environment Configuration

### Backend (`backend/.env`)
```ini
PORT=5000
MONGO_URL=mongodb://localhost:27017/codemind
ML_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_production_jwt_secret_key
FRONTEND_URL=http://localhost:3000
```

### ML Service (`ml-service/.env`)
```ini
PORT=8000
GEMINI_API_KEY=your_gemini_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
FLASK_ENV=development
```

### Frontend (`frontend/.env`)
```ini
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ML_URL=http://localhost:8000
```

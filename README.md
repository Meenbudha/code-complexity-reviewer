# 🧠 CodeMind AI — Code Complexity Reviewer

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-6C63FF?style=for-the-badge)](https://codemind-frontend.onrender.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Meenbudha/code-complexity-reviewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

[![Frontend CI](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/frontend.yml/badge.svg)](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/frontend.yml)
[![Backend CI](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/backend.yml/badge.svg)](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/backend.yml)
[![ML Service CI](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/ml-service.yml/badge.svg)](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/ml-service.yml)
[![Deploy to Render](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/deploy.yml/badge.svg)](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/deploy.yml)
[![Keep Alive](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/keep-alive.yml/badge.svg)](https://github.com/Meenbudha/code-complexity-reviewer/actions/workflows/keep-alive.yml)

**AI-powered code analysis with multi-tier intelligence — Gemini → AWS Bedrock → Offline fallback.**

</div>

---

## 🌐 Live Demo

> ### 🔗 **[https://codemind-frontend.onrender.com](https://codemind-frontend.onrender.com)**

> [!TIP]
> The app auto-warms all backend services on first load — no manual steps needed. Just click and wait ~30s on first visit (Render free tier cold start).

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Tier AI Router** | Gemini → AWS Bedrock → Offline fallback for 100% uptime |
| ⚡ **Request Caching** | SHA-256 hash lookup in MongoDB — cache hits respond in ~5ms |
| 📊 **Complexity Analysis** | Big-O time & space complexity, warnings, and improvement tips |
| 💬 **AI Chat Assistant** | Ask follow-up questions about your code in real time |
| 🔥 **Warmup Screen** | Auto-pings all services on load — no more cold start failures |
| 🦴 **Skeleton Loaders** | Shimmer placeholders while AI analysis runs |
| 🛡️ **Robust Error Handling** | Standardized error responses with graceful degradation |
| 🧪 **Unit Test Coverage** | 12 Pytest cases covering all offline analysis branches |
| 🔄 **Full CI/CD Pipeline** | GitHub Actions: test → build → deploy to Render automatically |
| 🏓 **Keep-Alive Cron** | Pings all 3 Render services every 10 min — prevents cold starts |

---

## 🏗️ Architecture

```
CodeMind AI/
├── .github/
│   └── workflows/
│       ├── frontend.yml      ← CI: React build check
│       ├── backend.yml       ← CI: Node.js syntax check
│       ├── ml-service.yml    ← CI: Pytest suite (12 tests)
│       ├── deploy.yml        ← CD: Auto-deploy all 3 to Render
│       └── keep-alive.yml    ← Cron: ping services every 10 min
├── frontend/                 ← React 19 + Vanilla CSS dark theme
│   └── src/
│       ├── components/
│       │   ├── WarmupScreen.js     # Cold-start handler
│       │   ├── CodeEditor.js       # Code input area
│       │   ├── ResultPanel.js      # Analysis report
│       │   ├── SkeletonLoader.js   # Shimmer placeholders
│       │   ├── AiAssistant.js      # Chat interface
│       │   ├── ComplexityGraph.js  # Big-O visualizer
│       │   ├── Header.js
│       │   └── Sidebar.js          # History panel
│       └── index.css
├── backend/                  ← Node.js/Express — API gateway + cache
│   └── server.js             # MD5 cache, MongoDB, proxy to ML service
├── ml-service/               ← Python Flask — AI orchestration
│   ├── app.py                # 3-tier router + offline engine
│   ├── pytest.ini
│   └── tests/
│       └── test_analyze_offline.py
└── README.md
```

### Intelligence Router Flow

```
User Request
     │
     ▼
┌─────────────┐    ✅ success    ┌──────────────┐
│  Google     │──────────────►  │   Response   │
│  Gemini     │                 └──────────────┘
└─────────────┘
     │ ❌ timeout / 429
     ▼
┌─────────────┐    ✅ success    ┌──────────────┐
│    AWS      │──────────────►  │   Response   │
│  Bedrock    │                 └──────────────┘
└─────────────┘
     │ ❌ error
     ▼
┌─────────────┐
│   Offline   │──────────────►  Static heuristic analysis
│  Analyzer   │
└─────────────┘
```

---

## 🚀 Quick Start (Local)

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **MongoDB** (local or Atlas)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Meenbudha/code-complexity-reviewer.git
cd code-complexity-reviewer
```

### 2. Set Up the Backend (Node.js)

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URL=mongodb://localhost:27017/codemind
ML_SERVICE_URL=http://localhost:8000
```

```bash
node server.js
```

### 3. Set Up the ML Service (Python Flask)

```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `ml-service/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

```bash
python app.py
```

### 4. Set Up the Frontend (React)

```bash
cd frontend
npm install --legacy-peer-deps
```

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ML_URL=http://localhost:8000
```

```bash
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Running Tests

```bash
cd ml-service
python -m pytest tests/ -v
```

Expected output: **12 passed** covering O(1), O(n), O(n²), O(log n), O(n log n), O(2^n), recursion, hashmap, string concat, deep nesting, Java syntax.

---

## ☁️ Deployment on Render

All 3 services are deployed on [Render](https://render.com) free tier.

| Service | Render Config |
|---|---|
| **Frontend** | Root: `frontend` · Build: `npm install --legacy-peer-deps && npm run build` · Publish: `build/` |
| **Backend** | Root: `backend` · Build: `npm install` · Start: `node server.js` |
| **ML Service** | Root: `ml-service` · Build: `pip install -r requirements.txt` · Start: `gunicorn app:app --workers 2 --timeout 60 --bind 0.0.0.0:$PORT` |

### Environment Variables on Render

**Frontend service:**
```
REACT_APP_BACKEND_URL = https://your-backend.onrender.com
REACT_APP_ML_URL      = https://your-ml-service.onrender.com
```

> [!IMPORTANT]
> `REACT_APP_*` variables must be set in Render **before** building. React bakes them into the static bundle at build time — they are not runtime variables.

**Backend service:**
```
MONGO_URL       = mongodb+srv://... (MongoDB Atlas)
ML_SERVICE_URL  = https://your-ml-service.onrender.com
PORT            = 5000
```

**ML service:**
```
GEMINI_API_KEY       = ...
AWS_ACCESS_KEY_ID    = ...
AWS_SECRET_ACCESS_KEY= ...
AWS_REGION           = us-east-1
FLASK_ENV            = production
```

---

## 🔄 CI/CD Pipeline

Every `git push` to `main` triggers a full automated pipeline:

```
Push to main
     │
     ├── ⚛️ Frontend CI   (npm build)
     ├── 🟡 Backend CI    (node --check)
     └── 🐍 ML Service CI (pytest 12 tests)
           │ all pass ✅
           ▼
     ├── 🌐 Deploy Frontend → Render
     ├── 🟡 Deploy Backend  → Render
     └── 🤖 Deploy ML       → Render
           │
           ▼
     ✅ Deployment Summary printed
```

**Keep-Alive:** A separate cron workflow pings all 3 services every 10 minutes to prevent Render free-tier spin-down.

### GitHub Secrets Required

> [!IMPORTANT]
> All sensitive values must go in the **Secrets** tab — NOT the Variables tab.

| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini AI provider |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock fallback |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock fallback |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Auto-deploy frontend |
| `RENDER_DEPLOY_HOOK_BACKEND` | Auto-deploy backend |
| `RENDER_DEPLOY_HOOK_ML` | Auto-deploy ML service |
| `RENDER_BACKEND_URL` | Keep-alive ping |
| `RENDER_ML_URL` | Keep-alive ping |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vanilla CSS, Custom Dark Theme |
| **Backend** | Node.js 18, Express 5, Mongoose |
| **ML Service** | Python 3.10, Flask, Gunicorn |
| **AI — Primary** | Google Gemini 2.0 Flash |
| **AI — Fallback** | AWS Bedrock (Amazon Nova Micro) |
| **AI — Offline** | Custom heuristic regex engine |
| **Database** | MongoDB Atlas (cache + history) |
| **Testing** | Pytest (12 offline unit tests) |
| **CI/CD** | GitHub Actions (4 workflows) |
| **Hosting** | Render (all 3 services) |

---

## 🗺️ Roadmap

- [x] Deploy all 3 services to Render
- [x] Full CI/CD pipeline with GitHub Actions
- [x] Cold start WarmupScreen
- [x] Keep-alive cron job
- [x] Unit tests (12 Pytest cases)
- [ ] Add input validation + rate limiting
- [ ] Support more languages (JavaScript, Go, Rust)
- [ ] Dark/Light mode persistence (localStorage)
- [ ] VS Code extension

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by [Meenbudha](https://github.com/Meenbudha)

⭐ **Star this repo if you find it useful!**

📖 **[Full Architecture Docs →](ARCHITECTURE.md)**

</div>

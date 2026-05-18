# 🧠 CodeMind AI — Code Complexity Reviewer

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-6C63FF?style=for-the-badge)](https://codemind-frontend.onrender.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Meenbudha/code-complexity-reviewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)

**AI-powered code analysis with multi-tier intelligence — Gemini → AWS Bedrock → Offline fallback.**

</div>

---

## 🌐 Live Link

> ### 🔗 **[https://codemind-frontend.onrender.com](https://codemind-frontend.onrender.com)**

> [!TIP]
> Click the link above to open the live app hosted on Render. No installation required!

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Tier AI Router** | Cascades through Gemini → AWS Bedrock → Offline fallback for 100% uptime |
| ⚡ **Request Caching** | MD5-based caching eliminates redundant API calls |
| 📊 **Complexity Analysis** | Cyclomatic complexity, Big-O estimation, maintainability scoring |
| 💬 **AI Chat Assistant** | Ask follow-up questions about your code analysis |
| 🦴 **Skeleton Loaders** | Smooth loading states for a premium UX |
| 🛡️ **Robust Error Handling** | Standardized error responses with graceful degradation |
| 🧪 **Unit Test Coverage** | Pytest suite covering offline analysis and API routes |

---

## 🏗️ Architecture

```
CodeMind AI
├── frontend/          # React 18 + custom CSS dark UI
│   └── src/
│       ├── components/
│       │   ├── CodeEditor.js       # Monaco-style code input
│       │   ├── ResultPanel.js      # Analysis report display
│       │   └── SkeletonLoader.js   # Loading placeholders
│       └── index.css
├── ml-service/        # Python Flask — AI orchestration layer
│   ├── app.py         # 3-tier fallback router (Gemini → Bedrock → Offline)
│   ├── pytest.ini
│   └── tests/
│       └── test_analyze_offline.py
└── backend/           # Node.js/Express — API gateway (optional)
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
     │ ❌ timeout/error
     ▼
┌─────────────┐    ✅ success    ┌──────────────┐
│    AWS      │──────────────►  │   Response   │
│  Bedrock    │                 └──────────────┘
└─────────────┘
     │ ❌ timeout/error
     ▼
┌─────────────┐
│   Offline   │──────────────►  Static analysis fallback
│  Analyzer   │
└─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Meenbudha/code-complexity-reviewer.git
cd code-complexity-reviewer
```

### 2. Set Up the ML Service (Flask)

```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `ml-service/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
```

Start the service:

```bash
python app.py
```

### 3. Set Up the Frontend (React)

```bash
cd frontend
npm install
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Running Tests

```bash
cd ml-service
pip install pytest
pytest
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vanilla CSS, Custom Dark Theme |
| **ML Service** | Python, Flask, Google Gemini API, AWS Bedrock (boto3) |
| **Backend** | Node.js, Express |
| **AI Models** | Gemini 1.5 Flash, Amazon Titan / Claude (Bedrock) |
| **Testing** | Pytest |
| **Version Control** | Git + GitHub |

---

## 📁 Git Setup Reference

<details>
<summary>First-time GitHub setup steps</summary>

```bash
# Initialize (if starting fresh)
git init

# Stage and commit
git add .
git commit -m "Initial commit: Code Complexity Reviewer structure"

# Rename branch
git branch -M main

# Link to GitHub (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/code-complexity-reviewer.git

# Push
git push -u origin main
```

**Key `.gitignore` entries:**

```gitignore
node_modules/
frontend/node_modules/
backend/node_modules/
venv/
env/
.env
.vscode/
.DS_Store
```

</details>

---

## 🗺️ Roadmap

- [ ] Deploy frontend to Vercel / Netlify
- [ ] Deploy ML service to Railway / Render
- [ ] Add live hosted demo URL
- [ ] Support for more languages (Go, Rust, Java)
- [ ] VS Code extension

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by [Meenbudha](https://github.com/Meenbudha)

⭐ **Star this repo if you find it useful!**

</div>

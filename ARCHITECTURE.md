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

---

## 1. System Overview

CodeMind AI is split into **three independent services** that communicate with each other over HTTP:

```
┌─────────────────────────┐        ┌────────────────────────┐        ┌──────────────────────────┐
│                         │        │                         │        │                          │
│   FRONTEND (React)      │───────▶│   BACKEND (Node.js)     │───────▶│  ML SERVICE (Python)     │
│   Port: 3000            │        │   Port: 5000            │        │  Port: 8000              │
│                         │◀───────│                         │◀───────│                          │
└─────────────────────────┘        └────────────┬────────────┘        └──────────────────────────┘
                                                │
                                                │ Save / Read Results
                                                ▼
                                   ┌────────────────────────┐
                                   │   MongoDB Database      │
                                   │   (Analysis History)    │
                                   └────────────────────────┘
```

**The golden rule:** The Frontend **never** talks directly to the Python service. All requests go through the Node.js backend, which acts as a secure **API Gateway**.

---

## 2. How a Request Flows End-to-End

Here is the complete journey of a single "Analyze Code" click:

```
User clicks "ANALYZE CODE"
        │
        ▼
[1] App.js → POST http://localhost:5000/analyze
    Body: { code: "...", language: "java" }
        │
        ▼
[2] server.js receives the request.
    Forwards it via axios → POST http://localhost:8000/analyze
        │
        ▼
[3] app.py receives the code.
    Step A: detect_language() — verifies it matches what the user selected.
    Step B: analyze_offline() — runs static heuristic analysis (no internet needed).
    Step C: get_ai_enhancement() — sends result + code to Gemini API for verification.
    Returns final JSON: { time, space, warnings, suggestions }
        │
        ▼
[4] server.js receives the result.
    Saves it to MongoDB (Analysis collection).
    Sends result back to React with the new MongoDB _id.
        │
        ▼
[5] App.js receives the result.
    Updates React state → UI re-renders with TC, SC, warnings, tips, and graph.
    Adds the analysis to the sidebar history list.
```

---

## 3. Frontend (React)

**Location:** `frontend/src/`

The frontend is a single-page React application. It has no page routing — the entire experience happens on one screen that dynamically changes based on state.

### 3.1 `App.js` — The Brain

This is the root component that holds all the application state and orchestrates everything.

**Key State Variables:**

| State | Type | Purpose |
|---|---|---|
| `code` | string | The code currently typed in the editor |
| `language` | string | Selected language: `"c"`, `"java"`, or `"python"` |
| `result` | object | The analysis result `{ time, space, warnings, suggestions }` |
| `loading` | boolean | `true` while waiting for the API response |
| `hasAnalyzed` | boolean | Triggers the layout shift (editor + report side-by-side) |
| `history` | array | List of past analyses loaded from MongoDB |
| `darkMode` | boolean | `true` = dark theme, `false` = light theme |
| `topSectionHeight` | number | Height (px) of the editor area, draggable by user |

**Key Functions:**

- **`analyzeCode()`** — The main function. Sets loading state, POSTs code to the Node backend, handles the response (including language mismatch errors), updates state with the result, and adds it to the history list.
- **`loadFromHistory(item)`** — When a user clicks an item in the sidebar, this repopulates the editor with the old code and shows its saved result.
- **`resetAnalysis()`** — Clears code, result, and resets the layout to the initial "hero" view.
- **Resize Logic** — Uses `mousedown`, `mousemove`, and `mouseup` event listeners to let the user drag the border between the editor/report area and the AI Assistant panel.

**On startup**, the app fetches `/history` from the backend to pre-populate the sidebar with the last 20 saved analyses from MongoDB.

---

### 3.2 Component Breakdown

#### `Header.js`
- Displays the CodeMind AI brand name in the top navigation bar.
- Contains the **dark/light mode toggle** button.
- Passes the `darkMode` state and `setDarkMode` setter as props.

#### `Sidebar.js`
- A slide-in panel on the left side of the screen.
- Displays the history of past analyses as a list of clickable cards.
- Each card shows the language, timestamp, and a short summary.
- Clicking a card calls `loadFromHistory()` in `App.js`.
- Has a **"New Analysis"** button that calls `resetAnalysis()`.

#### `CodeEditor.js`
- A styled `<textarea>` element using the `'Fira Code'` monospace font at `13px`.
- Fully controlled by React (value and onChange tied to the `code` state).
- The `EDITOR` label in the top-left is decorative.
- `spellCheck={false}` prevents the browser from underlining code.

#### `ResultPanel.js`
- Displays the analysis result after a successful call.
- Split into two sections:
  1. **TC/SC Cards:** Two side-by-side cards showing Time Complexity and Space Complexity values with colour-coded top borders (cyan for TC, violet for SC).
  2. **Warnings & Tips:** Conditionally rendered lists. Warnings have a yellow/amber left border; Tips have a cyan left border.

#### `ComplexityGraph.js`
- Renders a visual SVG line graph below the ResultPanel.
- Takes the `complexity` prop (e.g., `"O(n^2)"`) and maps it to a growth curve function.
- Plots points from `n=0` to `n=50` to visually show how the algorithm's runtime would scale.

#### `AiAssistant.js`
- A collapsible chat panel pinned to the bottom of the screen.
- **Expand/Collapse:** Clicking the header toggles the `isExpanded` state.
- **Resizable:** Has top and bottom drag handles to resize the chat window height.
- **Chat Flow:**
  1. User types a question and presses Enter (or clicks Send).
  2. The component immediately appends the user's message to the `history` state for instant UI feedback.
  3. It POSTs `{ code, question }` to `/ask-ai` on the Node backend.
  4. Shows a "Thinking..." loading bubble while waiting.
  5. Appends the AI's response to the chat history on arrival.
- The component receives the `code` state as a prop from `App.js`, so it can always ask contextual questions about the code currently in the editor.

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

**Light Mode** overrides the same variables with lighter colours, so **no component needs to know about the current theme**. It just always reads from the variables, and the browser applies the correct value automatically. This also means the `transition: all 0.3s` on the `body` creates smooth, animated mode switching.

---

## 4. Backend (Node.js / Express)

**Location:** `backend/server.js`  
**Port:** `5000`

The Node.js server is an **API Gateway**. It does not process code itself. Its three jobs are:

1. **Proxy** requests from the React frontend to the Python ML service.
2. **Persist** results to MongoDB.
3. **Serve** the analysis history to the frontend.

### API Endpoints

#### `GET /`
- Health check. Returns a simple text response confirming the server is running.

#### `POST /analyze`
**Request Body:** `{ code: string, language: string }`

1. Receives code and language from the React frontend.
2. Forwards the request to the Python service at `ML_SERVICE_URL/analyze` using `axios`.
3. Timeout is set to **40 seconds** to account for Gemini API cold starts.
4. On success, saves the result to MongoDB using the `Analysis` model.
5. Returns the result JSON back to React, including the new MongoDB `_id`.
6. On timeout (`ECONNABORTED`), returns a clean error object instead of crashing.

#### `GET /history`
1. Queries MongoDB for the **20 most recent** analysis records, sorted newest-first.
2. Returns the array to the frontend. Used to populate the sidebar on page load.

#### `POST /ask-ai`
**Request Body:** `{ code: string, question: string }`

1. Simply proxies the chat request to `ML_SERVICE_URL/ask-ai`.
2. Returns the AI's text answer back to the `AiAssistant` component.
3. Handles timeout gracefully with a user-friendly error message.

### MongoDB Schema (`Analysis`)

```js
{
  code:      String,   // The submitted source code
  language:  String,   // "c", "java", or "python"
  result:    Object,   // { time, space, warnings, suggestions }
  timestamp: Date      // Auto-set to current time on save
}
```

---

## 5. ML Service (Python / Flask)

**Location:** `ml-service/app.py`  
**Port:** `8000`

This is the intelligence core of CodeMind AI. It has two distinct analysis modes that work together.

### 5.1 Language Detection (`detect_language`)

Before analyzing, the service verifies the submitted code using **regex pattern matching**:

| Language | Detection Signals |
|---|---|
| Python | `def` keyword, indented blocks (`:`), `import` without semicolons |
| C | `#include`, `printf`, `int main(` with braces |
| Java | `public class`, `public static void main`, `System.out.println` |

If the detected language does not match what the user selected in the dropdown, the service returns an **error response** instead of analyzing. The frontend shows this as a warning in the results panel.

### 5.2 Offline Heuristic Engine (`analyze_offline`)

This function runs **without the internet** using pure static code analysis. It reads the code line by line and looks for patterns:

**Time Complexity Logic:**

```
No loops, no recursion         → O(1)
1 level of looping             → O(n)
1 loop with /= or >>= (halving)→ O(log n)
2 nested loops                 → O(n²)
2 nested loops + halving       → O(n log n)
3+ nested loops                → O(n^k) where k = nesting depth
Self-calling function found    → O(n) recursive
Two self-calls (e.g. fib)      → O(2^n) exponential
```

**Space Complexity Logic:**
```
No dynamic memory              → O(1)
new[], malloc, ArrayList       → O(n)
Recursion detected             → O(n) (call stack)
Dynamic alloc + nested loops   → O(n²)
```

This step is instant (microseconds) because it never makes a network call.

### 5.3 AI Enhancement (`get_ai_enhancement`)

After the offline analysis gives an initial estimate, this function:

1. Builds a prompt containing the original code + the offline estimate.
2. Sends it to the **Gemini Flash** model via the `google-genai` SDK.
3. Asks Gemini to **verify or correct** the estimates and provide concise warnings and suggestions.
4. Forces `response_mime_type="application/json"` so Gemini returns structured data, not free text.
5. Sets `max_output_tokens=250` and `temperature=0.2` to keep responses fast and focused.

If the Gemini API is unavailable (rate limit, no key), it **gracefully falls back** to the offline result and appends a note to the suggestions list.

### 5.4 API Routes

#### `GET /`
Health check. Returns `{ status: "ML Service Running", port: 8000 }`.

#### `POST /analyze`
1. Extracts `code` and `language` from the request body.
2. Runs `detect_language()` to validate.
3. Runs `analyze_offline()` for instant heuristic results.
4. Passes those results to `get_ai_enhancement()` for AI verification.
5. Returns the final merged JSON.

#### `POST /ask-ai`
1. Receives `{ code, question }` from the backend proxy.
2. Sends a simple, conversational prompt to Gemini: *"Explain simply: [question]. Code: [code]"*
3. Returns the raw text answer. This is for the AI Assistant chat feature.

---

## 6. Database (MongoDB)

**Database Name:** `codemind`  
**Collection:** `analyses`

MongoDB is used exclusively for **persisting analysis history**. The data is never read during the analysis itself — only saved after and retrieved for the history sidebar.

- **Local:** Connects to `mongodb://localhost:27017/codemind`
- **Cloud (Render):** Reads `MONGO_URI` environment variable for the connection string.

---

## 7. Environment Variables

| Variable | Service | Purpose |
|---|---|---|
| `PORT` | Backend | The port the Node.js server listens on (default: `5000`) |
| `MONGO_URI` | Backend | MongoDB connection string (default: local) |
| `ML_SERVICE_URL` | Backend | URL of the Python service (default: `http://localhost:8000`) |
| `GEMINI_API_KEY` | ML Service | Google Gemini API key for AI analysis |
| `REACT_APP_BACKEND_URL` | Frontend | URL of the Node.js backend (default: `http://localhost:5000`) |

---

## 8. How to Run Locally

You need **3 terminals** running simultaneously.

**Terminal 1 — ML Service (Python):**
```bash
cd ml-service
# First time only:
python -m venv venv
.\venv\Scripts\activate
pip install flask flask-cors google-genai

# Set your key and run:
$env:GEMINI_API_KEY="your_key_here"
python -X utf8 app.py
# Runs on http://localhost:8000
```

**Terminal 2 — Backend (Node.js):**
```bash
cd backend
# First time only:
npm install

npm start
# Runs on http://localhost:5000
```

**Terminal 3 — Frontend (React):**
```bash
cd frontend
# First time only:
npm install

npm start
# Runs on http://localhost:3000
```

Open your browser at **http://localhost:3000**.

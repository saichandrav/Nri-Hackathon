# Implementation Plan: Autonomous Job Hunter (CrewAI + MERN)

This document outlines the four phases of building the "Autonomous Job Hunter" SaaS application. Each phase includes clear "Status Checkpoints" to verify functionality.

> [!IMPORTANT]
> **Local Environment:** Both the Node.js (Port 8000) and Python FastAPI (Port 8001) servers will run concurrently on your local machine.

---

## Phase 1: The AI Engine (Python FastAPI) ✅ DONE

### Files Created:
- `python_ai/main.py` — FastAPI server with `/api/start-scout` and `/api/tailor-resume`
- `python_ai/config.py` — Loads API keys from `.env`
- `python_ai/agents/scout_agent.py` — Agent 1: Job Scout (CrewAI + Exa Search)
- `python_ai/agents/tailor_agent.py` — Agent 2: Resume Tailor (CrewAI + OpenRouter)
- `python_ai/tools/exa_search_tool.py` — Exa neural search wrapper
- `python_ai/requirements.txt` — Python dependencies
- `python_ai/.env.example` — API key template

---

## Phase 2: Node.js Backend & Data Flow ✅ DONE

### Files Modified/Created:
- `backend/controllers/aiController.js` — Rewritten to call Python API via axios
- `backend/routes/aiRoutes.js` — Updated with all new endpoints
- `backend/utils/pdfGenerator.js` — Markdown-to-PDF using Puppeteer
- `backend/.env.example` — Updated with Python API URL
- `backend/models/User.js` — Added masterResumeText, targetRole, location
- `backend/models/Job.js` — Added jobType, scrapedFrom
- `backend/models/Resume.js` — Added markdownContent, isMaster, job reference

---

## Phase 3: React Frontend Dashboard ✅ DONE

### Files Modified:
- `job scraping/src/components/Dashboard.jsx` — Complete rewrite with:
  - AI Job Scout search bar (target role + location)
  - Job cards with company, location, source platform
  - Expandable job descriptions
  - "Tailor Resume" button on each job card
  - "Apply" link to original posting
  - Resume preview modal with Markdown display
  - PDF download button

---

## Phase 4: Verification & Running Locally

### How to Run (3 Terminals):

#### Terminal 1: Python AI Engine
```bash
cd python_ai
pip install -r requirements.txt
# Copy .env.example to .env and add your API keys
copy .env.example .env
# Edit .env with your EXA_API_KEY and OPENROUTER_API_KEY
python main.py
# Should show: "Starting AI Engine on http://localhost:8001"
```

#### Terminal 2: Node.js Backend
```bash
cd backend
npm install
# Copy .env.example to .env and add your keys
copy .env.example .env
# Edit .env with your MONGO_URI, JWT_SECRET, etc.
npm start
# Should show: "Server running on port 8000"
```

#### Terminal 3: React Frontend
```bash
cd "job scraping"
npm install
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Verification Checklist:
- [ ] Python server responds at `http://localhost:8001` with health check
- [ ] Node.js server responds at `http://localhost:8000` with health check
- [ ] React app loads at `http://localhost:5173`
- [ ] Scout search returns job cards in the dashboard
- [ ] "Tailor Resume" generates a tailored Markdown preview
- [ ] "Download as PDF" produces a professional resume PDF

---

## Technical Stack Summary
*   **AI Search:** Exa Search API (`exa_py`)
*   **LLM Provider:** OpenRouter
*   **AI Framework:** CrewAI + LangChain
*   **Bridge:** FastAPI (Python) ↔ Express (Node.js)
*   **Database:** MongoDB (Mongoose)
*   **Frontend:** Vite + React + Tailwind CSS

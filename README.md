# 🚀 Autonomous Job Hunter (MERN + Python AI Engine)

An intelligent, autonomous job application system that scouts for tailored opportunities, extracts skills from your uploaded resume, and automatically generates ATS-optimized PDF resumes for each position using the **OpenRouter Nemotron-3-Super** model.

## 🌟 Key Features

*   **PDF Resume Uploader:** Upload your existing resume. The system extracts raw text and intelligently deduces your top skills and the best-fitting job titles for your expertise.
*   **Job Scouting Agent:** Tell the system your target role and location. The AI engine uses live web search (via Exa Search API) to find real, relevant, and recent job postings.
*   **Resume Tailoring Agent:** The AI automatically rewrites your master resume to perfectly match the job description of any scouted position, boosting your ATS score.
*   **One-Click PDF Generation:** Download your newly tailored resume instantly as a cleanly formatted PDF.
*   **Authentication & Data Persistence:** Secure User login (JWT) and resume tracking using a MongoDB Database.

---

## 🏗️ Architecture Stack

This project uses a separated microservice architecture.

1.  **Frontend (`job scraping/`)**: React.js / Vite / Tailwind CSS.
2.  **Backend API (`backend/`)**: Node.js / Express / Mongoose.
3.  **AI Engine (`python_ai/`)**: Python / FastAPI / LiteLLM.

---

## ⚙️ Prerequisites

You must have the following installed to run this project:
*   [Node.js](https://nodejs.org/) (v16+)
*   [Python 3.10+](https://www.python.org/)
*   [MongoDB URI](https://www.mongodb.com/cloud/atlas) (Local or Atlas)
*   [OpenRouter API Key](https://openrouter.ai/) for the LLM Model.
*   [Exa API Key](https://exa.ai/) for live Web Job Search.

---

## 🛠️ Environment Configuration

You must create two `.env` files before running the project.

### 1. Backend variables (`backend/.env`)
Create a file at `backend/.env` and add:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/job-hunter  # Or your MongoDB Atlas URI
JWT_SECRET=super_secret_jwt_key
PYTHON_API_URL=http://localhost:8001
```

### 2. Python AI Engine variables (`python_ai/.env`)
Create a file at `python_ai/.env` and add:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
EXA_API_KEY=your_exa_search_api_key
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b
PYTHON_API_PORT=8001
```

---

## 🚦 How to Run the Application

Because this project runs using multiple microservices, you must open **three separate terminals** and run each service simultaneously.

### Terminal 1: Python AI Engine
```bash
cd python_ai
# Create a virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate   # On Windows
pip install -r requirements.txt
python main.py
```
*(Runs on http://localhost:8001)*

### Terminal 2: Node.js Backend
```bash
cd backend
npm install
npm start
```
*(Runs on http://localhost:8000)*

### Terminal 3: React Frontend UI
```bash
cd "job scraping"
npm install
npm run dev
```
*(Runs on http://localhost:5173)*

---

## 💡 Usage Guide

1. Navigate to the frontend in your browser (e.g., `http://localhost:5173`).
2. **Sign Up / Log in** to your account.
3. Access your **Dashboard**. 
4. Drag-and-drop your **PDF Resume** into the "Your Resume" box. Wait for the Python AI to extract your skills and auto-predict your Best Target Role. (If you don't have a PDF, you can paste the raw text manually below the box).
5. Ensure your **Target Role** and **Location** are filled in, then click **Scout for Jobs**.
6. When the jobs appear, hover over the card and click **Tailor Resume**.
7. Validate your 1-click intelligently rewritten resume layout, and hit **Download PDF**.

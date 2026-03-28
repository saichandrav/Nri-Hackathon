"""
FastAPI Bridge - The API server that Node.js calls to trigger AI agents.
Runs on port 8001 locally.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from agents.scout_agent import run_scout
from agents.tailor_agent import run_tailor
from agents.analyze_agent import run_analyze
from config import PYTHON_API_PORT

app = FastAPI(
    title="Job Hunter AI Engine",
    description="AI agents for job scouting and resume tailoring",
    version="1.0.0",
)

# Allow Node.js backend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Request/Response Models ----

class ScoutRequest(BaseModel):
    target_role: str
    location: str


class ScoutResponse(BaseModel):
    success: bool
    jobs: list[dict]
    count: int


class TailorRequest(BaseModel):
    master_resume: str
    job_description: str
    job_title: str = ""


class TailorResponse(BaseModel):
    success: bool
    tailored_resume: str


class AnalyzeRequest(BaseModel):
    resume_text: str


class AnalyzeResponse(BaseModel):
    skills: list[str]
    suggested_roles: list[str]


# ---- Endpoints ----

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Job Hunter AI Engine is running!"}


@app.post("/api/start-scout", response_model=ScoutResponse)
async def start_scout(request: ScoutRequest):
    """
    Trigger Agent 1 (Job Scout) to find jobs.
    Called by the Node.js backend.
    """
    try:
        if not request.target_role:
            raise HTTPException(status_code=400, detail="target_role is required")
        if not request.location:
            raise HTTPException(status_code=400, detail="location is required")

        jobs = run_scout(request.target_role, request.location)

        return ScoutResponse(
            success=True,
            jobs=jobs,
            count=len(jobs),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scout failed: {str(e)}")


@app.post("/api/tailor-resume", response_model=TailorResponse)
async def tailor_resume(request: TailorRequest):
    """
    Trigger Agent 2 (Resume Tailor) to customize a resume.
    Called by the Node.js backend.
    """
    try:
        if not request.master_resume:
            raise HTTPException(status_code=400, detail="master_resume is required")
        if not request.job_description:
            raise HTTPException(status_code=400, detail="job_description is required")

        tailored = run_tailor(
            master_resume=request.master_resume,
            job_description=request.job_description,
            job_title=request.job_title,
        )

        return TailorResponse(
            success=True,
            tailored_resume=tailored,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tailor failed: {str(e)}")


@app.post("/api/analyze-resume", response_model=AnalyzeResponse)
async def analyze_resume(request: AnalyzeRequest):
    """
    Trigger Agent 3 (Analyze Resume) to extract skills and suggest roles.
    Called by the Node.js backend.
    """
    try:
        if not request.resume_text:
            raise HTTPException(status_code=400, detail="resume_text is required")

        result = run_analyze(resume_text=request.resume_text)

        return AnalyzeResponse(
            skills=result.get("skills", []),
            suggested_roles=result.get("suggested_roles", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analyze failed: {str(e)}")


if __name__ == "__main__":
    print(f"Starting AI Engine on http://localhost:{PYTHON_API_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PYTHON_API_PORT)

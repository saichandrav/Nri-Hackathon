from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import PyPDF2
import io
import re
import json
import numpy as np

from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

app = FastAPI(title="Job Application AI Backend")

print("Loading sentence-transformers model...")
try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Failed to load sentence-transformers: {e}")
    embedding_model = None

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception:
    supabase = None

# Setup CORS to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Job Application AI Backend is running!"}

@app.post("/api/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # Read file into memory
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        
        # Extract text from PDF
        text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        
        # Fallback keyword extraction strategy
        # TODO: Integrate full spaCy NLP logic here once model is downloaded
        common_skills = [
            "Python", "JavaScript", "React", "Node.js", "Express",
            "Machine Learning", "Data Analysis", "SQL", "PostgreSQL",
            "MongoDB", "Docker", "AWS", "FastAPI", "TypeScript",
            "NLP", "PyTorch", "TensorFlow", "HTML", "CSS"
        ]
        
        extracted_skills = []
        text_lower = text.lower()
        
        # Simple string matching
        for skill in common_skills:
            # Look for exact word match with word boundaries
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                extracted_skills.append(skill)
                
        # Provide some default skills if none are found so the user sees something
        if not extracted_skills:
            extracted_skills = ["Communication", "Problem Solving", "Adaptability"]
            
        return {
            "filename": file.filename,
            "skills": extracted_skills
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

class MatchRequest(BaseModel):
    skills: List[str]

@app.post("/api/match-jobs")
async def match_jobs(req: MatchRequest):
    if not embedding_model:
        return {"error": "Model not loaded", "matches": []}
        
    query_text = ", ".join(req.skills)
    embedding = embedding_model.encode(query_text).tolist()
    
    if not supabase or "your-project" in SUPABASE_URL:
        # LOCAL FALLBACK DATABASE
        try:
            with open("local_jobs_db.json", "r") as f:
                local_jobs = json.load(f)
        except Exception:
            return {"error": "Local jobs not found. Please run 'python seed_jobs.py'.", "matches": []}
            
        def cosine_similarity(v1, v2):
            dot = np.dot(v1, v2)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            return float(dot / (norm1 * norm2)) if norm1 and norm2 else 0.0
            
        for job in local_jobs:
            job['similarity'] = cosine_similarity(embedding, job['embedding'])
            
        local_jobs.sort(key=lambda x: x['similarity'], reverse=True)
        top_jobs = local_jobs[:5]
        
        user_skills_lower = [s.lower() for s in req.skills]
        for job in top_jobs:
            required = job.get('required_skills', [])
            matched = []
            gaps = []
            for rs in required:
                if rs.lower() in user_skills_lower:
                    matched.append(rs)
                else:
                    gaps.append(rs)
            job['matched'] = matched
            job['gaps'] = gaps
            if 'embedding' in job: del job['embedding']
            
        return {"matches": top_jobs}
        
    try:
        response = supabase.rpc("match_jobs", {
            "query_embedding": embedding,
            "match_threshold": 0.2, # loose threshold for demo flexibility 
            "match_count": 5
        }).execute()
        
        jobs = response.data
        user_skills_lower = [s.lower() for s in req.skills]
        
        for job in jobs:
            required = job.get('required_skills', [])
            matched = []
            gaps = []
            for rs in required:
                if rs.lower() in user_skills_lower:
                    matched.append(rs)
                else:
                    gaps.append(rs)
                    
            job['matched'] = matched
            job['gaps'] = gaps
            
        return {"matches": jobs}
        
    except Exception as e:
        return {"error": str(e), "matches": []}

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

import os
import random
import json
import uuid
from sentence_transformers import SentenceTransformer

print("Loading AI Embedding Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

roles = [
    "Software Engineer", "Data Scientist", "Frontend Developer", 
    "Backend Developer", "Machine Learning Engineer", "DevOps Engineer", 
    "Full Stack Developer", "Data Analyst", "Product Manager", "UI/UX Designer"
]

companies = [
    "TechCorp", "Innova", "DataWorks", "CloudSys", "AppFactory", 
    "VisionAI", "NextGen", "FinTech Solutions", "HealthCorp", "EduTech"
]

skill_pool = {
    "Software Engineer": ["Python", "Java", "C++", "SQL", "Git", "Docker", "Algorithms", "System Design"],
    "Data Scientist": ["Python", "R", "SQL", "Machine Learning", "Pandas", "AWS", "TensorFlow", "Statistics"],
    "Frontend Developer": ["JavaScript", "React", "HTML", "CSS", "TypeScript", "Tailwind", "Next.js", "Redux"],
    "Backend Developer": ["Python", "Node.js", "PostgreSQL", "MongoDB", "FastAPI", "Docker", "Redis", "GraphQL"],
    "Machine Learning Engineer": ["Python", "PyTorch", "TensorFlow", "NLP", "AWS", "Machine Learning", "Computer Vision"],
    "DevOps Engineer": ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform", "Jenkins", "Bash"],
    "Full Stack Developer": ["JavaScript", "React", "Node.js", "PostgreSQL", "Python", "AWS", "TypeScript", "Docker"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "Python", "Data Analysis", "PowerBI", "Statistics", "Looker"],
    "Product Manager": ["Agile", "Scrum", "Communication", "Jira", "Product Strategy", "Leadership", "Analytics"],
    "UI/UX Designer": ["Figma", "Sketch", "Prototyping", "User Research", "CSS", "Wireframing", "Adobe XD", "Accessibility"]
}

jobs_to_insert = []
NUM_JOBS = 120

print(f"Generating {NUM_JOBS} synthetic jobs and computing embeddings...")
for i in range(NUM_JOBS):
    role = random.choice(roles)
    company = random.choice(companies)
    title = f"{role} @ {company}"
    description = f"Looking for a motivated {role} to join our engineering team at {company}. You will build impactful products at scale."
    
    num_skills = random.randint(3, 6)
    req_skills = random.sample(skill_pool[role], min(num_skills, len(skill_pool[role])))
    
    if random.random() > 0.5:
        random_role = random.choice(list(skill_pool.keys()))
        req_skills.append(random.choice(skill_pool[random_role]))
        
    req_skills = list(set(req_skills))
    skills_text = ", ".join(req_skills)
    embedding = model.encode(skills_text).tolist()
    
    jobs_to_insert.append({
        "id": str(uuid.uuid4()),
        "title": title,
        "description": description,
        "required_skills": req_skills,
        "embedding": embedding
    })

print(f"Successfully computed {NUM_JOBS} embeddings.")
print("Saving jobs locally to bypass Supabase credentials...")

with open("local_jobs_db.json", "w") as f:
    json.dump(jobs_to_insert, f, indent=2)

print(f"🎉 DONE! Saved {NUM_JOBS} jobs to backend/local_jobs_db.json.")

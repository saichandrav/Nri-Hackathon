from openai import OpenAI
import json
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

def run_analyze(resume_text: str) -> dict:
    """
    Analyze the uploaded resume to extract skills and suggest target roles.
    Uses OpenAI Client + OpenRouter (Nemotron 3 Super).
    """
    print("[Analyzer] Analyzing uploaded resume...")      

    system_prompt = (
        "You are an expert ATS and recruitment AI. Your job is to analyze a raw resume text "
        "and return a JSON object with strictly two keys: 'skills' (a list of up to 15 top skills found) "
        "and 'suggested_roles' (a list of 3 job titles best fitting the resume).\n\n"
        "Output ONLY valid JSON. No markdown fences, no explanations."
    )

    user_prompt = f"Resume Text:\n{resume_text[:4000]}"   

    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": system_prompt}, 
            {"role": "user", "content": user_prompt},     
        ],
        temperature=0.2,
        max_tokens=500,
    )

    content = response.choices[0].message.content.strip()

    # Clean up any potential markdown code blocks
    if content.startswith("```json"):
        content = content[len("```json"):].strip()
    elif content.startswith("```"):
        content = content[3:].strip()
    if content.endswith("```"):
        content = content[:-3].strip()

    try:
        data = json.loads(content)
        return {
            "skills": data.get("skills", []),
            "suggested_roles": data.get("suggested_roles", [])
        }
    except Exception as e:
        print(f"[Analyzer] JSON parse error: {e}. Raw content: {content}")
        return {"skills": [], "suggested_roles": []}

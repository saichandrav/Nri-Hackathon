"""
Agent 2: The Resume Tailor
Takes a Master Resume and a specific Job Description, then rewrites the resume
to maximize ATS keyword matching without hallucinating experience.
Uses LiteLLM + OpenRouter (Nemotron 3 Super).
"""
import litellm
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Call the OpenRouter LLM via LiteLLM."""
    response = litellm.completion(
        model=f"openrouter/{OPENROUTER_MODEL}",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        api_key=OPENROUTER_API_KEY,
        temperature=0.4,
        max_tokens=6000,
    )
    return response.choices[0].message.content


def run_tailor(master_resume: str, job_description: str, job_title: str = "") -> str:
    """
    Run the Resume Tailor agent.

    Args:
        master_resume: The full text of the user's master resume.
        job_description: The job description to tailor the resume for.
        job_title: Optional job title for context.

    Returns:
        A Markdown-formatted string of the tailored resume.
    """
    print(f"[Tailor] Tailoring resume for '{job_title}'...")

    system_prompt = (
        "You are a world-class ATS Resume Writer who has helped 10,000+ candidates "
        "land jobs at FAANG, top startups, and Fortune 500 companies.\n\n"
        "RULES YOU MUST FOLLOW:\n"
        "1. NEVER fabricate or hallucinate skills, experiences, or qualifications not in the original resume.\n"
        "2. Only restructure, reword, and reorder existing content.\n"
        "3. Use the STAR method (Situation, Task, Action, Result) for bullet points.\n"
        "4. Include metrics and numbers where the original resume has them.\n"
        "5. Output in clean Markdown format.\n"
        "6. Sections: Contact Info, Professional Summary, Skills, Experience, Education, Certifications (if any)."
    )

    user_prompt = (
        f"## Job Title: {job_title}\n\n"
        f"## Job Description:\n{job_description[:3000]}\n\n"
        f"## Candidate's Master Resume:\n{master_resume[:4000]}\n\n"
        f"## Your Task:\n"
        f"1. Identify the top 10 keywords from the JD.\n"
        f"2. Rewrite experience bullet points to naturally include those keywords.\n"
        f"3. Reorder the skills section — most relevant skills first.\n"
        f"4. Write a powerful 2-3 line professional summary addressing the JD.\n"
        f"5. Do NOT add any skills or experiences not in the original resume.\n\n"
        f"Output ONLY the tailored resume in clean Markdown. No explanations."
    )

    result = _call_llm(system_prompt, user_prompt)

    # Clean up any markdown code fences wrapping the result
    result = result.strip()
    if result.startswith("```markdown"):
        result = result[len("```markdown"):].strip()
    if result.startswith("```"):
        result = result[3:].strip()
    if result.endswith("```"):
        result = result[:-3].strip()

    print(f"[Tailor] Resume tailored successfully ({len(result)} characters).")
    return result

"""
Agent 2: The Resume Tailor
Takes a Master Resume and a specific Job Description, then rewrites the resume
to maximize ATS keyword matching without hallucinating experience.
Uses LiteLLM + OpenRouter (Nemotron 3 Super).
"""
from openai import OpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)


def _extract_template_and_source(master_resume: str) -> tuple[str, str]:
    text = master_resume or ""
    if "[TEMPLATE_START]" in text and "[TEMPLATE_END]" in text:
        template = text.split("[TEMPLATE_START]", 1)[1].split("[TEMPLATE_END]", 1)[0].strip()
    else:
        template = text.strip()

    if "[SOURCE_RESUME_START]" in text and "[SOURCE_RESUME_END]" in text:
        source_resume = text.split("[SOURCE_RESUME_START]", 1)[1].split("[SOURCE_RESUME_END]", 1)[0].strip()
    else:
        source_resume = text.strip()

    return template, source_resume

def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Call the OpenRouter LLM via OpenAI Client."""
    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": system_prompt}, 
            {"role": "user", "content": user_prompt},     
        ],
        temperature=0.1,
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

    template, source_resume = _extract_template_and_source(master_resume)

    system_prompt = (
        "You are a world-class ATS Resume Writer. "
        "You must output valid LaTeX using the provided locked template.\n\n"
        "STRICT FORMAT RULES:\n"
        "1. NEVER fabricate or hallucinate skills, experiences, qualifications, dates, or achievements.\n"
        "2. Keep the exact same LaTeX structure, commands, environments, and section order.\n"
        "3. You may only edit human-readable text content inside the existing template.\n"
        "4. Do not add or remove sections, and do not add new LaTeX blocks.\n"
        "5. Preserve line-break style and overall layout as closely as possible.\n"
        "6. Improve wording only for ATS relevance to the target JD.\n"
        "7. Output ONLY the full final LaTeX source. No explanations."
    )

    user_prompt = (
        f"## Job Title: {job_title}\n\n"
        f"## Job Description:\n{job_description[:5000]}\n\n"
        f"## Source Resume Facts (for content grounding):\n{source_resume[:12000]}\n\n"
        f"## Locked LaTeX Template (must keep structure exact):\n{template[:26000]}\n\n"
        f"## Your Task:\n"
        f"1. Identify relevant keywords from the JD.\n"
        f"2. Adjust wording inside existing lines/bullets to better match those keywords.\n"
        f"3. Keep section order and LaTeX structure exactly the same as the locked template.\n"
        f"4. Do NOT add or remove sections, commands, or environments, and do NOT invent content.\n\n"
        f"Output ONLY the full tailored LaTeX source with the same format. No explanations."
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

    if "\\documentclass" not in result:
        return template

    print(f"[Tailor] Resume tailored successfully ({len(result)} characters).")
    return result

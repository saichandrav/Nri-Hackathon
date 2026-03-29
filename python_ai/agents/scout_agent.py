"""
Agent 1: The Job Scout
Uses the scraper pipeline to find relevant job postings based on the user's target role and location.
Uses LiteLLM + OpenRouter (Nemotron 3 Super) to analyze and rank results.
"""
import json
from openai import OpenAI
from tools.exa_search_tool import search_jobs
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Call the OpenRouter LLM via OpenAI Client."""
    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": system_prompt}, 
            {"role": "user", "content": user_prompt},     
        ],
        max_tokens=4000,
    )
    return response.choices[0].message.content


def run_scout(target_role: str, location: str) -> list[dict]:
    """
    Run the Job Scout agent to find relevant jobs.

    This function:
    1. Uses the scraper pipeline to find raw job postings.
    2. Passes them through an LLM that filters and ranks the results.
    3. Returns a clean list of the top 5 jobs.
    """
    print(f"[Scout] Searching for '{target_role}' jobs in '{location}'...")

    # Step 1: Get raw jobs from scraper pipeline
    raw_jobs = search_jobs(target_role, location, num_results=10)

    if not raw_jobs:
        print("[Scout] No jobs found from the scraper pipeline.")
        return []

    print(f"[Scout] Found {len(raw_jobs)} raw results. Asking LLM to analyze...")

    # Step 2: Use LLM to analyze and rank the jobs
    system_prompt = (
        "You are a Senior Tech Job Scout with 15 years of recruiting experience. "
        "You know exactly what makes a job posting legitimate and relevant. "
        "You filter out spam, outdated listings, and irrelevant roles. "
        "You prioritize jobs with clear descriptions, good companies, and matching skill requirements. "
        "You ALWAYS respond with valid JSON."
    )

    # Format jobs for the LLM
    jobs_text = ""
    for i, job in enumerate(raw_jobs):
        jobs_text += f"\n--- JOB {i+1} ---\n"
        jobs_text += f"Title: {job['title']}\n"
        jobs_text += f"Company: {job['company']}\n"
        jobs_text += f"URL: {job['url']}\n"
        jobs_text += f"Source: {job['scrapedFrom']}\n"
        jobs_text += f"Description: {job['description'][:500]}\n"

    user_prompt = (
        f"You have been given {len(raw_jobs)} job postings found for '{target_role}' in '{location}'.\n\n"
        f"{jobs_text}\n\n"
        "Your task:\n"
        "1. Filter out spam, irrelevant, or duplicate listings.\n"
        "2. Rank the remaining jobs by relevance to the target role.\n"
        "3. Select the TOP 5 best jobs.\n"
        "4. Return ONLY a JSON array of objects with these keys:\n"
        '   title, company, url, location, description (2-3 sentence summary), scrapedFrom\n'
        "Output ONLY the JSON array. No extra text, no markdown fences, just raw JSON."
    )

    try:
        result = _call_llm(system_prompt, user_prompt)
        # Clean markdown fences if present
        result = result.strip()
        if result.startswith("```"):
            result = result.split("\n", 1)[1] if "\n" in result else result[3:]
        if result.endswith("```"):
            result = result[:-3]
        result = result.strip()

        parsed = json.loads(result)
        if isinstance(parsed, list):
            print(f"[Scout] LLM selected {len(parsed)} top jobs.")
            return parsed[:5]
    except (json.JSONDecodeError, Exception) as e:
        print(f"[Scout] LLM parsing failed ({e}), falling back to raw results.")

    # Fallback: return raw scraper results
    return raw_jobs[:5]

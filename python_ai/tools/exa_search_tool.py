"""
Exa Search Tool for the Job Scout Agent.
Uses the Exa API to perform neural search for job postings.
"""
from exa_py import Exa
from config import EXA_API_KEY


def search_jobs(target_role: str, location: str, num_results: int = 5) -> list[dict]:
    """
    Search for job postings using Exa's neural search.

    Args:
        target_role: The job role to search for (e.g., "Full Stack Developer")
        location: The preferred location (e.g., "Remote" or "Bangalore")
        num_results: Number of job results to return

    Returns:
        A list of dictionaries containing job details.
    """
    if not EXA_API_KEY:
        raise ValueError("EXA_API_KEY is not set. Please add it to your .env file.")

    exa = Exa(api_key=EXA_API_KEY)

    query = f"{target_role} jobs in {location} hiring now"

    results = exa.search_and_contents(
        query,
        type="neural",
        num_results=num_results,
        text=True,
        start_published_date="2025-01-01",
        include_domains=[
            "linkedin.com/jobs",
            "indeed.com",
            "glassdoor.com",
            "wellfound.com",
            "lever.co",
            "greenhouse.io",
            "naukri.com",
            "instahyre.com",
        ],
    )

    jobs = []
    for result in results.results:
        job_data = {
            "title": result.title or "Untitled Role",
            "company": _extract_company(result.title, result.url),
            "url": result.url,
            "location": location,
            "description": (result.text or "")[:2000],
            "scrapedFrom": _extract_source(result.url),
        }
        jobs.append(job_data)

    return jobs


def _extract_company(title: str, url: str) -> str:
    """Try to extract company name from the title or URL."""
    if " at " in title:
        return title.split(" at ")[-1].strip()
    if " - " in title:
        parts = title.split(" - ")
        if len(parts) >= 2:
            return parts[-1].strip()
    # Fallback: extract from domain
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace("www.", "")
        return domain.split(".")[0].capitalize()
    except Exception:
        return "Unknown"


def _extract_source(url: str) -> str:
    """Identify which platform the job was found on."""
    url_lower = url.lower()
    if "linkedin" in url_lower:
        return "LinkedIn"
    elif "indeed" in url_lower:
        return "Indeed"
    elif "glassdoor" in url_lower:
        return "Glassdoor"
    elif "naukri" in url_lower:
        return "Naukri"
    elif "wellfound" in url_lower:
        return "Wellfound"
    elif "lever.co" in url_lower:
        return "Lever"
    elif "greenhouse" in url_lower:
        return "Greenhouse"
    elif "instahyre" in url_lower:
        return "Instahyre"
    else:
        return "Other"

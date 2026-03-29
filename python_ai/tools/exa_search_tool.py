"""Job search tool for the Job Scout Agent.

Priority order:
1) JobSpy (primary)
2) Selenium (Naukri-focused fallback)
3) Requests + BeautifulSoup (final fallback)
"""

from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote, urlparse
import re
import time
import random

import requests
from bs4 import BeautifulSoup

try:
    from jobspy import scrape_jobs as _jobspy_scrape
    JOBSPY_AVAILABLE = True
except Exception:
    JOBSPY_AVAILABLE = False

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    SELENIUM_AVAILABLE = True
except Exception:
    SELENIUM_AVAILABLE = False


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
]


def search_jobs(target_role: str, location: str, num_results: int = 5) -> list[dict]:
    """Return normalized jobs for the scout pipeline by combining multiple sources."""
    desired = max(num_results, 5)
    jobs = []

    # 1. JobSpy (Indeed, LinkedIn, Glassdoor, etc.)
    try:
        print("[Scraper] Searching via JobSpy (Indeed/Others)...")
        jobs.extend(_search_with_jobspy(target_role, location, results_wanted=10))
    except Exception as e:
        print(f"[Scraper] JobSpy error: {e}")

    # 2. Naukri (Selenium)
    try:
        print("[Scraper] Searching via Naukri (Selenium)...")
        jobs.extend(_search_with_naukri_selenium(target_role, location, max_jobs=8))
    except Exception as e:
        print(f"[Scraper] Naukri error: {e}")

    # 3. LinkedIn (BS4 Fallback)
    try:
        print("[Scraper] Searching via LinkedIn (Direct)...")
        jobs.extend(_search_with_linkedin_bs4(target_role, location, max_jobs=8))
    except Exception as e:
        print(f"[Scraper] LinkedIn error: {e}")

    # 4. Internshala (BS4)
    try:
        print("[Scraper] Searching via Internshala...")
        jobs.extend(_search_with_internshala_bs4(target_role, location, max_jobs=8))
    except Exception as e:
        print(f"[Scraper] Internshala error: {e}")

    print(f"[Scraper] Raw jobs found across all sources: {len(jobs)}")
    
    normalized = _normalize_jobs(jobs, fallback_location=location)
    deduped = _dedupe_jobs(normalized)
    print(f"[Scraper] Jobs after deduplication: {len(deduped)}")
    
    # We pass a higher count to freshness policy so the LLM gets plenty to choose from
    fresh = _apply_freshness_policy(deduped, desired * 3)
    return fresh[:desired * 3]


def _search_with_jobspy(target_role: str, location: str, results_wanted: int) -> list[dict]:
    if not JOBSPY_AVAILABLE:
        return []

    try:
        df = _jobspy_scrape(
            site_name=["linkedin", "indeed", "glassdoor", "google", "zip_recruiter"],
            search_term=target_role,
            location=location,
            results_wanted=results_wanted,
            hours_old=168,
            description_format="markdown",
        )
    except Exception:
        return []

    if df is None or df.empty:
        return []

    rows = []
    for _, row in df.iterrows():
        rows.append(
            {
                "title": row.get("title", ""),
                "company": row.get("company", ""),
                "url": row.get("job_url", ""),
                "location": row.get("location", ""),
                "description": row.get("description", ""),
                "scrapedFrom": _normalize_source_name(str(row.get("site", "JobSpy"))),
                "date_posted": row.get("date_posted", None),
            }
        )
    return rows


def _random_headers() -> dict[str, str]:
    return {"User-Agent": random.choice(USER_AGENTS)}

def _search_with_linkedin_bs4(target_role: str, location: str, max_jobs: int) -> list[dict]:
    role_encoded = quote(target_role)
    loc_encoded = quote(location)
    url = (
        "https://www.linkedin.com/jobs/search"
        f"?keywords={role_encoded}&location={loc_encoded}"
        "&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=0"
    )

    try:
        response = requests.get(url, headers=_random_headers(), timeout=15)
        response.raise_for_status()
    except requests.RequestException:
        return []

    soup = BeautifulSoup(response.text, "lxml")
    cards = soup.select("ul.jobs-search__results-list li")
    jobs = []
    for card in cards[:max_jobs]:
        title_el = card.select_one("h3.base-search-card__title")
        company_el = card.select_one("h4.base-search-card__subtitle")
        loc_el = card.select_one("span.job-search-card__location")
        url_el = card.select_one("a.base-card__full-link")
        time_el = card.select_one("time")

        jobs.append(
            {
                "title": title_el.get_text(strip=True) if title_el else "",
                "company": company_el.get_text(strip=True) if company_el else "",
                "url": (url_el.get("href", "").split("?")[0] if url_el else ""),
                "location": loc_el.get_text(strip=True) if loc_el else location,
                "description": "",
                "scrapedFrom": "LinkedIn",
                "date_posted": time_el.get("datetime", "") if time_el else "",
            }
        )
    return jobs


def _search_with_internshala_bs4(target_role: str, location: str, max_jobs: int) -> list[dict]:
    # Internshala URLs usually follow: internshala.com/internships/keyword-internship-in-location
    # Or for jobs: internshala.com/jobs/keyword-jobs-in-location
    clean_role = re.sub(r"[^a-zA-Z0-9]+", "-", target_role.lower()).strip("-")
    clean_loc = re.sub(r"[^a-zA-Z0-9]+", "-", location.lower()).strip("-")
    url = f"https://internshala.com/jobs/{clean_role}-jobs-in-{clean_loc}"

    try:
        response = requests.get(url, headers=_random_headers(), timeout=15)
        response.raise_for_status()
    except requests.RequestException:
        # Fallback to general jobs page if specific URL fails
        try:
            fallback_url = f"https://internshala.com/jobs/keywords-{clean_role}/"
            response = requests.get(fallback_url, headers=_random_headers(), timeout=15)
            response.raise_for_status()
        except requests.RequestException:
            return []

    soup = BeautifulSoup(response.text, "lxml")
    cards = soup.select("div.internship_meta")
    jobs = []
    
    for card in cards[:max_jobs]:
        title_el = card.select_one("h3.job-internship-name")
        company_el = card.select_one("p.company-name")
        loc_el = card.select_one("div.row-1-item.locations span a")
        
        # Internshala doesn't usually expose raw URL easily on the card title, look for href
        url_el = title_el.find("a") if title_el else None
        job_url = "https://internshala.com" + url_el.get("href", "") if url_el and url_el.get("href") else ""
        
        jobs.append(
            {
                "title": title_el.get_text(strip=True) if title_el else "",
                "company": company_el.get_text(strip=True) if company_el else "",
                "url": job_url,
                "location": loc_el.get_text(strip=True) if loc_el else location,
                "description": "",
                "scrapedFrom": "Internshala",
                "date_posted": "",
            }
        )
    return jobs

def _search_with_naukri_selenium(target_role: str, location: str, max_jobs: int) -> list[dict]:
    if not SELENIUM_AVAILABLE:
        return []

    # Keep Selenium as fallback-only and Naukri-focused.
    query = re.sub(r"\s+", "-", f"{target_role} {location}".strip().lower())
    url = f"https://www.naukri.com/{query}-jobs"

    options = ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument(f"--user-agent={random.choice(USER_AGENTS)}")

    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(25)
        driver.get(url)
        time.sleep(4)

        soup = BeautifulSoup(driver.page_source, "lxml")
        cards = soup.select("article.jobTuple, div.srp-jobtuple-wrapper")
        jobs = []
        for card in cards[:max_jobs]:
            title_el = card.select_one("a.title.ellipsis, a.title")
            company_el = card.select_one("a.comp-name, span.comp-name")
            loc_el = card.select_one("span.locWdth, li.location span")
            desc_el = card.select_one("span.job-desc, div.job-description")
            date_el = card.select_one("span.job-post-day, span.job-posted-day")

            job_url = title_el.get("href", "") if title_el else ""
            jobs.append(
                {
                    "title": title_el.get_text(strip=True) if title_el else "",
                    "company": company_el.get_text(strip=True) if company_el else "",
                    "url": job_url,
                    "location": loc_el.get_text(strip=True) if loc_el else location,
                    "description": desc_el.get_text(" ", strip=True) if desc_el else "",
                    "scrapedFrom": "Naukri",
                    "date_posted": date_el.get_text(" ", strip=True) if date_el else "",
                }
            )
        return jobs
    except Exception:
        return []
    finally:
        if driver is not None:
            driver.quit()


def _normalize_jobs(jobs: list[dict], fallback_location: str) -> list[dict]:
    normalized: list[dict] = []
    for job in jobs:
        url = str(job.get("url", "")).strip()
        title = str(job.get("title", "")).strip() or "Untitled Role"
        if not url and title == "Untitled Role":
            continue

        normalized.append(
            {
                "title": title,
                "company": str(job.get("company", "")).strip() or _extract_company(title, url),
                "url": url,
                "location": str(job.get("location", "")).strip() or fallback_location,
                "description": str(job.get("description", "")).strip()[:2000],
                "scrapedFrom": str(job.get("scrapedFrom", "")).strip() or _extract_source(url),
                "date_posted": job.get("date_posted", ""),
            }
        )
    return normalized


def _dedupe_jobs(jobs: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for job in jobs:
        key = _canonical_url(job.get("url", ""))
        if not key:
            key = f"{job.get('title', '').lower()}|{job.get('company', '').lower()}|{job.get('location', '').lower()}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(job)
    return unique


def _apply_freshness_policy(jobs: list[dict], desired: int) -> list[dict]:
    now = datetime.now(timezone.utc)
    dated: list[tuple[int, dict]] = []
    undated: list[dict] = []

    for job in jobs:
        age_days = _estimate_age_days(job.get("date_posted"), now)
        if age_days is None:
            undated.append(job)
            continue
        if age_days > 7:
            continue
        recency_score = 3 if age_days <= 3 else 2
        job["_recency_score"] = recency_score
        dated.append((recency_score, job))

    dated.sort(key=lambda x: x[0], reverse=True)
    filtered = [job for _, job in dated]

    if len(filtered) < desired:
        undated_cap = max(2, desired // 2)
        for job in undated[:undated_cap]:
            job["_recency_score"] = 1
            filtered.append(job)

    for job in filtered:
        job.pop("_recency_score", None)
        job.pop("date_posted", None)
    return filtered


def _estimate_age_days(raw_date: Any, now: datetime) -> int | None:
    if raw_date is None:
        return None
    raw = str(raw_date).strip()
    if not raw:
        return None

    lower = raw.lower()
    if "today" in lower or "just now" in lower:
        return 0
    if "yesterday" in lower:
        return 1

    day_match = re.search(r"(\d+)\s*day", lower)
    if day_match:
        return int(day_match.group(1))

    hour_match = re.search(r"(\d+)\s*hour", lower)
    if hour_match:
        hours = int(hour_match.group(1))
        return 0 if hours < 24 else 1

    parsed = _parse_datetime(raw)
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    delta = now - parsed
    return max(0, delta.days)


def _parse_datetime(value: str) -> datetime | None:
    text = value.strip()
    if not text:
        return None

    normalized = text.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except Exception:
        pass

    patterns = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y",
        "%b %d, %Y",
        "%B %d, %Y",
    ]
    for pattern in patterns:
        try:
            return datetime.strptime(text, pattern)
        except Exception:
            continue
    return None


def _canonical_url(url: str) -> str:
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return ""
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".lower().rstrip("/")
    except Exception:
        return ""


def _extract_company(title: str, url: str) -> str:
    if " at " in title:
        return title.split(" at ")[-1].strip()
    if " - " in title:
        parts = title.split(" - ")
        if len(parts) >= 2:
            return parts[-1].strip()
    try:
        domain = urlparse(url).netloc.replace("www.", "")
        return domain.split(".")[0].capitalize() if domain else "Unknown"
    except Exception:
        return "Unknown"


def _extract_source(url: str) -> str:
    value = (url or "").lower()
    if "linkedin" in value:
        return "LinkedIn"
    if "indeed" in value:
        return "Indeed"
    if "glassdoor" in value:
        return "Glassdoor"
    if "naukri" in value:
        return "Naukri"
    if "ziprecruiter" in value:
        return "ZipRecruiter"
    if "google" in value:
        return "Google"
    return "Other"


def _normalize_source_name(site: str) -> str:
    value = site.lower()
    if value == "zip_recruiter":
        return "ZipRecruiter"
    if value == "linkedin":
        return "LinkedIn"
    if value == "indeed":
        return "Indeed"
    if value == "glassdoor":
        return "Glassdoor"
    if value == "google":
        return "Google"
    return site.title() if site else "JobSpy"


def _random_headers() -> dict:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://www.google.com/",
    }

# Implementation Plan: JobSpy-First Migration (Phase-Wise)

This plan implements the new search pipeline in phases and shows exactly where to verify each phase is working.

Priority order:
1. JobSpy (main)
2. Selenium Naukri fallback
3. BeautifulSoup fallback/enrichment

## Current Progress
- [x] Phase 1: JobSpy-first search tool integrated
- [x] Phase 2: Selenium fallback path added in search tool
- [x] Phase 3: BeautifulSoup fallback path added in search tool
- [x] Phase 4: Freshness filtering and dedupe added
- [x] Phase 5: Scout agent wording and fallback messages updated
- [x] Phase 6: Python dependencies/config updated (Exa removed)
- [x] Phase 7: Backend timeout/error messaging updated
- [x] Phase 8: Frontend loading text updated for slower sources
- [x] Phase 9: Full runtime verification pending

---

## Phase 0: Baseline Contract Lock
### Goal
Keep scout contract unchanged while replacing internals.

### Where implemented
- `python_ai/main.py`
- `backend/controllers/aiController.js`

### Working check
1. Call `POST /api/start-scout` via backend route `POST /api/ai/scout-jobs`.
2. Confirm response includes: `success`, `jobs`, `count`.
3. Confirm each job includes: `title`, `company`, `url`, `location`, `description`, `scrapedFrom`.

### Not working if
1. Any key above is missing or renamed.

---

## Phase 1: JobSpy as Main Engine
### Goal
Use JobSpy as default retrieval path.

### Where implemented
- `python_ai/tools/exa_search_tool.py`

### Working check
1. Start Python service.
2. Trigger scout from UI.
3. Confirm jobs return even with no Exa key configured.

### Not working if
1. Scout depends on Exa variables/packages.
2. Common searches return empty due to primary path failure.

---

## Phase 2: Selenium Naukri Fallback
### Goal
Use Selenium only when JobSpy is insufficient.

### Where implemented
- `python_ai/tools/exa_search_tool.py` (`_search_with_naukri_selenium`)

### Working check
1. Run a Naukri-heavy query where JobSpy underperforms.
2. Confirm additional results include `scrapedFrom: Naukri`.

### Not working if
1. Selenium runs for every request.
2. Selenium causes hard failure instead of graceful fallback.

---

## Phase 3: BeautifulSoup Fallback
### Goal
Use BS4 as final fallback for public pages.

### Where implemented
- `python_ai/tools/exa_search_tool.py` (`_search_with_linkedin_bs4`)

### Working check
1. Trigger scout where results are still low after JobSpy/Selenium.
2. Confirm fallback results appear with valid title/url fields.

### Not working if
1. BS4 exceptions crash the whole request.

---

## Phase 4: Freshness + Dedupe
### Goal
Prioritize recent jobs and reduce duplicates.

### Where implemented
- `python_ai/tools/exa_search_tool.py` (`_apply_freshness_policy`, `_dedupe_jobs`)

### Working check
1. Confirm older than 7 days are excluded by default.
2. Confirm undated entries appear only when needed.
3. Confirm duplicate URLs are removed.

### Not working if
1. Old jobs dominate top results.
2. Duplicate cards appear in dashboard for same job URL.

---

## Phase 5: Ranking Layer Stability
### Goal
Keep OpenRouter ranking behavior unchanged.

### Where implemented
- `python_ai/agents/scout_agent.py`

### Working check
1. Scout still returns ranked top jobs.
2. If LLM parsing fails, fallback returns raw jobs.

### Not working if
1. Ranking output breaks expected job keys.

---

## Phase 6: Config and Dependency Migration
### Goal
Remove Exa dependency and adopt scraper stack.

### Where implemented
- `python_ai/requirements.txt`
- `python_ai/config.py`
- `python_ai/.env.example`

### Working check
1. `pip install -r requirements.txt` succeeds.
2. Python server starts without Exa package/key.

### Not working if
1. Import errors for `jobspy`, `bs4`, or `selenium`.

---

## Phase 7: Backend Timeout and Error Handling
### Goal
Handle slower fallback scraping without premature timeout.

### Where implemented
- `backend/controllers/aiController.js`

### Working check
1. Scout requests can run up to 4 minutes.
2. Error message mentions slower scraper behavior when failures happen.

### Not working if
1. Requests still time out too early.

---

## Phase 8: Frontend UX Messaging
### Goal
Set realistic loading expectation for users.

### Where implemented
- `job scraping/src/components/Dashboard.jsx`

### Working check
1. During scout, button text shows longer expected wait.

### Not working if
1. UI still shows generic quick-scan wording only.

---

## Phase 9: End-to-End Validation (Run Now)
### Goal
Verify full flow is stable.

### Run in 3 terminals
#### Terminal 1: Python
```bash
cd python_ai
pip install -r requirements.txt
copy .env.example .env
# add OPENROUTER_API_KEY
python main.py
```

#### Terminal 2: Node
```bash
cd backend
npm install
copy .env.example .env
npm start
```

#### Terminal 3: Frontend
```bash
cd "job scraping"
npm install
npm run dev
```

### End-to-end checks
1. Health checks:
   - `http://localhost:8001`
   - `http://localhost:8000`
2. Login and open dashboard.
3. Run scout with role/location.
4. Confirm jobs are saved and rendered.
5. Confirm tailor flow still works.

### Pass criteria
1. Job results returned with correct schema.
2. No Exa dependency required.
3. Dashboard remains functional.

---

## Final Release Checklist
- [x] Exa removed from Python dependency/config path
- [x] JobSpy-first retrieval wired
- [x] Selenium + BS4 fallback paths wired
- [x] Backend timeout increased
- [x] Frontend slow-source loading text updated
- [ ] Full runtime validation completed on local machine

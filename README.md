# Diamond Hacks — MedJourney

A full-stack demo for a medical care journey: doctors upload visit notes (PDFs) and free text, the backend runs an analysis and agent pipeline, and patients see a guided dashboard with medicines, travel, surgery cost estimates, and insurance-related flows.

## What’s in the repo

| Area | Stack |
|------|--------|
| **Frontend** | React 19, React Router 7, Vite 6 |
| **Backend** | FastAPI, Uvicorn |
| **AI / automation** | Groq, Browser Use SDK (optional flows), Google Maps (travel) |
| **Data** | PDF parsing (`pypdf`), CMS RVU CSV for pricing context, session JSON under `backend/data/` |

### Main routes (UI)

- `/` — Landing
- `/doctor` — Doctor portal (uploads, review)
- `/patient` — Patient layout with dashboard, medicines, travel, and surgery pages

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so the browser can call the API on the same origin during local development.

## Prerequisites

- **Python** 3.11+ recommended (match what you use for the locked deps in `backend/requirements.txt`)
- **Node.js** 18+ (for Vite and npm scripts)

## Backend setup

From the repository root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment variables

Create `backend/.env` (loaded by the agent modules via `python-dotenv`). Typical keys:

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq API for analysis / surgery agent paths |
| `BROWSER_USE_API_KEY` | Browser Use SDK where agents need it (e.g. medicines, travel) |
| `GOOGLE_MAPS_API_KEY` | Optional; used for travel / mapping features when set |

Some code paths raise a clear error if a required key is missing; others degrade gracefully when a key is absent.

### Run the API

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for the interactive OpenAPI UI.

On startup and shutdown, the app clears session uploads and certain JSON artifacts under `backend/uploads/` and `backend/data/` so each run starts from a clean session state.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

By default Vite serves the app (often at `http://localhost:5173`) and proxies API calls under `/api` to the backend on port **8000**.

### Run frontend and API together

If your backend virtualenv lives at `backend/venv`:

```bash
cd frontend
npm run dev:stack
```

This starts Vite and Uvicorn concurrently.

### Optional: explicit API base URL

For builds or non-proxy setups, set `VITE_API_URL` to your API origin (no trailing slash required for how `api.js` concatenates paths).

## Production build (frontend)

```bash
cd frontend
npm run build
npm run preview   # optional local preview of the static build
```

Serve the `frontend/dist` output behind your hosting of choice; configure the API URL or reverse proxy so `/api` reaches the FastAPI app.

## Project layout

```
backend/
  main.py              # FastAPI app, CORS, router registration, session cleanup
  routers/             # HTTP endpoints (analyse, results, patient profile, insurance, n8n proxy, etc.)
  agents/              # PDF/analysis and specialized agents
  insurance_filler/    # Insurance form helpers
  data/                # Session JSON + CMS CSV (bundled data)
  uploads/             # Uploaded files (cleared on server lifecycle)
frontend/
  src/                 # React app, pages, API client
```

## License / attribution

Add your team’s license or hackathon attribution here if you publish the repo.

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyse, approve, health, patient_detail, results, patient_profile_router, n8n_proxy, insurance_claim

BACKEND_ROOT = Path(__file__).resolve().parent
DATA_DIR = BACKEND_ROOT / "data"
UPLOADS_DIR = BACKEND_ROOT / "uploads"

SESSION_ARTIFACTS = (
    "patient_state.json",
    "medicines_result.json",
    "surgery_result.json",
    "travel_result.json",
    "patient_profile.json",
)


def cleanup_session_artifacts() -> None:
    """Remove uploads and per-session JSON outputs so the next server run starts clean."""
    if UPLOADS_DIR.is_dir():
        for p in UPLOADS_DIR.iterdir():
            if p.is_file():
                try:
                    p.unlink()
                except OSError:
                    pass
    for name in SESSION_ARTIFACTS:
        fp = DATA_DIR / name
        if fp.is_file():
            try:
                fp.unlink()
            except OSError:
                pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup_session_artifacts()
    print("\n[startup] Cleared any leftover session files from previous run.\n", flush=True)
    yield
    cleanup_session_artifacts()
    print("\n[shutdown] Removed session uploads and patient_state / agent result JSON files.\n", flush=True)


app = FastAPI(title="Diamond Medical Agent", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(analyse.router, prefix="/api")
app.include_router(approve.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(patient_detail.router, prefix="/api")
app.include_router(patient_profile_router.router, prefix="/api")
app.include_router(n8n_proxy.router, prefix="/api")
app.include_router(insurance_claim.router, prefix="/api")

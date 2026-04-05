import json
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException

from routers.agent_pipeline import run_all_agents_sequential

router = APIRouter(tags=["approve"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PATIENT_STATE_PATH = DATA_DIR / "patient_state.json"


@router.post("/approve-complete")
async def approve_complete(background_tasks: BackgroundTasks):
    """
    Run agents 1→3 only after analysis is complete and the doctor approves the AI review.
    """
    if not PATIENT_STATE_PATH.is_file():
        raise HTTPException(status_code=400, detail="No patient_state.json — run analysis first.")

    try:
        with open(PATIENT_STATE_PATH) as f:
            state = json.load(f)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid patient_state.json: {e}") from e

    if state.get("status") != "complete":
        raise HTTPException(
            status_code=400,
            detail="Analysis is still incomplete. Add documents and resubmit until all required fields are present.",
        )

    background_tasks.add_task(run_all_agents_sequential)
    print("\n[approve-complete] Scheduling agent pipeline (1 → 2 → 3)…\n", flush=True)
    return {"ok": True, "message": "Agent pipeline scheduled"}

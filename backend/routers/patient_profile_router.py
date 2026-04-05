from pathlib import Path
import asyncio
import json

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List

router = APIRouter()

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_ROOT / "data"


class InsuranceEntry(BaseModel):
    provider: str
    policy_number: str
    group_number: str
    type: str
    member_id: str
    plan_name: str


class PersonalInfo(BaseModel):
    first_name: str
    last_name: str
    dob: str
    phone: str
    email: str
    address: str
    city: str
    state: str
    zip: str


class PatientProfilePayload(BaseModel):
    personal: PersonalInfo
    insurance: List[InsuranceEntry]


@router.get("/patient/profile/status")
def profile_status():
    fp = DATA_DIR / "patient_profile.json"
    return {"exists": fp.is_file()}


def _pipeline_already_ran() -> bool:
    """True if approve has already been clicked (at least one result file exists)."""
    return any(
        (DATA_DIR / name).exists()
        for name in ("medicines_result.json", "surgery_result.json")
    )


async def _run_agent3_background():
    from agents.agent3_travel import run_agent3
    try:
        print("\n[profile] Patient profile saved after pipeline ran — triggering Agent 3 now…\n", flush=True)
        await run_agent3()
        print("[profile] Agent 3 finished.", flush=True)
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Agent 3 (travel) failed after late profile save")


@router.post("/patient/profile")
async def save_profile(payload: PatientProfilePayload, background_tasks: BackgroundTasks):
    fp = DATA_DIR / "patient_profile.json"
    with open(fp, "w") as f:
        json.dump(payload.model_dump(), f, indent=2)

    if _pipeline_already_ran():
        background_tasks.add_task(_run_agent3_background)

    return {"ok": True}

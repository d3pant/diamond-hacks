from pathlib import Path
import json

from fastapi import APIRouter
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


@router.post("/patient/profile")
def save_profile(payload: PatientProfilePayload):
    fp = DATA_DIR / "patient_profile.json"
    with open(fp, "w") as f:
        json.dump(payload.model_dump(), f, indent=2)
    return {"ok": True}

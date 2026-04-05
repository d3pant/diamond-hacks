"""
Patient-facing detail JSON: surgery cost math aligned with agents/agent2_surgery.py
(CONVERSION_FACTOR must stay in sync with that file.)
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["patient-detail"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SURGERY_PATH = DATA_DIR / "surgery_result.json"

# Mirrors agents/agent2_surgery.py — update both if this changes
CONVERSION_FACTOR = 33.4009


@router.get("/patient/surgery-breakdown")
def surgery_breakdown():
    """
    Full surgery_result.json plus explicit calculation steps from Agent 2 logic.
    """
    if not SURGERY_PATH.is_file():
        raise HTTPException(status_code=404, detail="surgery_result.json not found")

    with open(SURGERY_PATH) as f:
        result = json.load(f)

    surgeon = result.get("surgeon_fee") or {}
    facility = result.get("facility_fee") or {}
    total = result.get("total") or {}

    sf = surgeon.get("amount")
    fmin = facility.get("minimum")
    fmax = facility.get("maximum")

    steps = [
        {
            "id": "cpt_mapping",
            "title": "Procedure → CPT",
            "description": (
                "Agent 2 maps the procedure name from patient_state to a CPT code using the LLM, "
                "then validates the code exists in the CMS PPRRVU extract."
            ),
            "outputs": {
                "cpt_code": result.get("cpt_code"),
                "cpt_description": result.get("cpt_description"),
            },
        },
        {
            "id": "surgeon_fee",
            "title": "Surgeon / professional component (Medicare benchmark)",
            "description": (
                "From CMS National Physician Fee Schedule (PPRRVU): for the CPT row, use facility_total RVU "
                "and multiply by the calendar-year conversion factor to get a dollar professional fee estimate."
            ),
            "formula": "surgeon_fee_usd = round(facility_total_rvu × CONVERSION_FACTOR, 2)",
            "constants": {"CONVERSION_FACTOR": CONVERSION_FACTOR},
            "source": surgeon.get("source"),
            "value_usd": sf,
        },
        {
            "id": "facility_fee",
            "title": "Hospital / facility component",
            "description": (
                "Minimum and maximum facility charges for the same CPT from the hospital price transparency JSON."
            ),
            "source": facility.get("source"),
            "minimum_usd": fmin,
            "maximum_usd": fmax,
        },
        {
            "id": "total_gross",
            "title": "Combined gross estimate (before insurance)",
            "description": "Sum professional estimate with facility low/high bounds when all components exist.",
            "formula": "total_min_usd = round(surgeon_fee + facility_minimum, 2); total_max_usd = round(surgeon_fee + facility_maximum, 2)",
            "minimum_usd": total.get("minimum"),
            "maximum_usd": total.get("maximum"),
        },
    ]

    return {
        "surgery_result": result,
        "calculation": {
            "conversion_factor_medicare": CONVERSION_FACTOR,
            "code_reference": "backend/agents/agent2_surgery.py — CONVERSION_FACTOR, run_agent2() total_min/total_max",
            "steps": steps,
        },
    }

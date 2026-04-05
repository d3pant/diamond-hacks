import json
import tempfile
from datetime import date
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from insurance_filler import (
    ClaimDetails,
    ClaimantInfo,
    FillRequest,
    fill_government_claim_pdf,
)

router = APIRouter()

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_ROOT / "data"
TEMPLATE_PDF = BACKEND_ROOT / "insurance_filler" / "template.pdf"


def _build_fill_request(profile: dict, patient_state: dict) -> FillRequest:
    personal = profile.get("personal", {})
    insurance_entries = profile.get("insurance", [])
    ins = insurance_entries[0] if insurance_entries else {}

    data = patient_state.get("data", {})
    diagnosis = data.get("diagnosis", "")
    surgery_name = data.get("surgery_name", "")

    claim_amount = ""
    surgery_data = {}
    try:
        surgery_path = DATA_DIR / "surgery_result.json"
        if surgery_path.is_file():
            surgery_data = json.loads(surgery_path.read_text()).get("surgery_result", {})
            total_max = surgery_data.get("total", {}).get("maximum")
            if total_max:
                claim_amount = str(int(total_max))
    except Exception:
        pass

    hospital = surgery_data.get("hospital", "")
    procedure = surgery_data.get("procedure", surgery_name)

    claimant = ClaimantInfo(
        first_name=personal.get("first_name", ""),
        last_name=personal.get("last_name", ""),
        telephone=personal.get("phone", ""),
        email=personal.get("email", ""),
        mailing_address=personal.get("address", ""),
        city=personal.get("city", ""),
        state=personal.get("state", ""),
        zip_code=personal.get("zip", ""),
        insured_name_subrogation=ins.get("provider", ""),
        under_18=False,
        is_amendment=False,
    )

    description_parts = []
    if diagnosis:
        description_parts.append(f"Diagnosis: {diagnosis}")
    if procedure:
        description_parts.append(f"Procedure: {procedure}")
    if hospital:
        description_parts.append(f"Facility: {hospital}")

    claim = ClaimDetails(
        dollar_amount_of_claim=claim_amount,
        dollar_amount_explanation=". ".join(description_parts),
        damage_or_injury_description=diagnosis,
        insurance_carrier_name=ins.get("provider", ""),
        insurance_claim_number=ins.get("policy_number", ""),
        date_signed=date.today().strftime("%m/%d/%Y"),
        printed_name=f"{personal.get('first_name', '')} {personal.get('last_name', '')}".strip(),
        claim_filed_with_carrier=bool(ins.get("provider")),
        received_insurance_payment=False,
    )

    return FillRequest(claimant=claimant, claim=claim)


@router.get("/patient/insurance-claim")
def download_insurance_claim():
    profile_path = DATA_DIR / "patient_profile.json"
    state_path = DATA_DIR / "patient_state.json"

    if not profile_path.is_file():
        raise HTTPException(status_code=404, detail="Patient profile not found")

    profile = json.loads(profile_path.read_text())
    patient_state = json.loads(state_path.read_text()) if state_path.is_file() else {}

    fill_request = _build_fill_request(profile, patient_state)

    personal = profile.get("personal", {})
    last_name = personal.get("last_name", "claim")
    filename = f"insurance_claim_{last_name}.pdf"

    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp.close()
    tmp_path = Path(tmp.name)

    try:
        fill_government_claim_pdf(TEMPLATE_PDF, fill_request, tmp_path)
    except Exception as e:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    return FileResponse(
        path=str(tmp_path),
        media_type="application/pdf",
        filename=filename,
        background=None,
    )

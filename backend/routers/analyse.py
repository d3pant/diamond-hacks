import json
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from agents.analyser import analyse, save_to_disk

router = APIRouter(tags=["analyse"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
PATIENT_STATE_PATH = Path(__file__).resolve().parent.parent / "data" / "patient_state.json"


def _truthy_form(v: Optional[str]) -> bool:
    if v is None:
        return False
    return str(v).strip().lower() in ("1", "true", "yes", "on")


@router.post("/analyse")
async def analyse_endpoint(
    files: Optional[List[UploadFile]] = File(default=None),
    text: Optional[str] = Form(default=None),
    merge_previous: Optional[str] = Form(default=None),
):
    """
    merge_previous=true: merge new PDFs/notes with existing patient_state.data on disk.
    """
    merge = _truthy_form(merge_previous)

    if not merge and not files and not text:
        raise HTTPException(
            status_code=400,
            detail="Send at least one PDF or text input.",
        )

    if merge and not files and not (text and str(text).strip()):
        raise HTTPException(
            status_code=400,
            detail="Merge requires new PDFs or additional notes.",
        )

    if files and len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 PDFs allowed.",
        )

    try:
        prev_uploads: list[str] = []
        if PATIENT_STATE_PATH.is_file():
            try:
                with open(PATIENT_STATE_PATH) as f:
                    prev_state = json.load(f)
                prev_uploads = list(prev_state.get("uploaded_files") or [])
            except (json.JSONDecodeError, OSError):
                prev_uploads = []

        pdf_bytes_list = []
        saved_files = []

        if files:
            for f in files:
                if f.filename:
                    content = await f.read()
                    upload_id = str(uuid.uuid4())[:8]
                    save_path = UPLOADS_DIR / f"{upload_id}_{f.filename}"
                    with open(save_path, "wb") as out:
                        out.write(content)
                    saved_files.append(str(save_path))
                    pdf_bytes_list.append(content)

        result = analyse(pdf_bytes_list, text, merge_previous=merge)
        result["uploaded_files"] = prev_uploads + saved_files
        save_to_disk(result)

        status_code = 200 if result["status"] == "complete" else 206
        return JSONResponse(content=result, status_code=status_code)

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analyser failed: {str(e)}")

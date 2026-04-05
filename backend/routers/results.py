import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["results"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_RESULT_FILES = {
    "patient_state": "patient_state.json",
    "medicines": "medicines_result.json",
    "surgery": "surgery_result.json",
    "travel": "travel_result.json",
}


def _read_json(name: str) -> dict | None:
    filename = _RESULT_FILES.get(name)
    if not filename:
        return None
    path = DATA_DIR / filename
    if not path.is_file():
        return None
    with open(path) as f:
        return json.load(f)


@router.get("/results/bundle")
def results_bundle():
    """All saved JSON outputs in one response (nulls for missing files)."""
    return {key: _read_json(key) for key in _RESULT_FILES}


@router.get("/results/{name}")
def get_result(name: str):
    """Return one agent output file if it exists (read-only)."""
    if name not in _RESULT_FILES:
        raise HTTPException(status_code=404, detail="Unknown result key")
    data = _read_json(name)
    if data is None:
        raise HTTPException(status_code=404, detail=f"{_RESULT_FILES[name]} not found")
    return data

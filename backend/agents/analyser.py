import os
import io
import json
import pathlib
import pypdf
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are a medical document parser.
You will receive text extracted from one or more medical documents.
Extract all relevant information and return ONLY valid JSON matching this exact schema.
Do not invent or infer anything not explicitly stated in the documents.
If a field is not found in any document, use null.
Return raw JSON only — no markdown, no code blocks, no explanation.

Schema:
{
  "diagnosis": "string or null",
  "medicines": [
    {"name": "string", "qty": "string"}
  ],
  "surgery_treatment": {
    "name": "string or null",
    "what": "string or null",
    "when": "ISO datetime string or null",
    "where": "string or null",
    "address": "string or null"
  },
  "followups": [
    {"type": "string", "when": "string or null", "where": "string or null"}
  ]
}"""

DATA_PATH = pathlib.Path(__file__).parent.parent / "data" / "patient_state.json"


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text.strip()


def merge_documents(pdf_bytes_list: list[bytes], extra_text: str = None) -> str:
    parts = []
    for i, pdf_bytes in enumerate(pdf_bytes_list):
        text = extract_text_from_pdf(pdf_bytes)
        if text:
            parts.append(f"--- DOCUMENT {i+1} ---\n{text}")
    if extra_text and extra_text.strip():
        parts.append(f"--- ADDITIONAL NOTES ---\n{extra_text.strip()}")
    return "\n\n".join(parts)


def call_groq(merged_text: str, messages_override: list = None) -> dict:
    messages = messages_override or [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Parse these medical documents:\n\n{merged_text}"},
    ]
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0,
        response_format={"type": "json_object"},
        max_tokens=1024,
    )
    raw = response.choices[0].message.content.strip()
    return json.loads(raw)


def clean_data(data: dict) -> dict:
    """Remove null entries from lists that would break downstream agents."""
    if isinstance(data.get("medicines"), list):
        data["medicines"] = [m for m in data["medicines"] if m.get("name")]
    if isinstance(data.get("followups"), list):
        data["followups"] = [f for f in data["followups"] if f.get("type")]
    return data


def validate(data: dict) -> list[str]:
    """Structural validation — checks types are correct."""
    errors = []
    if not data.get("diagnosis"):
        errors.append("diagnosis is missing")
    if not isinstance(data.get("medicines"), list):
        errors.append("medicines must be a list")
    if not isinstance(data.get("surgery_treatment"), dict):
        errors.append("surgery_treatment must be an object")
    if not isinstance(data.get("followups"), list):
        errors.append("followups must be a list")
    return errors


def check_critical_fields(data: dict) -> list[str]:
    """
    Content validation — checks for missing medical data.
    These are fields the doctor needs to provide, not structural errors.
    """
    missing = []

    medicines = data.get("medicines", [])
    if not medicines:
        missing.append("medicines — no medications found in document")

    st = data.get("surgery_treatment", {})
    if st.get("name"):
        if not st.get("when"):
            missing.append("surgery_treatment.when — procedure date not specified")
        if not st.get("where"):
            missing.append("surgery_treatment.where — facility name not found")
        if not st.get("address"):
            missing.append("surgery_treatment.address — facility address not found")

    followups = data.get("followups", [])
    for i, f in enumerate(followups):
        if not f.get("when"):
            missing.append(
                f"followups[{i}] — date not specified for {f.get('type', 'follow-up')}"
            )

    return missing


def save_to_disk(result: dict) -> None:
    """Persist patient_state.json. Preserves uploaded_files on disk unless result sets it."""
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    out = {
        "status": result["status"],
        "data": result["data"],
        "missing_fields": result["missing_fields"],
    }
    if "uploaded_files" in result:
        out["uploaded_files"] = result["uploaded_files"]
    elif DATA_PATH.exists():
        try:
            with open(DATA_PATH) as f:
                prev = json.load(f)
            if prev.get("uploaded_files"):
                out["uploaded_files"] = prev["uploaded_files"]
        except (json.JSONDecodeError, OSError):
            pass
    with open(DATA_PATH, "w") as f:
        json.dump(out, f, indent=2)


def analyse(
    pdf_bytes_list: list[bytes],
    extra_text: str = None,
    *,
    merge_previous: bool = False,
) -> dict:
    """
    Parse PDFs + optional text. If merge_previous, load prior data from disk and merge with new material.
    Saves {status, data, missing_fields} and preserves uploaded_files until router sets them.
    """
    if len(pdf_bytes_list) > 5:
        raise ValueError("Maximum 5 PDFs allowed.")

    prior_data = None
    if merge_previous and DATA_PATH.exists():
        try:
            with open(DATA_PATH) as f:
                snap = json.load(f)
            prior_data = snap.get("data")
        except (json.JSONDecodeError, OSError):
            prior_data = None

    if merge_previous and prior_data is None:
        merge_previous = False

    new_notes = (extra_text or "").strip()
    if merge_previous:
        if not pdf_bytes_list and not new_notes:
            raise ValueError("Merge requires new PDFs or notes to add to the prior extraction.")
    else:
        if not pdf_bytes_list and not new_notes:
            raise ValueError("No input provided. Send at least one PDF or text.")

    new_merged = merge_documents(pdf_bytes_list, extra_text)
    if not new_merged.strip():
        raise ValueError(
            "Could not extract any text from the provided documents."
            if not merge_previous
            else "Merge requires non-empty text from new PDFs or notes."
        )

    if merge_previous and prior_data is not None:
        user_block = (
            "Prior extraction (JSON). Fill gaps using ONLY the new material below. "
            "Keep existing non-null values unless new documents clearly contradict them.\n\n"
            + json.dumps(prior_data, indent=2)
            + "\n\n--- NEW DOCUMENTS AND NOTES ---\n"
            + new_merged
        )
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_block},
        ]
        data = call_groq(new_merged, messages_override=messages)
    else:
        data = call_groq(new_merged)

    data = clean_data(data)
    errors = validate(data)

    if errors:
        retry_messages = (
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_block},
                {"role": "assistant", "content": json.dumps(data)},
                {
                    "role": "user",
                    "content": f"Your output had issues: {errors}. Fix and return complete JSON.",
                },
            ]
            if merge_previous and prior_data is not None
            else [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Parse these medical documents:\n\n{new_merged}"},
                {"role": "assistant", "content": json.dumps(data)},
                {
                    "role": "user",
                    "content": f"Your output had issues: {errors}. Fix and return complete JSON.",
                },
            ]
        )
        data = call_groq(new_merged, messages_override=retry_messages)
        data = clean_data(data)

    missing = check_critical_fields(data)

    result = {
        "status": "incomplete" if missing else "complete",
        "data": data,
        "missing_fields": missing,
    }

    save_to_disk(result)
    return result

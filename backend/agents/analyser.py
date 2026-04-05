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
        {"role": "user", "content": f"Parse these medical documents:\n\n{merged_text}"}
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


def save_to_disk(result: dict):
    """Persist the full analyser output to data/patient_state.json."""
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_PATH, "w") as f:
        json.dump(result, f, indent=2)


def analyse(pdf_bytes_list: list[bytes], extra_text: str = None) -> dict:
    """
    Main entry point.
    Takes 1-5 PDF byte payloads + optional typed text.
    Returns structured result dict and saves to disk.
    """
    if not pdf_bytes_list and not extra_text:
        raise ValueError("No input provided. Send at least one PDF or text.")

    if len(pdf_bytes_list) > 5:
        raise ValueError("Maximum 5 PDFs allowed.")

    merged = merge_documents(pdf_bytes_list, extra_text)
    if not merged.strip():
        raise ValueError("Could not extract any text from the provided documents.")

    # First Groq call
    data = call_groq(merged)
    data = clean_data(data)
    errors = validate(data)

    # One automatic retry if structural validation fails
    if errors:
        data = call_groq(merged, messages_override=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Parse these medical documents:\n\n{merged}"},
            {"role": "assistant", "content": json.dumps(data)},
            {"role": "user", "content": f"Your output had issues: {errors}. Fix and return complete JSON."}
        ])
        data = clean_data(data)

    # Content check — missing medical fields
    missing = check_critical_fields(data)

    result = {
        "status": "incomplete" if missing else "complete",
        "data": data,
        "missing_fields": missing
    }

    save_to_disk(result)
    return result
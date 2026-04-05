from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pathlib import Path
import uuid
from agents.analyser import analyse

app = FastAPI(title="Diamond Medical Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyse")
async def analyse_endpoint(
    files: Optional[List[UploadFile]] = File(default=None),
    text: Optional[str] = Form(default=None),
):
    """
    Input:  1-5 PDF files (multipart) + optional typed text
    Output: structured medical JSON

    Returns 200 if complete, 206 if missing fields.
    Frontend checks status field to decide next step.
    """
    if not files and not text:
        raise HTTPException(
            status_code=400,
            detail="Send at least one PDF or text input."
        )

    if files and len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 PDFs allowed."
        )

    try:
        pdf_bytes_list = []
        saved_files = []

        if files:
            for f in files:
                if f.filename:
                    content = await f.read()

                    # Save to local uploads folder
                    upload_id = str(uuid.uuid4())[:8]
                    save_path = UPLOADS_DIR / f"{upload_id}_{f.filename}"
                    with open(save_path, "wb") as out:
                        out.write(content)
                    saved_files.append(str(save_path))

                    pdf_bytes_list.append(content)

        result = analyse(pdf_bytes_list, text)

        # Attach saved file paths to result for reference
        result["uploaded_files"] = saved_files

        # 206 = incomplete, frontend shows re-entry form
        # 200 = complete, frontend triggers downstream agents
        status_code = 200 if result["status"] == "complete" else 206
        return JSONResponse(content=result, status_code=status_code)

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analyser failed: {str(e)}")
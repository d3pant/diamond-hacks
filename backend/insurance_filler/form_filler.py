from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any, Optional

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, NameObject

from insurance_filler.models import ClaimDetails, FillRequest

# Fallback for DGS ORIM 006 if /Sig widget lookup fails after edits to the PDF.
_FALLBACK_SIGNATURE_PAGE = 1
_FALLBACK_SIGNATURE_RECT = (19.6365, 511.272, 229.855, 528.217)

try:
    from reportlab.pdfgen.canvas import Canvas
except ImportError:  # pragma: no cover
    Canvas = Any  # type: ignore[misc, assignment]


def _norm_label(s: str) -> str:
    s = str(s)
    if s.startswith("/"):
        s = s[1:]
    return s.strip().lower()


def _non_off_appearance_states(kid: DictionaryObject) -> list[str]:
    ap = kid.get("/AP")
    if not ap:
        return []
    ap = ap.get_object()
    n = ap.get("/N")
    if not n:
        return []
    n = n.get_object()
    out: list[str] = []
    for key in n.keys():
        ks = str(key)
        if _norm_label(ks) == "off":
            continue
        out.append(ks)
    return out


def _sync_radio_appearances(field: DictionaryObject) -> None:
    if field.get("/FT") != "/Btn":
        return
    kids = field.get("/Kids")
    if not kids:
        return
    v = field.get("/V")
    if v is None:
        return
    if hasattr(v, "get_object"):
        v = v.get_object()
    target = _norm_label(str(v))

    candidates: list[tuple[int, str]] = []
    for i, kidref in enumerate(kids):
        kid = kidref.get_object()
        for st in _non_off_appearance_states(kid):
            stn = _norm_label(st)
            if stn == target:
                candidates.append((i, st))
            elif target and (target in stn or stn in target):
                candidates.append((i, st))

    if not candidates:
        return

    exact = [(i, st) for i, st in candidates if _norm_label(st) == target]
    pool = exact if exact else candidates

    if target == "no":
        prefer = [(i, st) for i, st in pool if _norm_label(st) == "no"]
        if prefer:
            pool = prefer

    chosen_i, chosen_st = pool[0]
    as_val = chosen_st if str(chosen_st).startswith("/") else "/" + str(chosen_st)

    for i, kidref in enumerate(kids):
        kid = kidref.get_object()
        if i == chosen_i:
            kid[NameObject("/AS")] = NameObject(as_val)
        else:
            kid[NameObject("/AS")] = NameObject("/Off")


def _sync_all_button_appearances(writer: PdfWriter) -> None:
    root = writer.root_object
    acro = root.get("/AcroForm")
    if not acro:
        return
    acro = acro.get_object()
    fields = acro.get("/Fields")
    if not fields:
        return
    for ref in fields:
        _sync_radio_appearances(ref.get_object())


def _yes_no(value: Optional[bool]) -> Optional[str]:
    if value is None:
        return None
    return "Yes" if value else "No"


def _state_vehicle(value: Optional[bool]) -> Optional[str]:
    if value is None:
        return None
    return "yes" if value else "No"


def _civil_case(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if value == "limited":
        return "limited 25 thousand dollars or less"
    if value == "non_limited":
        return "non-limited over 25 thousand dollars"
    return value


def build_field_values(req: FillRequest) -> dict[str, str]:
    c = req.claimant
    r = req.representative
    q = req.claim

    values: dict[str, str] = {}

    def put(key: str, val: str) -> None:
        if val is not None and str(val).strip() != "":
            values[key] = str(val)

    put("FIRST NAME", c.first_name)
    put("LAST NAME", c.last_name)
    put("MIDDLE INITIAL", c.middle_initial)
    put("TELEPHONE NUMBER", c.telephone)
    put("EMAIL ADDRESS", c.email)
    put("MAILING ADDRESS", c.mailing_address)
    put("CITY", c.city)
    put("STATE", c.state)
    put("ZIP", c.zip_code)
    put("BUSINESS NAME if applicable", c.business_name)
    put("INMATE OR PATIENT IDENTIFICATION NUMBER if applicable", c.inmate_or_patient_id)
    put("INSURED NAME Insurance Company Subrogation", c.insured_name_subrogation)
    put("EXISTING CLAIM NUMBERif applicable", c.existing_claim_number)
    put("EXISTING CLAIMANT NAME if applicable", c.existing_claimant_name)

    yn = _yes_no(c.under_18)
    if yn is not None:
        values["Is the claimant under 18 years of age"] = yn
    yn = _yes_no(c.is_amendment)
    if yn is not None:
        values["ISTHISAN AMENDMENTTO A PREVIOUSLYEXISTINGCLAIM"] = yn

    put("attorney or representative first name", r.first_name)
    put("attorney or representative last name", r.last_name)
    put("attorney or representative middle initial", r.middle_initial)
    put("attorney or representative telephone number", r.telephone)
    put("attorney or representative email address", r.email)
    put("attorney or representative mailing address", r.mailing_address)
    put("attorney or representative city", r.city)
    put("attorney or representative state", r.state)
    put("attorney or representative zip code", r.zip_code)

    put("state agencies or employees against whom the claim is filed", q.state_agencies_or_employees)
    put("DATE OF INCIDENT", q.date_of_incident)
    put("Late Claim Explanation", q.late_claim_explanation)
    cc = _civil_case(q.civil_case_type)
    if cc is not None:
        values["Civil case type"] = cc
    put("dollar amount of claim", q.dollar_amount_of_claim)
    put("Dollar Amount Explanation", q.dollar_amount_explanation)
    put("Incident Location", q.incident_location)
    put("Specific Damage or Injury Description", q.damage_or_injury_description)
    put("Circumstances that led to damage or injury", q.circumstances)
    put("explain why you believe the sate is responsible for the damage or injury", q.why_state_responsible)

    yn = _yes_no(q.claim_filed_with_carrier)
    if yn is not None:
        values["HASACLAIM BEENFILED WITHYOURINSURANCECARRIER"] = yn
    yn = _yes_no(q.received_insurance_payment)
    if yn is not None:
        values["HAVEYOURECEIVEDAN INSURANCEPAYMENTFORTHISDAMAGEORINJURY"] = yn

    put("AMOUNTOF DEDUCTIBLEif any", q.amount_deductible)
    sv = _state_vehicle(q.involves_state_vehicle)
    if sv is not None:
        values["Does the claim involve a state vehicle"] = sv
    put("vehicle license number if known", q.vehicle_license)
    put("state driver name if known", q.state_driver_name)
    put("insurance carrier name", q.insurance_carrier_name)
    put("insurance claim number", q.insurance_claim_number)
    put("amount received if any", q.amount_received)
    put("PRINTED NAME", q.printed_name)
    put("DATE", q.date_signed)

    return values


def _claim_has_visual_signature(claim: ClaimDetails) -> bool:
    if claim.signature_text and str(claim.signature_text).strip():
        return True
    p = str(claim.signature_image_path or "").strip()
    return bool(p) and Path(p).is_file()


def _find_signature_widget_placement(writer: PdfWriter) -> Optional[tuple[int, tuple[float, float, float, float]]]:
    for i, page in enumerate(writer.pages):
        annots = page.get("/Annots")
        if not annots:
            continue
        annots = annots.get_object()
        for aref in annots:
            a = aref.get_object()
            if a.get("/Subtype") != "/Widget":
                continue
            if a.get("/FT") != "/Sig":
                continue
            rect = a.get("/Rect")
            if not rect:
                continue
            r = tuple(float(x) for x in rect)
            return (i, r)
    return None


def _draw_visual_signature(
    canvas: Canvas,
    page_index: int,
    placement: tuple[int, tuple[float, float, float, float]],
    claim: ClaimDetails,
) -> None:
    sig_page, rect = placement
    if page_index != sig_page:
        return
    x0, y0, x1, y1 = rect
    w, h = x1 - x0, y1 - y0
    if w <= 0 or h <= 0:
        return

    img_path = str(claim.signature_image_path or "").strip()
    text = str(claim.signature_text or "").strip()

    if img_path and Path(img_path).is_file():
        try:
            canvas.drawImage(
                img_path,
                x0,
                y0,
                width=w,
                height=h,
                preserveAspectRatio=True,
                anchor="sw",
                mask="auto",
            )
            return
        except OSError:
            pass

    if not text:
        return

    from reportlab.pdfbase.pdfmetrics import stringWidth

    font_name = "Times-Italic"
    size = 12.0
    max_w = max(w - 4.0, 1.0)
    for s in range(12, 5, -1):
        size = float(s)
        if stringWidth(text, font_name, size) <= max_w:
            break
    canvas.setFont(font_name, size)
    canvas.setFillColorRGB(0, 0, 0)
    baseline = y0 + max((h - size) / 2.0, 0.0) + size * 0.25
    canvas.drawString(x0 + 2.0, baseline, text)


def _merge_reportlab_overlay(
    writer: PdfWriter,
    page_index: int,
    draw: Callable[[Canvas], None],
    pagesize: tuple[float, float],
) -> None:
    from io import BytesIO

    from reportlab.pdfgen import canvas as rl_canvas

    buf = BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=pagesize)
    draw(c)
    c.save()
    buf.seek(0)
    overlay_reader = PdfReader(buf)
    writer.pages[page_index].merge_page(overlay_reader.pages[0])


def fill_government_claim_pdf(
    template_pdf_path: str | Path,
    request: FillRequest,
    output_path: str | Path,
    *,
    pdf_password: str = "",
    overlay_draw: Optional[Callable[[Canvas, int], None]] = None,
) -> None:
    """
    Fill the California DGS ORIM 006 Government Claim PDF (AcroForm).

    ``overlay_draw`` receives a ReportLab ``Canvas`` and the 0-based page index.
    Use it to stamp text or shapes on top of the filled form (same coordinate
    system as US Letter: 612 x 72 pt wide by 792 x 72 pt tall).

    Set ``ClaimDetails.signature_text`` and/or ``signature_image_path`` (PNG/JPG,
    etc.) to draw a **visual** signature in the ``claimant signature`` box (page 2).
    This does not apply a cryptographic PDF signature.
    """
    template_pdf_path = Path(template_pdf_path)
    output_path = Path(output_path)

    reader = PdfReader(str(template_pdf_path))
    if reader.is_encrypted:
        reader.decrypt(pdf_password)

    writer = PdfWriter()
    writer.append(reader)

    field_values = build_field_values(request)
    for page in writer.pages:
        writer.update_page_form_field_values(page, field_values, auto_regenerate=False)

    _sync_all_button_appearances(writer)

    letter_size = (612.0, 792.0)
    sig_placement: Optional[tuple[int, tuple[float, float, float, float]]] = None
    if _claim_has_visual_signature(request.claim):
        sig_placement = _find_signature_widget_placement(writer)
        if sig_placement is None:
            sig_placement = (_FALLBACK_SIGNATURE_PAGE, _FALLBACK_SIGNATURE_RECT)

    if sig_placement is not None or overlay_draw is not None:
        for i in range(len(writer.pages)):

            def draw_page(c: Canvas, idx: int = i) -> None:
                if sig_placement is not None:
                    _draw_visual_signature(c, idx, sig_placement, request.claim)
                if overlay_draw is not None:
                    overlay_draw(c, idx)

            _merge_reportlab_overlay(writer, i, draw_page, letter_size)

    with open(output_path, "wb") as f:
        writer.write(f)

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

router = APIRouter()

N8N_WEBHOOK = "https://shreyaan.app.n8n.cloud/webhook/72b73b82-76f3-4c77-9ff6-fa8a06405f73"


class WebhookPayload(BaseModel):
    action: str
    bundle: Any = None


def summarise_bundle(bundle: Any) -> dict:
    """Send only the key fields n8n needs — not the full raw bundle."""
    if not bundle or not isinstance(bundle, dict):
        return {}

    surgery  = bundle.get("surgery") or {}
    travel   = bundle.get("travel") or {}
    meds     = bundle.get("medicines") or {}
    profile  = bundle.get("patient_state", {}).get("data", {}) if bundle.get("patient_state") else {}

    return {
        "procedure":      surgery.get("procedure"),
        "hospital":       surgery.get("hospital"),
        "total_min":      surgery.get("total", {}).get("minimum"),
        "total_max":      surgery.get("total", {}).get("maximum"),
        "appointment":    travel.get("timeline", {}).get("appointment_str"),
        "travel_mode":    travel.get("mode"),
        "travel_cost":    travel.get("cab_cost", {}).get("estimate_str"),
        "medicines":      [
            {"drug": r.get("drug"), "best_price": r.get("cheapest_5", [{}])[0].get("price_str")}
            for r in (meds.get("results") or [])
        ],
        "diagnosis":      profile.get("diagnosis"),
    }


@router.post("/n8n/trigger")
async def trigger_n8n(payload: WebhookPayload):
    body = {
        "action":  payload.action,
        "summary": summarise_bundle(payload.bundle),
    }

    print(f"\n[n8n] Triggering webhook — action={payload.action}", flush=True)

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(N8N_WEBHOOK, json=body)

        print(f"[n8n] Response {resp.status_code}: {resp.text[:200]}", flush=True)

        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"n8n returned {resp.status_code}: {resp.text[:200]}")

        return {"ok": True, "status": resp.status_code, "body": resp.text}

    except httpx.TimeoutException:
        print("[n8n] Request timed out", flush=True)
        raise HTTPException(status_code=504, detail="n8n webhook timed out")
    except httpx.RequestError as e:
        print(f"[n8n] Request error: {e}", flush=True)
        raise HTTPException(status_code=502, detail=f"Could not reach n8n: {e}")

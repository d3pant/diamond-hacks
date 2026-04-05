"""
Agent 1 — Medicines Price Finder
=================================
Reads medicines from data/patient_state.json
Searches GoodRx for each medicine in batches of 3 (free plan limit)
Saves results to data/medicines_result.json
"""

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime

from browser_use_sdk.v3 import AsyncBrowserUse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

PHARMACY_URL = "https://www.goodrx.com"
MAX_CONCURRENT = 3
DATA_DIR = Path(__file__).parent.parent / "data"


# ── Structured output schema ──────────────────────────────────────────────────

class PharmacyOption(BaseModel):
    pharmacy_name: str
    price: float
    price_str: str
    coupon_available: bool
    url: str


class DrugPriceResult(BaseModel):
    drug: str
    qty: str
    cheapest_5: list[PharmacyOption] = Field(
        description="Top 5 cheapest pharmacy options sorted ascending by price"
    )


# ── Single drug search ────────────────────────────────────────────────────────

async def search_drug(
    drug_name: str,
    qty: str,
    semaphore: asyncio.Semaphore,
    index: int,
    total: int
) -> DrugPriceResult | None:
    async with semaphore:
        print(f"  🔍 [{index}/{total}] Searching {drug_name}...")
        try:
            client = AsyncBrowserUse(api_key=os.environ["BROWSER_USE_API_KEY"])

            # Direct URL — skip search step entirely
            drug_slug = drug_name.lower().replace(" ", "-")
            direct_url = f"{PHARMACY_URL}/{drug_slug}"

            task = f"""
Navigate to {direct_url}.
The page will show a price comparison table for {drug_name}.
Read only what is visible on first load — do NOT scroll, click, or interact.
Extract the 5 cheapest pharmacy options from the price table.
For each return:
- pharmacy_name: string
- price: float
- price_str: string (e.g. "$12.50")
- coupon_available: true or false
- url: the current page url
Stop immediately after extracting. Maximum 8 steps total.
"""

            result = await client.run(
                task,
                output_schema=DrugPriceResult,
                max_steps=8
            )

            output = result.output
            output.drug = drug_name
            output.qty = qty

            lowest = output.cheapest_5[0].price_str if output.cheapest_5 else "N/A"
            print(f"  ✅ [{index}/{total}] {drug_name} — lowest: {lowest}")
            return output

        except Exception as e:
            print(f"  ❌ [{index}/{total}] {drug_name} failed — {e}")
            return None


# ── Parallel search for all drugs ─────────────────────────────────────────────

async def find_all_prices(medicines: list[dict]) -> list[DrugPriceResult]:
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    tasks = [
        search_drug(
            drug_name=m["name"],
            qty=m.get("qty", "standard quantity"),
            semaphore=semaphore,
            index=i + 1,
            total=len(medicines)
        )
        for i, m in enumerate(medicines)
    ]

    results = await asyncio.gather(*tasks)
    return [r for r in results if r is not None]


# ── Main entry point ──────────────────────────────────────────────────────────

async def run_agent1() -> dict:
    state_path = DATA_DIR / "patient_state.json"
    if not state_path.exists():
        raise FileNotFoundError("patient_state.json not found. Run analyser first.")

    with open(state_path) as f:
        state = json.load(f)

    medicines = state.get("data", {}).get("medicines", [])

    if not medicines:
        print("  ⚠️  No medicines found in patient state. Skipping Agent 1.")
        return {"status": "skipped", "reason": "no medicines in patient state"}

    print(f"\n💊 Agent 1 — searching {len(medicines)} medicines (max {MAX_CONCURRENT} concurrent)")
    print(f"   Pharmacy: {PHARMACY_URL}\n")

    start = datetime.now()
    successful = await find_all_prices(medicines)
    elapsed = (datetime.now() - start).seconds

    output = {
        "status": "complete",
        "searched_at": datetime.utcnow().isoformat() + "Z",
        "pharmacy": PHARMACY_URL,
        "total_medicines": len(medicines),
        "successful_searches": len(successful),
        "elapsed_seconds": elapsed,
        "results": [r.model_dump() for r in successful]
    }

    out_path = DATA_DIR / "medicines_result.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n✅ Agent 1 complete — {len(successful)}/{len(medicines)} found in {elapsed}s")
    print(f"💾 Saved to data/medicines_result.json\n")

    return output


# ── CLI runner ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not os.environ.get("BROWSER_USE_API_KEY"):
        raise ValueError("Set BROWSER_USE_API_KEY in .env before running.")
    asyncio.run(run_agent1())
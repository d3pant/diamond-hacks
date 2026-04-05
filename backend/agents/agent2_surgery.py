"""
Agent 2 — Surgery Cost Estimator
==================================
Reads surgery_treatment from data/patient_state.json
Maps procedure name → CPT code via Groq
Looks up facility fee from hospital price transparency JSON
Looks up surgeon fee from CMS PPRRVU file
Outputs composite cost to data/surgery_result.json
"""

import os
import json
import pandas as pd
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

DATA_DIR = Path(__file__).parent.parent / "data"
CMS_FILE = DATA_DIR / "cms" / "PPRRVU2026_Jan_nonQPP.csv"
HOSPITAL_FILE = DATA_DIR / "cms" / "cedars_sinai_prices.json"
CONVERSION_FACTOR = 33.4009

# ── Load CMS fee schedule once at import ─────────────────────────────────────

def load_cms_lookup() -> dict:
    """Load PPRRVU CSV and return dict keyed by CPT code."""
    df = pd.read_csv(CMS_FILE, skiprows=9, header=0)
    df.columns = [c.strip().replace("\n", " ") for c in df.columns]

    # Find the right columns by position (file has fixed layout)
    # Col 0=HCPCS, Col 2=DESCRIPTION, Col 3=STATUS CODE, Col 5=WORK RVU,
    # Col 8=FACILITY PE RVU, Col 10=MP RVU, Col 12=FACILITY TOTAL
    df = df.iloc[:, [0, 2, 3, 5, 8, 10, 12]]
    df.columns = ["cpt_code", "description", "status",
                  "work_rvu", "facility_pe_rvu", "mp_rvu", "facility_total"]

    df["cpt_code"] = df["cpt_code"].astype(str).str.strip()
    df = df[df["status"] == "A"].copy()

    lookup = {}
    for _, row in df.iterrows():
        try:
            facility_total = float(row["facility_total"])
            lookup[row["cpt_code"]] = {
                "description": str(row["description"]).strip(),
                "facility_total_rvu": facility_total,
                "surgeon_fee": round(facility_total * CONVERSION_FACTOR, 2)
            }
        except (ValueError, TypeError):
            continue

    return lookup


def load_hospital_lookup() -> dict:
    """
    Load hospital price transparency JSON.
    Returns dict keyed by CPT code with min/max facility charges.
    Pre-processes once to avoid reloading 800MB on every call.
    """
    cache_path = DATA_DIR / "cms" / "hospital_lookup_cache.json"

    if cache_path.exists():
        with open(cache_path) as f:
            return json.load(f)

    print("  📦 Pre-processing hospital price file (one-time, ~30s)...")
    with open(HOSPITAL_FILE) as f:
        data = json.load(f)

    lookup = {}
    for item in data.get("standard_charge_information", []):
        for code_info in item.get("code_information", []):
            if code_info.get("type") == "CPT":
                cpt = str(code_info["code"]).strip()
                charges = item.get("standard_charges", [])
                if charges:
                    charge = charges[0]
                    lookup[cpt] = {
                        "description": item.get("description", ""),
                        "minimum": charge.get("minimum"),
                        "maximum": charge.get("maximum"),
                        "setting": charge.get("setting", ""),
                        "payers": [
                            {
                                "payer_name": p.get("payer_name", ""),
                                "plan_name": p.get("plan_name", ""),
                                "charge": p.get("standard_charge_dollar")
                            }
                            for p in charge.get("payers_information", [])
                        ]
                    }

    with open(cache_path, "w") as f:
        json.dump(lookup, f)
    print("  ✅ Cache saved to hospital_lookup_cache.json")

    return lookup


# ── CPT mapping via Groq ──────────────────────────────────────────────────────

def map_to_cpt(procedure_name: str, cms_lookup: dict) -> tuple[str, str] | None:
    """
    Use Groq to map a procedure name to a CPT code.
    Returns (cpt_code, description) or None.
    """
    # Give Groq a sample of known codes to anchor its response
    sample_codes = list(cms_lookup.items())[:50]
    sample_text = "\n".join(
        f"{code}: {info['description']}"
        for code, info in sample_codes
        if info['description']
    )

    prompt = f"""You are a medical coding expert.
Map this procedure to the most accurate CPT code from the Medicare Physician Fee Schedule.

Procedure: "{procedure_name}"

Here are some example codes for reference:
{sample_text}

Return ONLY a JSON object with this exact format:
{{"cpt_code": "XXXXX", "reasoning": "brief explanation"}}

The CPT code must be exactly 5 characters. Return only the JSON, nothing else."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        response_format={"type": "json_object"},
        max_tokens=100,
    )

    data = json.loads(response.choices[0].message.content.strip())
    cpt = str(data.get("cpt_code", "")).strip().zfill(5)

    if cpt in cms_lookup:
        return cpt, cms_lookup[cpt]["description"]

    return None


# ── Main entry point ──────────────────────────────────────────────────────────

def run_agent2() -> dict:
    """
    Main entry point.
    Reads patient_state.json, calculates surgery cost, saves surgery_result.json.
    """
    state_path = DATA_DIR / "patient_state.json"
    if not state_path.exists():
        raise FileNotFoundError("patient_state.json not found. Run analyser first.")

    with open(state_path) as f:
        state = json.load(f)

    surgery = state.get("data", {}).get("surgery_treatment", {})

    if not surgery.get("name"):
        print("  ⚠️  No surgery found in patient state. Skipping Agent 2.")
        result = {"status": "skipped", "reason": "no surgery in patient state"}
        with open(DATA_DIR / "surgery_result.json", "w") as f:
            json.dump(result, f, indent=2)
        return result

    procedure_name = surgery["name"]
    hospital_name = surgery.get("where", "Unknown hospital")

    print(f"\n🏥 Agent 2 — Surgery Cost Estimator")
    print(f"   Procedure: {procedure_name}")
    print(f"   Hospital:  {hospital_name}\n")

    # Load lookups
    print("  📂 Loading CMS fee schedule...")
    cms_lookup = load_cms_lookup()

    print("  📂 Loading hospital price data...")
    hospital_lookup = load_hospital_lookup()

    # Map procedure to CPT
    print(f"  🔍 Mapping '{procedure_name}' to CPT code...")
    cpt_result = map_to_cpt(procedure_name, cms_lookup)

    if not cpt_result:
        print("  ❌ Could not map procedure to CPT code.")
        result = {
            "status": "failed",
            "reason": f"Could not map '{procedure_name}' to a CPT code"
        }
        with open(DATA_DIR / "surgery_result.json", "w") as f:
            json.dump(result, f, indent=2)
        return result

    cpt_code, cpt_description = cpt_result
    print(f"  ✅ Mapped to CPT {cpt_code}: {cpt_description}")

    # Get surgeon fee from CMS
    cms_entry = cms_lookup.get(cpt_code)
    surgeon_fee = cms_entry["surgeon_fee"] if cms_entry else None

    # Get facility fee from hospital file
    hospital_entry = hospital_lookup.get(cpt_code)

    if hospital_entry:
        facility_min = hospital_entry["minimum"]
        facility_max = hospital_entry["maximum"]
        facility_source = f"{hospital_name} price transparency file (Nov 2025)"
        print(f"  ✅ Hospital fee found: ${facility_min:,.2f} – ${facility_max:,.2f}")
    else:
        # CPT not in hospital file — flag it
        facility_min = None
        facility_max = None
        facility_source = "Not found in hospital price file"
        print(f"  ⚠️  CPT {cpt_code} not found in hospital price file")

    # Build composite result
    total_min = None
    total_max = None

    if surgeon_fee and facility_min and facility_max:
        total_min = round(surgeon_fee + facility_min, 2)
        total_max = round(surgeon_fee + facility_max, 2)

    result = {
        "status": "complete" if total_min else "partial",
        "procedure": procedure_name,
        "cpt_code": cpt_code,
        "cpt_description": cpt_description,
        "hospital": hospital_name,
        "surgeon_fee": {
            "amount": surgeon_fee,
            "source": "CMS Physician Fee Schedule 2026 (Medicare benchmark)"
        },
        "facility_fee": {
            "minimum": facility_min,
            "maximum": facility_max,
            "source": facility_source
        },
        "total": {
            "minimum": total_min,
            "maximum": total_max
        },
        "note": "Gross cost before insurance. Out-of-pocket depends on your plan and deductible."
    }

    out_path = DATA_DIR / "surgery_result.json"
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\n✅ Agent 2 complete")
    if total_min:
        print(f"   Total estimate: ${total_min:,.2f} – ${total_max:,.2f}")
    print(f"💾 Saved to data/surgery_result.json\n")

    return result


# ── CLI runner ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not os.environ.get("GROQ_API_KEY"):
        raise ValueError("Set GROQ_API_KEY in .env before running.")
    run_agent2()
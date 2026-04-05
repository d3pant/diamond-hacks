"""
Run: python test_analyser.py
Optional PDF test: python test_analyser.py path/to/doc.pdf
"""
import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.analyser import analyse

# ── Test 1: full happy path ──────────────────────────────────────────────────
print("=" * 60)
print("TEST 1: Full doctor note — text input")
print("=" * 60)

MOCK_NOTE = """
Patient: James Mercer
Date: April 3, 2026
Diagnosis: Severe osteoarthritis, left knee

Prescription:
- Meloxicam 15mg, 30 tablets, once daily
- Omeprazole 20mg, 30 tablets, once daily
- Tramadol 50mg, 20 tablets, as needed for pain

Treatment Plan:
Total knee arthroplasty (left knee) scheduled at
Cedars-Sinai Medical Center, 8700 Beverly Blvd,
Los Angeles CA 90048 on April 20, 2026 at 7:30 AM

Follow-up consultation: April 27, 2026, Cedars-Sinai
Physical therapy to begin: May 1, 2026

Signed: Dr. Sarah Patel MD
"""

try:
    result = analyse([], extra_text=MOCK_NOTE)
    print(json.dumps(result, indent=2))
    assert result.get("diagnosis"), "FAIL: diagnosis missing"
    assert len(result.get("medicines", [])) == 3, f"FAIL: expected 3 meds, got {len(result.get('medicines', []))}"
    assert result["surgery_treatment"]["name"], "FAIL: surgery name missing"
    assert result["surgery_treatment"]["when"], "FAIL: surgery when missing"
    assert result["surgery_treatment"]["address"], "FAIL: surgery address missing"
    assert len(result.get("followups", [])) >= 1, "FAIL: no followups"
    print("\n✓ TEST 1 PASSED")
except Exception as e:
    print(f"\n✗ TEST 1 FAILED: {e}")


# ── Test 2: no surgery edge case ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("TEST 2: No surgery, no followups")
print("=" * 60)

MINIMAL = """
Patient has hypertension.
Prescribed: Lisinopril 10mg, 30 tablets, once daily.
No surgical intervention required.
"""

try:
    result2 = analyse([], extra_text=MINIMAL)
    print(json.dumps(result2, indent=2))
    assert result2.get("diagnosis"), "FAIL: diagnosis missing"
    assert len(result2.get("medicines", [])) >= 1, "FAIL: no medicines"
    assert result2["surgery_treatment"]["name"] is None, "FAIL: surgery name should be null"
    print("\n✓ TEST 2 PASSED")
except Exception as e:
    print(f"\n✗ TEST 2 FAILED: {e}")


# ── Test 3: real PDF ──────────────────────────────────────────────────────────
if len(sys.argv) > 1:
    pdf_path = sys.argv[1]
    print("\n" + "=" * 60)
    print(f"TEST 3: Real PDF — {pdf_path}")
    print("=" * 60)
    try:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
        result3 = analyse([pdf_bytes])
        print(json.dumps(result3, indent=2))
        print("\n✓ TEST 3 PASSED")
    except Exception as e:
        print(f"\n✗ TEST 3 FAILED: {e}")
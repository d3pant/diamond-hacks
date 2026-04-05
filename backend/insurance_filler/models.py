from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional


@dataclass
class ClaimantInfo:
    first_name: str = ""
    last_name: str = ""
    middle_initial: str = ""
    telephone: str = ""
    email: str = ""
    mailing_address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    business_name: str = ""
    inmate_or_patient_id: str = ""
    insured_name_subrogation: str = ""
    existing_claim_number: str = ""
    existing_claimant_name: str = ""
    under_18: Optional[bool] = None
    is_amendment: Optional[bool] = None


@dataclass
class RepresentativeInfo:
    first_name: str = ""
    last_name: str = ""
    middle_initial: str = ""
    telephone: str = ""
    email: str = ""
    mailing_address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""


@dataclass
class ClaimDetails:
    state_agencies_or_employees: str = ""
    date_of_incident: str = ""
    late_claim_explanation: str = ""
    civil_case_type: Optional[Literal["limited", "non_limited"]] = None
    dollar_amount_of_claim: str = ""
    dollar_amount_explanation: str = ""
    incident_location: str = ""
    damage_or_injury_description: str = ""
    circumstances: str = ""
    why_state_responsible: str = ""
    claim_filed_with_carrier: Optional[bool] = None
    received_insurance_payment: Optional[bool] = None
    amount_deductible: str = ""
    involves_state_vehicle: Optional[bool] = None
    vehicle_license: str = ""
    state_driver_name: str = ""
    insurance_carrier_name: str = ""
    insurance_claim_number: str = ""
    amount_received: str = ""
    printed_name: str = ""
    date_signed: str = ""
    # Visual signature only (drawn on the PDF). Not a cryptographic (PKI) signature.
    signature_text: str = ""
    signature_image_path: str = ""


@dataclass
class FillRequest:
    claimant: ClaimantInfo = field(default_factory=ClaimantInfo)
    representative: RepresentativeInfo = field(default_factory=RepresentativeInfo)
    claim: ClaimDetails = field(default_factory=ClaimDetails)

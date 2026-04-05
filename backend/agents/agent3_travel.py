"""
Agent 3 — Travel & Logistics
==============================
Reads origin from data/patient_profile.json
Reads destination + appointment from data/patient_state.json
Calculates route, timing, cost
Handles cab vs flight based on distance
Creates Google Calendar events
Saves to data/travel_result.json
"""

import os
import json
import asyncio
from pathlib import Path
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import googlemaps
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from browser_use_sdk.v3 import AsyncBrowserUse
from pydantic import BaseModel, Field

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
MAPS_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
CREDENTIALS_FILE = DATA_DIR / "credentials.json"
TOKEN_FILE = DATA_DIR / "token.json"
SCOPES = ["https://www.googleapis.com/auth/calendar"]

FLIGHT_THRESHOLD_MILES = 150
CAB_BASE = 5.0
CAB_PER_MILE = 2.50
SURGERY_BUFFER_MINS = 20
PREP_TIME_MINS = 60


# ── Pydantic schema for flight results ───────────────────────────────────────

class FlightOption(BaseModel):
    airline: str
    departure_time: str
    arrival_time: str
    duration: str
    price_str: str
    url: str


class FlightResults(BaseModel):
    origin_city: str
    destination_city: str
    date: str
    options: list[FlightOption] = Field(
        description="Top 3 cheapest flight options sorted by price"
    )


# ── Google Calendar auth ──────────────────────────────────────────────────────

def get_calendar_service():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CREDENTIALS_FILE), SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


# ── Geocoding ─────────────────────────────────────────────────────────────────

def geocode(gmaps, address: str) -> dict:
    result = gmaps.geocode(address)
    if not result:
        raise ValueError(f"Could not geocode address: {address}")
    location = result[0]["geometry"]["location"]
    return {
        "lat": location["lat"],
        "lng": location["lng"],
        "formatted": result[0]["formatted_address"]
    }


def city_for_flight_search(formatted: str, raw_address: str, facility_name: str) -> str:
    """
    Derive a city string for flight search. Raw addresses without commas (e.g. 'La Jolla')
    used to break destination_address.split(',')[-2].
    """
    text = (formatted or raw_address or "").strip()
    parts = [p.strip() for p in text.split(",") if p.strip()]
    if len(parts) >= 2:
        return parts[-2]
    if len(parts) == 1:
        return parts[0]
    return (facility_name or "Unknown").strip()


# ── Route calculation ─────────────────────────────────────────────────────────

def get_route(gmaps, origin: dict, destination: dict, departure_time: datetime) -> dict:
    """
    Traffic / duration_in_traffic requires departure_time to be now or in the future.
    Past appointments (common with demo data) use a plain matrix request without traffic.
    """
    now_utc = datetime.now(timezone.utc)
    apt = departure_time
    if apt.tzinfo is None:
        apt = apt.replace(tzinfo=timezone.utc)
    use_traffic = apt >= now_utc

    kwargs = dict(
        origins=[(origin["lat"], origin["lng"])],
        destinations=[(destination["lat"], destination["lng"])],
        mode="driving",
    )
    if use_traffic:
        kwargs["departure_time"] = departure_time
        kwargs["traffic_model"] = "best_guess"

    result = gmaps.distance_matrix(**kwargs)

    element = result["rows"][0]["elements"][0]
    if element["status"] != "OK":
        raise ValueError(f"Route calculation failed: {element['status']}")

    distance_meters = element["distance"]["value"]
    duration_data = element.get("duration_in_traffic") or element.get("duration")
    duration_seconds = duration_data["value"]

    return {
        "distance_miles": round(distance_meters / 1609.34, 1),
        "distance_meters": distance_meters,
        "duration_minutes": round(duration_seconds / 60),
        "duration_seconds": duration_seconds,
        "distance_text": element["distance"]["text"],
        "duration_text": duration_data["text"],
    }


# ── Static map image ──────────────────────────────────────────────────────────

def get_map_url(origin: dict, destination: dict, mode: str = "driving") -> str:
    if mode == "cab":
        return (
            f"https://maps.googleapis.com/maps/api/staticmap"
            f"?size=640x400"
            f"&markers=color:green%7C{origin['lat']},{origin['lng']}"
            f"&markers=color:red%7C{destination['lat']},{destination['lng']}"
            f"&key={MAPS_KEY}"
        )
    else:
        return (
            f"https://maps.googleapis.com/maps/api/staticmap"
            f"?size=640x400"
            f"&markers=color:green%7Clabel:O%7C{origin['lat']},{origin['lng']}"
            f"&markers=color:red%7Clabel:D%7C{destination['lat']},{destination['lng']}"
            f"&key={MAPS_KEY}"
        )


# ── Cab cost estimate ─────────────────────────────────────────────────────────

def estimate_cab_cost(distance_miles: float) -> dict:
    low = round(CAB_BASE + (distance_miles * CAB_PER_MILE * 0.9), 2)
    high = round(CAB_BASE + (distance_miles * CAB_PER_MILE * 1.3), 2)
    return {
        "low": low,
        "high": high,
        "estimate_str": f"${low} – ${high}"
    }


# ── Timing calculator ─────────────────────────────────────────────────────────

def calculate_timeline(
    appointment: datetime,
    travel_minutes: int,
    buffer_mins: int = SURGERY_BUFFER_MINS,
    prep_mins: int = PREP_TIME_MINS,
) -> dict:
    required_arrival = appointment - timedelta(minutes=buffer_mins)
    cab_pickup = required_arrival - timedelta(minutes=travel_minutes + 5)
    wake_up = cab_pickup - timedelta(minutes=prep_mins)

    return {
        "wake_up": wake_up.isoformat(),
        "cab_pickup": cab_pickup.isoformat(),
        "required_arrival": required_arrival.isoformat(),
        "appointment": appointment.isoformat(),
        "wake_up_str": wake_up.strftime("%I:%M %p"),
        "cab_pickup_str": cab_pickup.strftime("%I:%M %p"),
        "required_arrival_str": required_arrival.strftime("%I:%M %p"),
        "appointment_str": appointment.strftime("%I:%M %p"),
    }


# ── Flight search via browser-use + Composio ─────────────────────────────────

async def search_flights(
    origin_city: str,
    destination_city: str,
    date: str,
) -> FlightResults | None:
    try:
        client = AsyncBrowserUse(api_key=os.environ["BROWSER_USE_API_KEY"])
        date_formatted = datetime.fromisoformat(date).strftime("%Y-%m-%d")

        task = f"""
Use the Composio flight search tool to find flights.
Search for one-way flights from {origin_city} to {destination_city} on {date_formatted}.

Input the following:
- Origin: {origin_city}
- Destination: {destination_city}  
- Date: {date_formatted}
- Trip type: one-way
- Class: economy

Use Composio's search plugin to execute this flight search and return the results.
Extract the 3 cheapest options from the results.
For each return:
- airline: string
- departure_time: string
- arrival_time: string
- duration: string
- price_str: string (e.g. "$189")
- url: string

Stop immediately after extracting results.
"""


        result = await client.run(
            task,
            output_schema=FlightResults,
            max_steps=6
        )
        return result.output

    except Exception as e:
        print(f"  ❌ Flight search failed — {e}")
        return None


# ── Calendar event creation ───────────────────────────────────────────────────

def create_calendar_events(
    service,
    timeline: dict,
    procedure: str,
    facility: str,
    facility_address: str,
    cab_cost: dict,
    airport_to_venue_cost: dict,
    mode: str,
    flight_option=None,
) -> list[str]:
    created = []

    def make_event(title, dt_str, description, location=None, duration_mins=30):
        dt = datetime.fromisoformat(dt_str)
        end = dt + timedelta(minutes=duration_mins)
        event = {
            "summary": title,
            "description": description,
            "start": {"dateTime": dt.isoformat(), "timeZone": "America/Los_Angeles"},
            "end": {"dateTime": end.isoformat(), "timeZone": "America/Los_Angeles"},
            "reminders": {
                "useDefault": False,
                "overrides": [{"method": "popup", "minutes": 10}]
            }
        }
        if location:
            event["location"] = location
        return event

    # Wake up alarm
    wake_event = make_event(
        title="⏰ Wake up — surgery day",
        dt_str=timeline["wake_up"],
        description=f"Surgery today: {procedure} at {facility}\nPickup at {timeline['cab_pickup_str']}",
        duration_mins=5
    )
    r = service.events().insert(calendarId="primary", body=wake_event).execute()
    created.append(r["id"])
    print(f"  ✅ Calendar: wake up at {timeline['wake_up_str']}")

    if mode == "flight":
        # Cab 1: Home → Airport
        home_to_airport = make_event(
            title="🚕 Cab — Home to Airport",
            dt_str=timeline["cab_pickup"],
            description=(
                f"Head to airport for flight to {facility}\n"
                f"Estimated cost: {cab_cost['estimate_str']}"
            ),
            duration_mins=30
        )
        r = service.events().insert(calendarId="primary", body=home_to_airport).execute()
        created.append(r["id"])
        print(f"  ✅ Calendar: home→airport cab at {timeline['cab_pickup_str']}")

        # Flight event
        if flight_option:
            try:
                flight_dep = datetime.fromisoformat(flight_option.departure_time)
                flight_arr = datetime.fromisoformat(flight_option.arrival_time)
                flight_duration_mins = int((flight_arr - flight_dep).total_seconds() / 60)
                flight_event = make_event(
                    title=f"✈️ Flight — {flight_option.airline}",
                    dt_str=flight_dep.isoformat(),
                    description=(
                        f"Flight to {facility}\n"
                        f"Airline: {flight_option.airline}\n"
                        f"Departure: {flight_dep.strftime('%I:%M %p')}\n"
                        f"Arrival: {flight_arr.strftime('%I:%M %p')}\n"
                        f"Duration: {flight_option.duration}\n"
                        f"Price: {flight_option.price_str}"
                    ),
                    duration_mins=flight_duration_mins,
                )
                r = service.events().insert(calendarId="primary", body=flight_event).execute()
                created.append(r["id"])
                print(f"  ✅ Calendar: flight {flight_dep.strftime('%I:%M %p')} → {flight_arr.strftime('%I:%M %p')}")
            except Exception as e:
                print(f"  ⚠️  Could not create flight event — {e}")
        else:
            # Fallback: block off assumed 6h flight window after cab pickup + 2h airport time
            flight_start = datetime.fromisoformat(timeline["cab_pickup"]) + timedelta(hours=2, minutes=30)
            flight_event = make_event(
                title=f"✈️ Flight to {facility}",
                dt_str=flight_start.isoformat(),
                description=f"Flight to {facility} for {procedure}",
                duration_mins=360,
            )
            r = service.events().insert(calendarId="primary", body=flight_event).execute()
            created.append(r["id"])
            print(f"  ✅ Calendar: flight block at {flight_start.strftime('%I:%M %p')}")

        # Cab 2: Airport → Venue (1 hour before required arrival)
        airport_arrival_dt = (
            datetime.fromisoformat(timeline["required_arrival"]) - timedelta(hours=1)
        )
        airport_to_venue = make_event(
            title=f"🚕 Cab — Airport to {facility}",
            dt_str=airport_arrival_dt.isoformat(),
            description=(
                f"Cab from arrival airport to {facility_address}\n"
                f"Estimated cost: {airport_to_venue_cost['estimate_str']}"
            ),
            location=facility_address,
            duration_mins=30
        )
        r = service.events().insert(calendarId="primary", body=airport_to_venue).execute()
        created.append(r["id"])
        print(f"  ✅ Calendar: airport→venue cab at {airport_arrival_dt.strftime('%I:%M %p')}")

    else:
        # Single cab: Home → Venue
        transport_event = make_event(
            title=f"🚕 Cab pickup — {facility}",
            dt_str=timeline["cab_pickup"],
            description=(
                f"Estimated cost: {cab_cost['estimate_str']}\n"
                f"Destination: {facility_address}"
            ),
            duration_mins=5
        )
        r = service.events().insert(calendarId="primary", body=transport_event).execute()
        created.append(r["id"])
        print(f"  ✅ Calendar: cab pickup at {timeline['cab_pickup_str']}")

    # Surgery appointment
    surgery_event = make_event(
        title=f"🏥 {procedure}",
        dt_str=timeline["appointment"],
        description=(
            f"Facility: {facility}\n"
            f"Address: {facility_address}\n"
            f"Arrive by: {timeline['required_arrival_str']}\n\n"
            f"What to bring:\n"
            f"- Photo ID\n"
            f"- Insurance card\n"
            f"- List of current medications\n"
            f"- Comfortable loose clothing\n"
            f"- Someone to drive you home (or return cab booked)"
        ),
        location=facility_address,
        duration_mins=180
    )
    r = service.events().insert(calendarId="primary", body=surgery_event).execute()
    created.append(r["id"])
    print(f"  ✅ Calendar: surgery at {timeline['appointment_str']}")

    return created


# ── Main entry point ──────────────────────────────────────────────────────────

async def run_agent3() -> dict:
    profile_path = DATA_DIR / "patient_profile.json"
    state_path = DATA_DIR / "patient_state.json"

    if not profile_path.exists():
        print("⚠️  Agent 3 skipped — patient_profile.json not found (patient has not submitted their profile yet).", flush=True)
        return {}
    if not state_path.exists():
        raise FileNotFoundError("patient_state.json not found.")

    with open(profile_path) as f:
        profile = json.load(f)
    with open(state_path) as f:
        state = json.load(f)

    surgery = (
        state.get("data", {}).get("surgery_treatment")
        or state.get("surgery_treatment", {})
    )
    origin_address = profile["personal"]["address"]
    destination_address = surgery.get("address")
    appointment_str = surgery.get("when")
    procedure = surgery.get("name", "Medical procedure")
    hospital = surgery.get("where", "Hospital")

    if not destination_address:
        raise ValueError("No facility address in patient_state.json")
    if not appointment_str:
        raise ValueError("No appointment time in patient_state.json")

    appointment = datetime.fromisoformat(appointment_str)

    print(f"\n🗺️  Agent 3 — Travel & Logistics")
    print(f"   From: {origin_address}")
    print(f"   To:   {destination_address}")
    print(f"   When: {appointment.strftime('%B %d, %Y at %I:%M %p')}\n")

    # Geocode
    gmaps = googlemaps.Client(key=MAPS_KEY)
    print("  📍 Geocoding addresses...")
    origin_coords = geocode(gmaps, origin_address)
    destination_coords = geocode(gmaps, destination_address)
    print(f"  ✅ Origin:      {origin_coords['formatted']}")
    print(f"  ✅ Destination: {destination_coords['formatted']}")

    # Route
    print("\n  🛣️  Calculating route...")
    route = get_route(gmaps, origin_coords, destination_coords, appointment)
    distance_miles = route["distance_miles"]
    print(f"  ✅ Distance: {distance_miles} miles — {route['duration_text']}")

    # Mode decision
    mode = "flight" if distance_miles >= FLIGHT_THRESHOLD_MILES else "cab"
    print(f"\n  🚦 Mode: {'✈️  Flight recommended' if mode == 'flight' else '🚕 Cab'} ({distance_miles} miles)")

    flights = None
    airport_to_venue_cost = None

    if mode == "flight":
        print("\n  ✈️  Searching flights via browser-use + Composio...")
        origin_city = profile["personal"]["city"]
        destination_city = city_for_flight_search(
            destination_coords.get("formatted", ""),
            destination_address,
            hospital,
        )
        print(f"  📍 Flight search cities: {origin_city!r} → {destination_city!r}")
        flights = await search_flights(origin_city, destination_city, appointment_str)

        if flights and flights.options:
            print(f"  ✅ Found {len(flights.options)} flight options")
            duration_str = flights.options[0].duration
            hours = int(duration_str.split("h")[0].strip())
            mins = int(duration_str.split("h")[1].replace("m", "").strip())
            flight_minutes = hours * 60 + mins
        else:
            flight_minutes = 360  # fallback 6hr

        # Home → Airport (LAX ~15 miles from Santa Monica)
        airport_distance_miles = 15
        airport_drive_minutes = 30
        cab_cost = estimate_cab_cost(airport_distance_miles)

        # Airport → Venue at destination (~10 miles average from major airport)
        airport_to_venue_cost = estimate_cab_cost(10)

        # Total travel = home→airport + check-in + flight + arrival buffer
        travel_minutes = airport_drive_minutes + 120 + flight_minutes + 30

    else:
        travel_minutes = route["duration_minutes"]
        cab_cost = estimate_cab_cost(distance_miles)
        airport_to_venue_cost = {"low": 0, "high": 0, "estimate_str": "N/A"}

    print(f"\n  💰 Transport cost (home→airport): {cab_cost['estimate_str']}")

    # Timeline
    print("\n  ⏰ Calculating timeline...")
    timeline = calculate_timeline(appointment, travel_minutes)
    print(f"  Wake up:   {timeline['wake_up_str']}")
    print(f"  Pickup:    {timeline['cab_pickup_str']}")
    print(f"  Arrive by: {timeline['required_arrival_str']}")
    print(f"  Surgery:   {timeline['appointment_str']}")

    # Map URL
    map_url = get_map_url(origin_coords, destination_coords, mode)
    print(f"\n  🗺️  Map URL generated")

    # Calendar
    print("\n  📅 Creating calendar events...")
    try:
        calendar_service = get_calendar_service()
        event_ids = create_calendar_events(
            service=calendar_service,
            timeline=timeline,
            procedure=procedure,
            facility=hospital,
            facility_address=destination_address,
            cab_cost=cab_cost,
            airport_to_venue_cost=airport_to_venue_cost,
            mode=mode,
            flight_option=flights.options[0] if flights and flights.options else None,
        )
        calendar_created = True
    except Exception as e:
        print(f"  ⚠️  Calendar failed — {e}")
        event_ids = []
        calendar_created = False

    # Result
    result = {
        "status": "complete",
        "mode": mode,
        "origin": origin_address,
        "destination": destination_address,
        "distance_miles": distance_miles,
        "travel_time_minutes": travel_minutes,
        "travel_time_text": route["duration_text"],
        "timeline": timeline,
        "cab_cost": cab_cost,
        "airport_to_venue_cost": airport_to_venue_cost,
        "map_url": map_url,
        "flights": flights.model_dump() if flights else None,
        "calendar_events_created": calendar_created,
        "calendar_event_ids": event_ids,
        "note": (
            "Flight recommended — distance exceeds 150 miles. "
            "Cab costs: home→airport and airport→venue shown separately."
            if mode == "flight"
            else "Cab cost is an estimate. Actual price may vary by provider."
        )
    }

    out_path = DATA_DIR / "travel_result.json"
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\n✅ Agent 3 complete")
    print(f"💾 Saved to data/travel_result.json\n")

    return result


# ── CLI runner ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    asyncio.run(run_agent3())
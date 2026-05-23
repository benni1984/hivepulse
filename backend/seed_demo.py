"""
Demo data seeder for local HivePulse development.
Run from the backend/ directory with the server already running:

    python seed_demo.py

Creates one demo account plus 4 apiaries across Europe with hives and
realistic inspection histories.
"""

import sys
import requests
from datetime import date, timedelta
import random

BASE = "http://localhost:8000/api/v1"

DEMO_EMAIL    = "demo@HivePulse.dev"
DEMO_PASSWORD = "Demo1234!"
DEMO_NAME     = "Demo Beekeeper"

APIARIES = [
    {
        "name": "Riverside Meadows",
        "description": "Along the river bank, excellent clover and willow bloom.",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "address": "Bois de Boulogne, Paris, France",
        "hives": [
            {"name": "Hive Alpha",  "hive_type": "langstroth"},
            {"name": "Hive Beta",   "hive_type": "langstroth"},
            {"name": "Hive Gamma",  "hive_type": "dadant"},
        ],
    },
    {
        "name": "Mountain Orchard",
        "description": "High altitude apiary in fruit orchard, apple and cherry blossom.",
        "latitude": 47.3769,
        "longitude": 8.5417,
        "address": "Zürich Highlands, Switzerland",
        "hives": [
            {"name": "Hive 1",  "hive_type": "dadant"},
            {"name": "Hive 2",  "hive_type": "warre"},
        ],
    },
    {
        "name": "Forest Edge",
        "description": "Sheltered by pine forest, lime tree honey.",
        "latitude": 52.5200,
        "longitude": 13.4050,
        "address": "Grunewald, Berlin, Germany",
        "hives": [
            {"name": "North Hive", "hive_type": "langstroth"},
            {"name": "South Hive", "hive_type": "top_bar"},
            {"name": "West Hive",  "hive_type": "langstroth"},
            {"name": "East Hive",  "hive_type": "langstroth"},
        ],
    },
    {
        "name": "Coastal Garden",
        "description": "Salt-air microclimate, lavender and rosemary.",
        "latitude": 43.2965,
        "longitude": 5.3698,
        "address": "Parc Borély, Marseille, France",
        "hives": [
            {"name": "Lavender",  "hive_type": "langstroth"},
            {"name": "Rosemary",  "hive_type": "dadant"},
        ],
    },
]

MOODS   = ["calm", "calm", "calm", "nervous", "aggressive"]
COLORS  = ["white", "yellow", "red", "green", "blue", None]


def post(path, token=None, **kwargs):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    r = requests.post(f"{BASE}{path}", headers=headers, **kwargs)
    if r.status_code not in (200, 201):
        print(f"  ERROR {r.status_code} {path}: {r.text[:200]}")
        sys.exit(1)
    return r.json()


def get(path, token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    r = requests.get(f"{BASE}{path}", headers=headers)
    if r.status_code != 200:
        print(f"  ERROR {r.status_code} {path}: {r.text[:200]}")
        sys.exit(1)
    return r.json()


def seed_inspections(hive_id: str, token: str, count: int):
    today = date.today()
    for i in range(count, 0, -1):
        d = today - timedelta(days=i * 14 + random.randint(-3, 3))
        post(f"/hives/{hive_id}/inspections", token, json={
            "date": str(d),
            "queen_seen": random.random() > 0.3,
            "queen_color": random.choice(COLORS),
            "brood_frames": random.randint(3, 8),
            "honey_frames": random.randint(1, 5),
            "mood": random.choice(MOODS),
            "population_strength": random.randint(1, 5),
            "varroa_count": random.randint(0, 8),
            "swarm_cells_seen": random.random() < 0.1,
            "feeding_done": random.random() < 0.25,
            "weight_kg": round(random.uniform(18, 45), 1),
            "notes": random.choice([
                "Colonies looking strong.",
                "Added super.",
                "Treated with oxalic acid.",
                "Found new queen cells — split planned.",
                "",
                "",
            ]),
        })


def main():
    print("Checking server...")
    try:
        requests.get(f"{BASE}/public/stats", timeout=3)
    except Exception:
        print("Backend not reachable at http://localhost:8000 — start it first:")
        print("  uvicorn main:app --reload")
        sys.exit(1)

    print(f"Registering demo account ({DEMO_EMAIL})...")
    r = requests.post(f"{BASE}/auth/register", json={
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "name": DEMO_NAME,
    })
    if r.status_code in (200, 201):
        tokens = r.json()
        print("  Account created.")
    elif r.status_code in (400, 409, 422) and "already" in r.text.lower() or r.status_code == 400:
        print("  Account exists — logging in...")
        tokens = post("/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    else:
        # Try login anyway (email already registered returns 400 in some validators)
        login_r = requests.post(f"{BASE}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        if login_r.status_code == 200:
            tokens = login_r.json()
            print("  Logged in to existing account.")
        else:
            print(f"  ERROR registering ({r.status_code}): {r.text[:200]}")
            sys.exit(1)

    access = tokens["access_token"]

    # Check if seed is already complete (all 4 apiaries present)
    existing = requests.get(f"{BASE}/apiaries", headers={"Authorization": f"Bearer {access}"})
    if existing.status_code == 200 and existing.json().get("total", 0) >= len(APIARIES):
        print(f"  Already fully seeded ({existing.json()['total']} apiaries). Nothing to do.")
        print("  Delete HivePulse.db and restart the server to reseed from scratch.")
        sys.exit(0)
    print("  OK")

    total_hives = sum(len(a["hives"]) for a in APIARIES)
    print(f"Creating {len(APIARIES)} apiaries with {total_hives} hives...")

    for apiary_cfg in APIARIES:
        hive_cfgs = apiary_cfg.pop("hives")
        apiary = post("/apiaries", access, json=apiary_cfg)
        apiary_cfg["hives"] = hive_cfgs
        print(f"  Apiary: {apiary_cfg['name']}")

        batch = post("/qr-batches", access, json={"count": len(hive_cfgs)})
        tokens_list = batch["tokens"]

        for idx, hive_cfg in enumerate(hive_cfgs):
            qr_token = tokens_list[idx]["token"]
            hive = post("/hives/initialize", access, json={
                "qr_token": qr_token,
                "apiary_id": apiary["id"],
                "name": hive_cfg["name"],
                "hive_type": hive_cfg["hive_type"],
                "acquisition_date": str(date.today() - timedelta(days=random.randint(365, 1095))),
            })
            n_inspections = random.randint(6, 12)
            seed_inspections(hive["id"], access, n_inspections)
            print(f"    {hive_cfg['name']} ({hive_cfg['hive_type']}) — {n_inspections} inspections")

    stats = get("/public/stats")
    print()
    print("Done!")
    print(f"  Apiaries:    {stats['apiary_count']}")
    print(f"  Hives:       {stats['hive_count']}")
    print(f"  Inspections: {stats['inspection_count']}")
    print()
    print(f"  Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    print(f"  Web:   http://localhost:3000  (run: python -m http.server 3000  from web/)")


if __name__ == "__main__":
    random.seed(42)
    main()

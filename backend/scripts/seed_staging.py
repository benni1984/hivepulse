#!/usr/bin/env python3
"""
Idempotent staging seed script.

Run from the backend directory:
    python -m scripts.seed_staging

Requires DATABASE_URL pointing at the staging (Neon) database.
"""

import os
import sys
import uuid
import random
import secrets
from datetime import datetime, date, timedelta

# Make sure app modules are importable when run as a module
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models import (
    Base, User, Apiary, Hive, Inspection, QrBatch, QrToken,
    HornetCatch, HornetNest, HornetSighting, HornetTrap, HornetTrapCatch,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set.", file=sys.stderr)
    sys.exit(1)

engine = create_engine(DATABASE_URL)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uuid():
    return str(uuid.uuid4())

def _hash(pw: str) -> str:
    return pwd_context.hash(pw)

def _trap_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()

def _ago(days: int) -> datetime:
    return datetime.utcnow() - timedelta(days=days)

def _date_ago(days: int) -> date:
    return (datetime.utcnow() - timedelta(days=days)).date()

HIVE_TYPES = ["dadant", "langstroth", "other"]
QUEEN_COLORS = ["white", "yellow", "red", "green", "blue"]
MOODS = ["calm", "nervous", "aggressive"]

# Central European coordinates spread across DE / AT / CH
LOCATIONS = [
    (48.1351, 11.5820, "Munich"),
    (47.3769, 8.5417, "Zurich"),
    (48.2082, 16.3738, "Vienna"),
    (50.9333, 6.9500, "Cologne"),
    (53.5500, 10.0000, "Hamburg"),
    (48.7758, 9.1829, "Stuttgart"),
    (47.8095, 13.0550, "Salzburg"),
    (51.3397, 12.3731, "Leipzig"),
    (47.6779, 11.8609, "Bayrischzell"),
    (47.0707, 15.4395, "Graz"),
]

# ---------------------------------------------------------------------------
# Upsert helpers
# ---------------------------------------------------------------------------

def upsert_user(db: Session, email: str, name: str, password: str,
                is_admin: bool = False, is_supporter: bool = False) -> User:
    user = db.query(User).filter_by(email=email).first()
    if user is None:
        user = User(
            id=_uuid(), email=email, name=name,
            hashed_password=_hash(password),
            is_admin=is_admin, is_supporter=is_supporter,
        )
        db.add(user)
        print(f"  created user {email}")
    else:
        user.name = name
        user.is_admin = is_admin
        user.is_supporter = is_supporter
        print(f"  updated user {email}")
    db.flush()
    return user


def ensure_apiary(db: Session, user: User, name: str, lat: float, lon: float,
                  city: str, is_public: bool = True) -> Apiary:
    apiary = db.query(Apiary).filter_by(user_id=user.id, name=name).first()
    if apiary is None:
        apiary = Apiary(
            id=_uuid(), user_id=user.id, name=name,
            latitude=lat, longitude=lon, city_name=city,
            is_public=is_public,
            created_at=_ago(random.randint(120, 365)),
        )
        db.add(apiary)
        print(f"    created apiary '{name}'")
    return apiary


def ensure_hive(db: Session, apiary: Apiary, user: User, name: str, hive_type: str) -> Hive:
    hive = db.query(Hive).filter_by(apiary_id=apiary.id, name=name).first()
    if hive is None:
        batch = QrBatch(id=_uuid(), user_id=user.id, count=1)
        db.add(batch)
        db.flush()
        token = secrets.token_hex(8)
        qr = QrToken(token=token, batch_id=batch.id, user_id=user.id)
        db.add(qr)
        db.flush()
        hive = Hive(
            id=_uuid(), apiary_id=apiary.id, user_id=user.id, name=name,
            qr_token=token,
            hive_type=hive_type,
            created_at=_ago(random.randint(60, 180)),
        )
        db.add(hive)
        print(f"      created hive '{name}'")
    return hive


def seed_inspections(db: Session, hive: Hive, count: int = 5):
    existing = db.query(Inspection).filter_by(hive_id=hive.id).count()
    if existing >= count:
        return
    for i in range(count - existing):
        days_ago = random.randint(5 + i * 12, 15 + i * 14)
        insp = Inspection(
            id=_uuid(), hive_id=hive.id,
            date=_date_ago(days_ago),
            queen_seen=random.choice([True, False]),
            queen_color=random.choice(QUEEN_COLORS + [None, None]),
            brood_frames=random.randint(2, 8),
            honey_frames=random.randint(0, 6),
            varroa_count=random.randint(0, 12),
            mood=random.choice(MOODS),
            notes=random.choice([
                "Volk in guter Verfassung", "Weisel vorhanden",
                "Futterreserven prüfen", "Ableger gebildet",
                None, None, None,
            ]),
            created_at=_ago(days_ago),
        )
        db.add(insp)


# ---------------------------------------------------------------------------
# Hornet tracker seed (always recreated for clean state)
# ---------------------------------------------------------------------------

# NOTE: these are hotlinked Wikimedia Commons thumbnails, verified reachable
# as of this edit. Wikimedia occasionally renames/deletes files or changes
# its thumbnail-serving rules (this exact list broke once already — the
# previous three files were deleted from Commons, which made every seeded
# sighting photo return HTTP 400), so if sighting photos go blank again in
# the future, re-verify these three URLs first before assuming a code bug.
SIGHTING_PHOTOS = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Vespa_velutina_nigrithorax_MHNT_dos.jpg/960px-Vespa_velutina_nigrithorax_MHNT_dos.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Asian_hornet_%28Vespa_velutina%29.jpg/960px-Asian_hornet_%28Vespa_velutina%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Asian_hornet_%2833283876513%29_%282%29.jpg/960px-Asian_hornet_%2833283876513%29_%282%29.jpg",
]

def seed_hornet_tracker(db: Session):
    print("\n  Clearing hornet tracker data …")
    db.query(HornetTrapCatch).delete()
    db.query(HornetTrap).delete()
    db.query(HornetSighting).delete()
    db.query(HornetNest).delete()
    db.query(HornetCatch).delete()
    db.flush()

    # --- Catches ---
    catch_locs = LOCATIONS[:8]
    for i, (lat, lon, city) in enumerate(catch_locs):
        jitter = lambda: random.uniform(-0.05, 0.05)
        db.add(HornetCatch(
            id=_uuid(),
            latitude=lat + jitter(),
            longitude=lon + jitter(),
            count=random.randint(1, 15),
            reporter_name=random.choice(["Klaus B.", "Marie L.", "Hans W.", None, None]),
            created_at=_ago(random.randint(1, 60)),
        ))
    print(f"    created {len(catch_locs)} catches")

    # --- Nests ---
    nest_data = [
        (48.15, 11.60, "found", "Nest in Birke, ca. 4 m Höhe"),
        (47.38, 8.55, "destruction_ordered", "Unterm Dachvorsprung"),
        (48.21, 16.38, "destroyed", "Vernichtet durch Feuerwehr"),
        (50.94, 6.96, "found", None),
        (53.56, 10.01, "destruction_ordered", "Im Schrebergarten"),
    ]
    for lat, lon, status, notes in nest_data:
        db.add(HornetNest(
            id=_uuid(), latitude=lat, longitude=lon,
            status=status, notes=notes,
            created_at=_ago(random.randint(5, 90)),
        ))
    print(f"    created {len(nest_data)} nests")

    # --- Sightings ---
    sightings_data = [
        ("pending",   2, 0, SIGHTING_PHOTOS[0]),
        ("pending",   1, 1, SIGHTING_PHOTOS[1]),
        ("confirmed", 8, 1, SIGHTING_PHOTOS[0]),
        ("confirmed", 5, 0, SIGHTING_PHOTOS[2]),
        ("rejected",  0, 4, SIGHTING_PHOTOS[1]),
        ("confirmed", 3, 0, SIGHTING_PHOTOS[0]),
        ("pending",   0, 0, SIGHTING_PHOTOS[2]),
    ]
    for status, yes_v, no_v, photo in sightings_data:
        lat, lon, city = random.choice(LOCATIONS)
        db.add(HornetSighting(
            id=_uuid(),
            latitude=lat + random.uniform(-0.02, 0.02),
            longitude=lon + random.uniform(-0.02, 0.02),
            photo_url=photo,
            status=status,
            yes_votes=yes_v,
            no_votes=no_v,
            reporter_name=random.choice(["Anna K.", "Peter S.", None]),
            created_at=_ago(random.randint(1, 30)),
        ))
    print(f"    created {len(sightings_data)} sightings")

    # --- Traps ---
    trap_data = [
        (48.14, 11.59, "Garten Nord", "Flaschenumleimfalle"),
        (47.37, 8.54, "Obstgarten Süd", None),
        (48.22, 16.39, "Weinberg Ost", "Zuckerwasser"),
        (50.93, 6.95, "Schrebergarten", None),
        (53.55, 10.00, "Balkon 3.OG", "Anis-Lockstoff"),
    ]
    for lat, lon, name, notes in trap_data:
        code = _trap_code()
        trap = HornetTrap(
            id=_uuid(), access_code=code,
            name=name, latitude=lat, longitude=lon,
            notes=notes, owner_name=random.choice(["Demo User", None]),
            created_at=_ago(random.randint(10, 60)),
        )
        db.add(trap)
        db.flush()
        # 3–8 daily catches per trap
        caught_dates = set()
        for _ in range(random.randint(3, 8)):
            d = _date_ago(random.randint(1, 30))
            if d not in caught_dates:
                caught_dates.add(d)
                db.add(HornetTrapCatch(
                    id=_uuid(), trap_id=trap.id,
                    count=random.randint(1, 10),
                    caught_on=d,
                    created_at=_ago(random.randint(1, 30)),
                ))
    print(f"    created {len(trap_data)} traps with catches")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== HivePulse Staging Seed ===\n")

    with Session(engine) as db:
        # --- Demo user ---
        print("Users:")
        demo = upsert_user(db, "demo@apiscan.app", "Demo Beekeeper", "demo1234",
                           is_supporter=True)

        # --- Admin user ---
        admin = upsert_user(db, "admin@apiscan.app", "Admin User", "admin1234",
                            is_admin=True, is_supporter=True)

        # --- Demo apiaries ---
        print("\nDemo apiaries:")
        for apiary_name, (lat, lon, city) in zip(
            ["Stadtimkerei München", "Alpenhof Salzburg"],
            LOCATIONS[:2],
        ):
            apiary = ensure_apiary(db, demo, apiary_name, lat, lon, city)
            for j in range(random.randint(3, 5)):
                hive = ensure_hive(db, apiary, demo, f"Volk {j + 1}", random.choice(HIVE_TYPES))
                seed_inspections(db, hive, count=random.randint(5, 8))

        # --- Admin apiaries ---
        print("\nAdmin apiaries:")
        for apiary_name, (lat, lon, city) in zip(
            ["Versuchsbienenstand Köln"],
            [LOCATIONS[3]],
        ):
            apiary = ensure_apiary(db, admin, apiary_name, lat, lon, city)
            for j in range(3):
                hive = ensure_hive(db, apiary, admin, f"Prüfvolk {j + 1}", random.choice(HIVE_TYPES))
                seed_inspections(db, hive, count=5)

        # --- Hornet tracker ---
        print("\nHornet tracker:")
        seed_hornet_tracker(db)

        db.commit()

    print("\n=== Seeding complete ===")
    print("  demo@apiscan.app  / demo1234  (supporter)")
    print("  admin@apiscan.app / admin1234 (admin + supporter)")


if __name__ == "__main__":
    main()

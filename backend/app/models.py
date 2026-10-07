import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean, CheckConstraint, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON, UniqueConstraint, Enum as SAEnum
)
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    # Absent for accounts that only ever signed in with Apple or Google.
    hashed_password = Column(String, nullable=True)
    # The provider's subject identifier. Stable for the same person and app, unlike the
    # address, which Apple will happily hide behind a relay.
    apple_sub = Column(String, nullable=True, unique=True, index=True)
    google_sub = Column(String, nullable=True, unique=True, index=True)
    # What Apple needs back when the account is deleted. The client ID is stored with it
    # because a token is bound to the app that obtained it: bundle ID on the iPhone, Services
    # ID in the browser. Never sent to a client.
    apple_refresh_token = Column(String, nullable=True)
    apple_token_client_id = Column(String, nullable=True)
    name = Column(String, nullable=False)
    locale = Column(SAEnum("en", "fr", "de", "es", name="locale_enum"), default="en")
    is_admin = Column(Boolean, default=False, nullable=False)
    is_supporter = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Inspection reminder preferences
    reminder_enabled = Column(Boolean, default=True, nullable=False)
    reminder_interval_days = Column(Integer, default=7, nullable=False)
    reminder_season_start = Column(Integer, default=4, nullable=False)  # April
    reminder_season_end = Column(Integer, default=8, nullable=False)    # August
    reminder_email_enabled = Column(Boolean, default=False, nullable=False)
    push_token_apns = Column(String, nullable=True)
    push_token_fcm = Column(String, nullable=True)

    @property
    def has_password(self) -> bool:
        """False for an account created through Apple or Google, which never had one."""
        return self.hashed_password is not None

    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    apiaries = relationship("Apiary", back_populates="user", cascade="all, delete-orphan")
    field_definitions = relationship("FieldDefinition", back_populates="user", cascade="all, delete-orphan")
    qr_batches = relationship("QrBatch", back_populates="user", cascade="all, delete-orphan")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         = Column(String, primary_key=True, default=_uuid)
    user_id    = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token      = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at    = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_tokens")


class RateLimitHit(Base):
    """One row per request against a rate-limited bucket (e.g. 'login:1.2.3.4').

    Backed by the database rather than in-process memory because the backend
    runs as stateless Vercel serverless functions — an in-memory counter would
    reset (or simply not be shared) between invocations and provide no real
    protection.
    """
    __tablename__ = "rate_limit_hits"

    id = Column(String, primary_key=True, default=_uuid)
    bucket_key = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class Apiary(Base):
    __tablename__ = "apiaries"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    city_name = Column(String, nullable=True)
    city_latitude = Column(Float, nullable=True)
    city_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="apiaries")
    hives = relationship("Hive", back_populates="apiary")
    field_definitions = relationship("FieldDefinition", back_populates="apiary", cascade="all, delete-orphan")


class FieldDefinition(Base):
    __tablename__ = "field_definitions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    apiary_id = Column(String, ForeignKey("apiaries.id"), nullable=True)
    scope = Column(SAEnum("user", "apiary", name="field_scope_enum"), nullable=False)
    target = Column(SAEnum("hive", "inspection", name="field_target_enum"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(SAEnum("text", "number", "boolean", "date", "select", name="field_type_enum"), nullable=False)
    options = Column(JSON, default=list)
    required = Column(Boolean, default=False)
    default_value = Column(JSON, nullable=True)
    sort_order = Column(Integer, default=0)

    user = relationship("User", back_populates="field_definitions")
    apiary = relationship("Apiary", back_populates="field_definitions")


class QrBatch(Base):
    __tablename__ = "qr_batches"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="qr_batches")
    tokens = relationship("QrToken", back_populates="batch", cascade="all, delete-orphan")


class QrToken(Base):
    __tablename__ = "qr_tokens"

    token = Column(String, primary_key=True, default=_uuid)
    batch_id = Column(String, ForeignKey("qr_batches.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    batch = relationship("QrBatch", back_populates="tokens")
    hive = relationship("Hive", back_populates="qr_token_rel", uselist=False)


class Hive(Base):
    __tablename__ = "hives"

    id = Column(String, primary_key=True, default=_uuid)
    qr_token = Column(String, ForeignKey("qr_tokens.token"), unique=True, nullable=False)
    apiary_id = Column(String, ForeignKey("apiaries.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    hive_type = Column(
        SAEnum("langstroth", "dadant", "top_bar", "warre", "other", name="hive_type_enum"),
        default="langstroth"
    )
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    acquisition_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    custom_fields = Column(JSON, default=dict)
    initialized_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    apiary = relationship("Apiary", back_populates="hives")
    qr_token_rel = relationship("QrToken", back_populates="hive")
    inspections = relationship("Inspection", back_populates="hive", cascade="all, delete-orphan")
    moves = relationship("HiveMove", back_populates="hive", cascade="all, delete-orphan")

    @property
    def last_inspection_at(self):
        if not self.inspections:
            return None
        return max(i.created_at for i in self.inspections)


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String, primary_key=True, default=_uuid)
    hive_id = Column(String, ForeignKey("hives.id"), nullable=False)
    date = Column(Date, nullable=False)
    queen_seen = Column(Boolean, nullable=True)
    queen_color = Column(
        SAEnum("white", "yellow", "red", "green", "blue", name="queen_color_enum"),
        nullable=True
    )
    brood_frames = Column(Integer, nullable=True)
    honey_frames = Column(Integer, nullable=True)
    mood = Column(SAEnum("calm", "nervous", "aggressive", name="mood_enum"), nullable=True)
    population_strength = Column(Integer, nullable=True)
    varroa_count = Column(Integer, nullable=True)   # legacy mite count, kept for history
    varroa_level = Column(Integer, nullable=True)   # 0 none, 1 low, 2 medium, 3 high
    swarm_cells_seen = Column(Boolean, nullable=True)
    treatment_applied = Column(String, nullable=True)
    feeding_done = Column(Boolean, nullable=True)
    feeding_type = Column(String, nullable=True)
    weight_kg = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    custom_fields = Column(JSON, default=dict)
    # Set by apps that record offline: the same value is reused for every retry, so a
    # second POST returns the stored inspection instead of creating a duplicate.
    client_id = Column(String(64), nullable=True, index=True)
    # Who recorded it, so two people on one hive can see who did what. Empty for records that
    # predate sharing, and when the author's account is gone.
    created_by_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hive = relationship("Hive", back_populates="inspections")
    created_by = relationship("User", foreign_keys=[created_by_id])

    @property
    def created_by_name(self):
        return self.created_by.name if self.created_by else None

    __table_args__ = (
        UniqueConstraint("hive_id", "client_id", name="uq_inspection_hive_client_id"),
    )


class HiveMove(Base):
    """One hive taken from one apiary to another, for a reason: the forage it was taken to.

    The names and coordinates of both ends are copied here when the move is made, so the history
    stays true when an apiary is renamed, shifted or deleted afterwards.
    """
    __tablename__ = "hive_moves"

    id = Column(String, primary_key=True, default=_uuid)
    hive_id = Column(String, ForeignKey("hives.id", ondelete="CASCADE"), nullable=False, index=True)
    from_apiary_id = Column(String, ForeignKey("apiaries.id", ondelete="SET NULL"), nullable=True)
    to_apiary_id = Column(String, ForeignKey("apiaries.id", ondelete="SET NULL"), nullable=True)
    moved_on = Column(Date, nullable=False, index=True)
    forage = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)
    from_name = Column(String, nullable=False)
    from_latitude = Column(Float, nullable=True)
    from_longitude = Column(Float, nullable=True)
    to_name = Column(String, nullable=False)
    to_latitude = Column(Float, nullable=True)
    to_longitude = Column(Float, nullable=True)
    created_by_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hive = relationship("Hive", back_populates="moves")
    created_by = relationship("User", foreign_keys=[created_by_id])


class Share(Base):
    """One beekeeper letting another work on an apiary, or on a single hive.

    The invitation is addressed to an email address. When an account with that address exists
    it is bound to it straight away (`grantee_user_id`); when none does, only the address and
    a token (kept as a hash, the plain value goes into the invitation email) are stored, and
    the invitation is bound to whoever redeems the token.
    """
    __tablename__ = "shares"

    id = Column(String, primary_key=True, default=_uuid)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    grantee_email = Column(String, nullable=False, index=True)  # lower-case
    grantee_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    # Exactly one of the two: a whole apiary, or one hive.
    apiary_id = Column(String, ForeignKey("apiaries.id", ondelete="CASCADE"), nullable=True, index=True)
    hive_id = Column(String, ForeignKey("hives.id", ondelete="CASCADE"), nullable=True, index=True)
    status = Column(String, nullable=False, default="pending")  # pending | accepted
    token_hash = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)

    owner = relationship("User", foreign_keys=[owner_id])
    grantee = relationship("User", foreign_keys=[grantee_user_id])
    apiary = relationship("Apiary", foreign_keys=[apiary_id])
    hive = relationship("Hive", foreign_keys=[hive_id])

    __table_args__ = (
        CheckConstraint("(apiary_id IS NULL) <> (hive_id IS NULL)", name="ck_share_one_target"),
    )


# ---------------------------------------------------------------------------
# Hornet Tracker (public, no auth)
# ---------------------------------------------------------------------------

class HornetCatch(Base):
    __tablename__ = "hornet_catches"

    id = Column(String, primary_key=True, default=_uuid)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    count = Column(Integer, default=1, nullable=False)
    reporter_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class HornetNest(Base):
    __tablename__ = "hornet_nests"

    id = Column(String, primary_key=True, default=_uuid)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(
        SAEnum("found", "destruction_ordered", "destroyed", name="nest_status_enum"),
        default="found",
        nullable=False,
    )
    reporter_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HornetSighting(Base):
    __tablename__ = "hornet_sightings"

    id = Column(String, primary_key=True, default=_uuid)
    photo_url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    reporter_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(
        SAEnum("pending", "confirmed", "rejected", name="sighting_status_enum"),
        default="pending",
        nullable=False,
    )
    yes_votes = Column(Integer, default=0, nullable=False)
    no_votes = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Hornet Traps (issue #134 — named traps with GPS + daily catch logging)
# ---------------------------------------------------------------------------

import secrets as _secrets


def _trap_code():
    """Generate a random 8-character uppercase alphanumeric access code."""
    return _secrets.token_urlsafe(6)[:8].upper()


class HornetTrap(Base):
    __tablename__ = "hornet_traps"

    id = Column(String, primary_key=True, default=_uuid)
    access_code = Column(String(8), unique=True, nullable=False, index=True, default=_trap_code)
    name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    owner_name = Column(String(100), nullable=True)
    # Optional: link to a registered user (nullable — anonymous traps allowed)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    catches = relationship("HornetTrapCatch", back_populates="trap", cascade="all, delete-orphan")
    owner = relationship("User")


class HornetTrapCatch(Base):
    __tablename__ = "hornet_trap_catches"

    id = Column(String, primary_key=True, default=_uuid)
    trap_id = Column(String, ForeignKey("hornet_traps.id", ondelete="CASCADE"), nullable=False, index=True)
    count = Column(Integer, nullable=False, default=1)
    caught_on = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trap = relationship("HornetTrap", back_populates="catches")

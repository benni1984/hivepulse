from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


def _validate_photo_url(v: Optional[str]) -> Optional[str]:
    """Reject anything that isn't a plain http(s) URL — these values are
    interpolated into HTML img/href attributes client-side, so a scheme
    like javascript:/data: or an unescaped quote-breakout payload must
    never reach storage in the first place (defense in depth alongside
    the frontend's own attribute escaping)."""
    if v is None:
        return v
    if not (v.startswith("http://") or v.startswith("https://")):
        raise ValueError("photo_url must be an http:// or https:// URL")
    return v


# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=200)
    locale: str = Field(default="en", pattern="^(en|fr|de|es)$")


class SocialSignInRequest(BaseModel):
    provider: str = Field(pattern="^(apple|google)$")
    id_token: str = Field(min_length=1)
    # Apple sends the name once, in the first authorization response and never in the token,
    # so the client passes it on or it is lost for good. Only used when creating an account.
    name: Optional[str] = Field(default=None, max_length=200)
    locale: str = Field(default="en", pattern="^(en|fr|de|es)$")
    # Apple's one-time code from the same authorization. Lets the server obtain a token it
    # can hand back when the account is deleted, which Apple requires.
    authorization_code: Optional[str] = Field(default=None, max_length=2000)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CISetupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    token: str
    name: str = "CI Admin"


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    locale: str
    is_admin: bool
    is_supporter: bool
    # Derived from the stored hash, never from a column of its own.
    has_password: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut


class AccessTokenResponse(BaseModel):
    access_token: str


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    locale: Optional[str] = Field(default=None, pattern="^(en|fr|de|es)$")
    password: Optional[str] = Field(default=None, min_length=8)
    current_password: Optional[str] = None

    @model_validator(mode='after')
    def password_requires_current(self) -> 'UserUpdate':
        if self.password is not None and not self.current_password:
            raise ValueError('current_password is required when changing password')
        return self


# ---------------------------------------------------------------------------
# The beekeeper's year
# ---------------------------------------------------------------------------

class RegionOut(BaseModel):
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Days added by hand to what the position says.
    adjust_days: int = 0
    # Days the calendar is moved against its reference region (central Germany); positive is later.
    shift_days: int = 0
    # Where the position comes from: "postal_code", "apiary" (the first apiary with a position) or "default".
    source: str = "default"
    # False when a postal code was given but could not be found, so the clients can say so.
    located: bool = True


class RegionUpdate(BaseModel):
    # An empty string clears the field.
    country: Optional[str] = Field(default=None, max_length=2)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    adjust_days: Optional[int] = Field(default=None, ge=-28, le=28)

    @model_validator(mode="after")
    def clean(self) -> "RegionUpdate":
        if self.country is not None:
            country = self.country.strip().upper()
            if country and not (len(country) == 2 and country.isalpha()):
                raise ValueError("country must be a two-letter country code")
            self.country = country
        if self.postal_code is not None:
            self.postal_code = " ".join(self.postal_code.split())
        return self


class CalendarEntry(BaseModel):
    key: str
    # inspection, swarm, feeding, varroa, harvest, migration, bloom, care or winter
    category: str
    title: str
    body: str
    start: date
    end: date
    # Set when the task repeats during the entry ("at least every 9 days").
    interval_days: Optional[int] = None
    # A forage key (acacia, rapeseed, ...) when the entry is about one kind of honey.
    honey: Optional[str] = None
    # Whether today lies within the entry.
    active: bool


class CalendarOut(BaseModel):
    region: RegionOut
    today: date
    # The window the entries were asked for, inclusive.
    start: date
    end: date
    entries: List[CalendarEntry]


class AdminUserDetail(BaseModel):
    id: str
    email: str
    name: str
    locale: str
    is_admin: bool
    is_supporter: bool
    created_at: datetime
    apiary_count: int
    hive_count: int
    inspection_count: int


class SupporterUpdate(BaseModel):
    is_supporter: bool


# ---------------------------------------------------------------------------
# Reminder settings & push tokens
# ---------------------------------------------------------------------------


class ReminderSettingsOut(BaseModel):
    reminder_enabled: bool
    reminder_interval_days: int
    reminder_season_start: int
    reminder_season_end: int
    reminder_email_enabled: bool
    push_token_apns: Optional[str]
    push_token_fcm: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ReminderSettingsUpdate(BaseModel):
    reminder_enabled: Optional[bool] = None
    reminder_interval_days: Optional[int] = Field(default=None, ge=1, le=365)
    reminder_season_start: Optional[int] = Field(default=None, ge=1, le=12)
    reminder_season_end: Optional[int] = Field(default=None, ge=1, le=12)
    reminder_email_enabled: Optional[bool] = None


class PushTokenRegister(BaseModel):
    platform: Literal["ios", "android"]
    token: str = Field(min_length=1)


class ReminderSendResult(BaseModel):
    sent: int
    skipped_off_season: int
    skipped_disabled: int
    skipped_no_channel: int


# ---------------------------------------------------------------------------
# Admin — platform stats
# ---------------------------------------------------------------------------

class AdminApiaryOut(BaseModel):
    id: str
    name: str
    owner_email: str
    latitude: Optional[float]
    longitude: Optional[float]
    hive_count: int
    is_public: bool
    created_at: datetime


class SignupDay(BaseModel):
    date: str
    count: int


class HealthSummary(BaseModel):
    inactive_users: int
    zero_inspection_hives: int
    no_varroa_inspections: int


class InactiveUserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    apiary_count: int


class NoVarroaApiaryOut(BaseModel):
    apiary_id: str
    apiary_name: str
    owner_email: str
    missing_varroa_count: int


class ZeroInspectionHiveOut(BaseModel):
    id: str
    name: str
    hive_type: str
    apiary_id: str
    apiary_name: str
    owner_email: str
    initialized_at: datetime


class AdminTokenOut(BaseModel):
    id: str
    expires_at: datetime


class AdminTokenStats(BaseModel):
    total_active_sessions: int
    users_with_active_sessions: int
    avg_sessions_per_user: float


class AdminPlatformStats(BaseModel):
    preset: str
    total_users: int
    new_users_in_period: int
    supporter_count: int
    total_apiaries: int
    public_apiaries: int
    total_hives: int
    total_inspections: int
    active_users_30d: int
    signups_by_day: List[SignupDay]


# ---------------------------------------------------------------------------
# Field Definitions
# ---------------------------------------------------------------------------

class FieldDefinitionCreate(BaseModel):
    target: str = Field(pattern="^(hive|inspection)$")
    name: str = Field(min_length=1, max_length=200)
    type: str = Field(pattern="^(text|number|boolean|date|select)$")
    options: List[str] = Field(default_factory=list, max_length=100)
    required: bool = False
    default_value: Optional[Any] = None
    sort_order: int = 0


class FieldDefinitionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    options: Optional[List[str]] = Field(default=None, max_length=100)
    required: Optional[bool] = None
    default_value: Optional[Any] = None
    sort_order: Optional[int] = None


class FieldDefinitionOut(BaseModel):
    id: str
    scope: str
    apiary_id: Optional[str]
    target: str
    name: str
    type: str
    options: List[str]
    required: bool
    default_value: Optional[Any]
    sort_order: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Apiaries
# ---------------------------------------------------------------------------

class ApiaryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = Field(default=None, max_length=500)
    is_public: bool = False


class ApiaryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = Field(default=None, max_length=500)
    is_public: Optional[bool] = None


class ApiaryOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    hive_count: int
    is_public: bool
    # owner | shared | partial, see "Sharing" in the API contract. owner_name is empty for the
    # caller's own apiaries.
    access: str = "owner"
    owner_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# QR Batches
# ---------------------------------------------------------------------------

class QrBatchCreate(BaseModel):
    count: int = Field(ge=1, le=50)


class QrTokenOut(BaseModel):
    token: str
    linked_hive_id: Optional[str]

    model_config = {"from_attributes": True}


class QrBatchOut(BaseModel):
    id: str
    count: int
    created_at: datetime
    tokens: List[QrTokenOut]

    model_config = {"from_attributes": True}


class QrBatchSummary(BaseModel):
    id: str
    count: int
    created_at: datetime
    linked_count: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Hives
# ---------------------------------------------------------------------------

class HiveCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    hive_type: str = Field(default="langstroth", pattern="^(langstroth|dadant|top_bar|warre|other)$")
    acquisition_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


class HiveInitialize(BaseModel):
    qr_token: str
    apiary_id: str
    name: str = Field(min_length=1, max_length=200)
    hive_type: str = Field(default="langstroth", pattern="^(langstroth|dadant|top_bar|warre|other)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    acquisition_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)


class HiveUpdate(BaseModel):
    apiary_id: Optional[str] = None
    name: Optional[str] = Field(default=None, max_length=200)
    hive_type: Optional[str] = Field(default=None, pattern="^(langstroth|dadant|top_bar|warre|other)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    acquisition_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    custom_fields: Optional[Dict[str, Any]] = None


class HiveOut(BaseModel):
    id: str
    qr_token: str
    apiary_id: str
    name: str
    hive_type: str
    latitude: Optional[float]
    longitude: Optional[float]
    acquisition_date: Optional[date]
    notes: Optional[str]
    custom_fields: Dict[str, Any]
    initialized_at: datetime
    last_inspection_at: Optional[datetime]
    access: str = "owner"
    created_at: datetime

    model_config = {"from_attributes": True}


class QrScanUnlinked(BaseModel):
    status: str = "unlinked"
    token: str


# ---------------------------------------------------------------------------
# Inspections
# ---------------------------------------------------------------------------

# _Date avoids field-name / type-name shadowing: Python assigns `date = None`
# before evaluating annotations, so `date: Optional[date]` would resolve to
# Optional[NoneType]. Using an alias keeps the module-level datetime.date.
_Date = date


class InspectionCreate(BaseModel):
    date: date
    queen_seen: Optional[bool] = None
    queen_color: Optional[str] = Field(default=None, pattern="^(white|yellow|red|green|blue)$")
    brood_frames: Optional[int] = Field(default=None, ge=0, le=10)
    honey_frames: Optional[int] = Field(default=None, ge=0, le=10)
    mood: Optional[str] = Field(default=None, pattern="^(calm|nervous|aggressive)$")
    population_strength: Optional[int] = Field(default=None, ge=1, le=3)  # 1 weak, 2 medium, 3 strong
    varroa_level: Optional[int] = Field(default=None, ge=0, le=3)  # 0 none, 1 low, 2 medium, 3 high
    varroa_count: Optional[int] = Field(default=None, ge=0)  # legacy; derives varroa_level when that is absent
    swarm_cells_seen: Optional[bool] = None
    treatment_applied: Optional[str] = Field(default=None, max_length=500)
    feeding_done: Optional[bool] = None
    feeding_type: Optional[str] = Field(default=None, max_length=200)
    weight_kg: Optional[float] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    # Offline clients reuse this across retries so a resend does not duplicate the visit.
    client_id: Optional[str] = Field(default=None, max_length=64)


class InspectionUpdate(BaseModel):
    date: Optional[_Date] = None
    queen_seen: Optional[bool] = None
    queen_color: Optional[str] = Field(default=None, pattern="^(white|yellow|red|green|blue)$")
    brood_frames: Optional[int] = Field(default=None, ge=0, le=10)
    honey_frames: Optional[int] = Field(default=None, ge=0, le=10)
    mood: Optional[str] = Field(default=None, pattern="^(calm|nervous|aggressive)$")
    population_strength: Optional[int] = Field(default=None, ge=1, le=3)  # 1 weak, 2 medium, 3 strong
    varroa_level: Optional[int] = Field(default=None, ge=0, le=3)  # 0 none, 1 low, 2 medium, 3 high
    varroa_count: Optional[int] = Field(default=None, ge=0)  # legacy; derives varroa_level when that is absent
    swarm_cells_seen: Optional[bool] = None
    treatment_applied: Optional[str] = Field(default=None, max_length=500)
    feeding_done: Optional[bool] = None
    feeding_type: Optional[str] = Field(default=None, max_length=200)
    weight_kg: Optional[float] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    custom_fields: Optional[Dict[str, Any]] = None


class InspectionOut(BaseModel):
    id: str
    hive_id: str
    date: date
    queen_seen: Optional[bool]
    queen_color: Optional[str]
    brood_frames: Optional[int]
    honey_frames: Optional[int]
    mood: Optional[str]
    population_strength: Optional[int]
    varroa_level: Optional[int]
    varroa_count: Optional[int]
    swarm_cells_seen: Optional[bool]
    treatment_applied: Optional[str]
    feeding_done: Optional[bool]
    feeding_type: Optional[str]
    weight_kg: Optional[float]
    notes: Optional[str]
    custom_fields: Dict[str, Any]
    client_id: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Planned treatments and the home summary
# ---------------------------------------------------------------------------

class TreatmentCreate(BaseModel):
    hive_id: Optional[str] = None
    apiary_id: Optional[str] = None
    product: str = Field(min_length=1, max_length=200)
    due_on: date
    note: Optional[str] = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def exactly_one_target(self):
        if bool(self.hive_id) == bool(self.apiary_id):
            raise ValueError("give exactly one of hive_id and apiary_id")
        if not self.product.strip():
            raise ValueError("product cannot be empty")
        return self


class TreatmentUpdate(BaseModel):
    product: Optional[str] = Field(default=None, min_length=1, max_length=200)
    due_on: Optional[date] = None
    note: Optional[str] = Field(default=None, max_length=2000)


class TreatmentDone(BaseModel):
    done_on: Optional[date] = None

    @model_validator(mode="after")
    def not_in_the_future(self):
        if self.done_on is not None and self.done_on > date.today() + timedelta(days=1):
            raise ValueError("done_on cannot be in the future")
        return self


class TreatmentTarget(BaseModel):
    type: str
    id: str
    name: str


class PlannedTreatmentOut(BaseModel):
    id: str
    target: TreatmentTarget
    apiary_name: Optional[str] = None
    product: str
    due_on: date
    note: Optional[str] = None
    done_on: Optional[date] = None
    overdue: bool = False
    created_by_name: Optional[str] = None
    created_at: datetime


class HomeInspection(BaseModel):
    hive_id: str
    hive_name: str
    apiary_name: str
    last_inspection_on: Optional[date] = None
    due_on: date
    overdue_days: int


class HomeInspections(BaseModel):
    interval_days: int
    overdue_count: int
    due_soon_count: int
    next: List[HomeInspection]


class HomeAttention(BaseModel):
    hive_id: str
    hive_name: str
    apiary_name: str
    status: str
    reasons: List[str]


class HomeHealth(BaseModel):
    ok: int
    watch: int
    alert: int
    unknown: int
    attention: List[HomeAttention]


class HomeTreatments(BaseModel):
    open_count: int
    overdue_count: int
    upcoming: List[PlannedTreatmentOut]


class HomeAd(BaseModel):
    id: str
    label: str
    title: str
    body: str
    url: Optional[str] = None


class HomeOut(BaseModel):
    today: date
    in_season: bool
    apiary_count: int
    hive_count: int
    inspections: HomeInspections
    health: HomeHealth
    treatments: HomeTreatments
    ad: Optional[HomeAd] = None


# ---------------------------------------------------------------------------
# Moving hives
# ---------------------------------------------------------------------------

class NewApiaryForMove(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: Optional[str] = Field(default=None, max_length=500)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class MoveCreate(BaseModel):
    hive_ids: List[str] = Field(min_length=1, max_length=200)
    to_apiary_id: Optional[str] = None
    new_apiary: Optional[NewApiaryForMove] = None
    moved_on: Optional[date] = None
    forage: Optional[str] = Field(default=None, max_length=100)
    note: Optional[str] = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def one_target_and_no_future(self):
        if bool(self.to_apiary_id) == bool(self.new_apiary):
            raise ValueError("give exactly one of to_apiary_id and new_apiary")
        # A day of slack: somebody east of the server may already be on tomorrow's date.
        if self.moved_on is not None and self.moved_on > date.today() + timedelta(days=1):
            raise ValueError("moved_on cannot be in the future")
        return self


class MovePlace(BaseModel):
    apiary_id: Optional[str] = None
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class HiveMoveOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    hive_id: str
    hive_name: str
    moved_on: date
    forage: Optional[str] = None
    note: Optional[str] = None
    from_: MovePlace = Field(alias="from")
    to: MovePlace
    created_by_name: Optional[str] = None
    created_at: datetime


class MoveResult(BaseModel):
    moved: int
    apiary: ApiaryOut
    moves: List[HiveMoveOut]


# ---------------------------------------------------------------------------
# Sharing
# ---------------------------------------------------------------------------

class ShareCreate(BaseModel):
    email: EmailStr
    apiary_id: Optional[str] = None
    hive_id: Optional[str] = None

    @model_validator(mode="after")
    def exactly_one_target(self):
        if bool(self.apiary_id) == bool(self.hive_id):
            raise ValueError("give exactly one of apiary_id and hive_id")
        return self


class ShareTarget(BaseModel):
    type: str
    id: str
    name: str


class ShareOut(BaseModel):
    id: str
    email: str
    status: str
    target: ShareTarget
    collaborator_name: Optional[str] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None


class IncomingShareOut(BaseModel):
    id: str
    owner_name: str
    target: ShareTarget
    apiary_name: Optional[str] = None
    created_at: datetime


class ShareTokenRequest(BaseModel):
    token: str = Field(min_length=1, max_length=200)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

class StatsPeriod(BaseModel):
    from_date: date = Field(alias="from")
    to_date: date = Field(alias="to")
    preset: str

    model_config = {"populate_by_name": True}


class TrendPoint(BaseModel):
    date: date
    value: Any


class CustomFieldStat(BaseModel):
    field_name: str
    type: str
    trend: Optional[List[TrendPoint]] = None
    distribution: Optional[Dict[str, int]] = None


class HiveStats(BaseModel):
    hive_id: str
    period: StatsPeriod
    inspection_count: int
    days_since_last_inspection: Optional[int]
    queen_seen_rate: Optional[float]
    mood_distribution: Dict[str, int]
    swarm_cells_count: int
    treatments: List[Dict[str, Any]]
    varroa_trend: List[TrendPoint]
    brood_frames_trend: List[TrendPoint]
    honey_frames_trend: List[TrendPoint]
    population_strength_trend: List[TrendPoint]
    weight_trend: List[TrendPoint]
    custom_field_stats: Dict[str, CustomFieldStat]


class HiveStatsSummary(BaseModel):
    hive_id: str
    hive_name: str
    inspection_count: int
    days_since_last_inspection: Optional[int]
    average_varroa: Optional[float]


class ApiaryStats(BaseModel):
    apiary_id: str
    period: StatsPeriod
    hive_count: int
    inspections_total: int
    hives_inspected_last_30d: int
    hives_not_inspected_30d: int
    average_varroa: Optional[float]
    average_brood_frames: Optional[float]
    average_honey_frames: Optional[float]
    mood_distribution: Dict[str, int]
    swarm_alerts: int
    per_hive: List[HiveStatsSummary]


class ApiaryStatsSummary(BaseModel):
    apiary_id: str
    apiary_name: str
    hive_count: int
    inspections_total: int


class OverviewStats(BaseModel):
    period: StatsPeriod
    apiary_count: int
    hive_count: int
    inspections_total: int
    per_apiary: List[ApiaryStatsSummary]


# ---------------------------------------------------------------------------
# Hornet Tracker
# ---------------------------------------------------------------------------

class HornetCatchCreate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    count: int = Field(default=1, ge=1, le=1000)
    reporter_name: Optional[str] = Field(default=None, max_length=100)


class HornetCatchOut(BaseModel):
    id: str
    count: int
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class HornetNestCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    reporter_name: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)
    photo_url: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("photo_url")
    @classmethod
    def _check_photo_url(cls, v: Optional[str]) -> Optional[str]:
        return _validate_photo_url(v)


class HornetNestOut(BaseModel):
    id: str
    latitude: float
    longitude: float
    status: str
    reporter_name: Optional[str]
    notes: Optional[str]
    photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HornetSightingCreate(BaseModel):
    photo_url: str = Field(max_length=2000)
    description: Optional[str] = Field(default=None, max_length=2000)
    reporter_name: Optional[str] = Field(default=None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator("photo_url")
    @classmethod
    def _check_photo_url(cls, v: str) -> str:
        return _validate_photo_url(v)  # type: ignore[return-value]


class HornetSightingOut(BaseModel):
    id: str
    photo_url: str
    description: Optional[str]
    reporter_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    yes_votes: int
    no_votes: int
    created_at: datetime

    model_config = {"from_attributes": True}


class HornetVote(BaseModel):
    vote: str = Field(pattern="^(yes|no)$")


class HornetSightingStatusUpdate(BaseModel):
    status: str = Field(pattern="^(confirmed|rejected)$")


class HornetStatsOut(BaseModel):
    total_caught: int
    total_nests: int
    destroyed_nests: int
    pending_sightings: int
    confirmed_sightings: int
    total_traps: int = 0


# ---------------------------------------------------------------------------
# Hornet Traps (issue #134)
# ---------------------------------------------------------------------------

class HornetTrapCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    notes: Optional[str] = Field(default=None, max_length=2000)
    owner_name: Optional[str] = Field(default=None, max_length=100)


class HornetTrapCatchCreate(BaseModel):
    count: int = Field(default=1, ge=1, le=500)
    caught_on: date


class HornetTrapCatchOut(BaseModel):
    id: str
    trap_id: str
    count: int
    caught_on: date
    created_at: datetime

    model_config = {"from_attributes": True}


class HornetTrapOut(BaseModel):
    id: str
    access_code: str
    name: str
    latitude: float
    longitude: float
    notes: Optional[str]
    owner_name: Optional[str]
    created_at: datetime
    total_caught: int = 0
    catches: list[HornetTrapCatchOut] = []

    model_config = {"from_attributes": True}


class HornetTrapNearbyOut(BaseModel):
    access_code: str
    name: str
    latitude: float
    longitude: float
    distance_m: int
    total_caught: int


# Resolve forward references
TokenResponse.model_rebuild()

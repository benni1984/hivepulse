# HivePulse — API Contract

Base URL: `http://<host>:8000/api/v1`

All endpoints require `Authorization: Bearer <access_token>` unless marked **public**.

---

## Table of Contents

1. [Conventions](#conventions)
2. [Auth](#auth)
3. [Users & Preferences](#users--preferences)
4. [Notifications](#notifications)
5. [Custom Field Definitions](#custom-field-definitions)
6. [Apiaries](#apiaries)
7. [QR Batches](#qr-batches)
8. [Hives](#hives)
9. [Inspections](#inspections)
10. [Sharing](#sharing)
11. [Stats](#stats)
12. [Public Dashboard](#public-dashboard)
13. [Hornet Tracker](#hornet-tracker)
14. [Admin](#admin)
15. [Object Reference](#object-reference)
16. [Error Codes](#error-codes)

---

## Conventions

### Pagination

All list endpoints accept:

| Query param | Default | Description |
|-------------|---------|-------------|
| `page` | 1 | Page number |
| `per_page` | 20 | Items per page (max 100) |

List responses wrap items in:

```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

### Dates & Times

- Dates: `YYYY-MM-DD`
- Datetimes: ISO 8601 UTC, e.g. `2026-04-26T14:30:00Z`

### Localisation

The API returns error messages in the language indicated by the `Accept-Language` request header (`en`, `fr`, `de`, `es`). All other user-facing strings (field names, labels) are managed client-side. The user's preferred locale is stored on the user object.

### Error envelope

```json
{
  "error": {
    "code": "HIVE_NOT_FOUND",
    "message": "No hive found with the given ID."
  }
}
```

---

## Auth

All auth endpoints are **public** (no token required).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Obtain token pair |
| POST | `/auth/social` | Sign in with an Apple or Google identity token |
| GET | `/auth/providers` | Which sign-in providers this server accepts |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Request a password-reset email |
| POST | `/auth/reset-password` | Set a new password using a reset token |

### POST `/auth/register`

**Request**
```json
{
  "email": "user@example.com",
  "password": "string (min 8 chars)",
  "name": "string",
  "locale": "en"
}
```

**Response 201**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": { /* User object */ }
}
```

### POST `/auth/login`

**Request**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response 200** — same shape as register.

### POST `/auth/social`

Signs in with an identity token issued by Apple or Google. Creates the account on first use,
so there is no separate registration step.

**Request**
```json
{
  "provider": "apple" | "google",
  "id_token": "string",
  "name": "Ada Lovelace",
  "authorization_code": "string"
}
```

`name` is optional and only used when the account is created. Apple sends a name exactly
once — in the authorization response of the very first sign-in, never in the token itself —
so the client has to pass it on or it is lost for good. Google carries the name in the token
and clients may omit the field.

`authorization_code` is optional and only read for `provider: "apple"`. It is the one-time
code from the same Apple authorization as the `id_token`. The server trades it for a refresh
token and keeps it, so that it can revoke the token when the account is deleted, which Apple
requires of every app that offers Sign in with Apple. A failed exchange never fails the
sign-in. The token is never returned to a client.

**Response 200** — same shape as register.

**Errors**

| Code | Meaning |
|------|---------|
| 401 `INVALID_IDENTITY_TOKEN` | Signature, issuer, audience or expiry did not check out |
| 401 `EMAIL_NOT_VERIFIED` | The provider did not vouch for the address |
| 503 `SOCIAL_SIGN_IN_UNCONFIGURED` | The server has no client IDs for this provider |

**How an account is found**

The provider's subject identifier (`sub`) is the key, not the email address: an Apple user
can hide their address behind a relay, and addresses change hands. The `sub` never changes
for the same person and app.

When a `sub` arrives that is unknown but the verified email matches an existing account, the
two are linked and the user keeps their hives. The address must be verified by the provider,
or anybody who can register an unverified address at either provider could walk into a
stranger's account.

**What the server must be told**

`GOOGLE_CLIENT_IDS` and `APPLE_CLIENT_IDS` (comma-separated) list the audiences a token may
carry — one per platform. A token whose `aud` is not on the list is refused, which is what
stops a token minted for an unrelated app from working here.

### GET `/auth/providers`

Public. Tells a client which providers are configured and under which client ID, so that
nothing has to carry a copy of it.

**Response 200**
```json
{
  "google": { "client_id": "1057...apps.googleusercontent.com" },
  "apple": { "client_id": "com.hivepulse.app" }
}
```

A provider the server cannot verify tokens for is `null`, and the client hides its button.
That way the buttons appear everywhere the moment the server is configured, with no client
release — and a button can never offer a sign-in the server would reject.

Client IDs are public by design: Google's sits in the markup of every page showing its
button, Apple's is the bundle identifier. The client *secret* takes no part in this flow and
is never sent anywhere.

### POST `/auth/refresh`

**Request**
```json
{ "refresh_token": "string" }
```

**Response 200**
```json
{ "access_token": "string" }
```

### POST `/auth/logout`

**Request**
```json
{ "refresh_token": "string" }
```

**Response 204** — no body.

---

### POST `/auth/forgot-password`

Sends a password-reset email containing a single-use link. Always returns 204 regardless of whether the email is registered (prevents user enumeration). The reset link is valid for 15 minutes.

**Request**
```json
{ "email": "user@example.com" }
```

**Response 204** — no body.

---

### POST `/auth/reset-password`

Sets a new password. The token is the value from the reset link. On success all existing refresh tokens for the user are revoked.

**Request**
```json
{
  "token": "string",
  "new_password": "string (min 8 chars)"
}
```

**Response 204** — no body.

**Errors**

| Code | HTTP | Meaning |
|------|------|---------|
| `RESET_TOKEN_INVALID` | 400 | Token not found, already used, or expired |
| `VALIDATION_ERROR` | 422 | Password too short |

---

## Users & Preferences

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get own profile |
| PUT | `/users/me` | Update profile |
| DELETE | `/users/me` | Delete the account and everything in it |

### User object

```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "locale": "en | fr | de | es",
  "has_password": true,
  "created_at": "datetime"
}
```

`has_password` is `false` for an account created through Apple or Google, which has no
password at all. Clients use it to show "Change password" only where there is something to
change.

### PUT `/users/me`

All fields optional.

```json
{
  "name": "string",
  "locale": "en | fr | de | es",
  "password": "string (min 8 chars)",
  "current_password": "string"
}
```

Changing the password needs `current_password`. An account without a password has none to
check against, so asking to change it is refused with **400 `NO_PASSWORD_SET`** rather than
failing: such an account sets a password through `/auth/forgot-password`, which proves control
of the mailbox, instead of through an access token that may have been lifted.

### DELETE `/users/me`

Deletes the account, its apiaries, hives and inspections. **204**, no body.

What the account shared with others is not deleted with it: see
[When an owner deletes their account](#when-an-owner-deletes-their-account).

If the account was signed in through Apple with an `authorization_code` (see
`POST /auth/social`), the server first revokes the stored Apple token, as Apple requires.
That call is best effort: when Apple is unreachable or refuses, the account is deleted anyway,
because nobody's right to delete their own data may depend on a third party answering.

### GET `/users/me/reminder`

Returns the current user's inspection reminder preferences.

**Response 200**
```json
{
  "reminder_enabled": true,
  "reminder_interval_days": 7,
  "reminder_season_start": 4,
  "reminder_season_end": 8,
  "reminder_email_enabled": false,
  "push_token_apns": null,
  "push_token_fcm": null
}
```

### PUT `/users/me/reminder`

Updates reminder preferences. All fields optional.

**Request**
```json
{
  "reminder_enabled": false,
  "reminder_interval_days": 14,
  "reminder_season_start": 3,
  "reminder_season_end": 9,
  "reminder_email_enabled": true
}
```

**Response 200** — same shape as GET.

`reminder_email_enabled` (default `false`) is an independent delivery channel, additive to push: if `true`, `POST /notifications/send-reminders` emails the user (via Resend, to their account email — no separate address to manage) whenever they have overdue hives, regardless of whether a push token is registered. A user can have both channels on at once and receives both. This is the only reminder channel available to web-only users, since push tokens are only ever registered by the iOS/Android apps (`POST /users/me/push-token`) — there is no browser-push mechanism. Account settings (including reminder prefs) are already shared across web/iOS/Android: it's the same user record regardless of which client reads or writes it.

### POST `/users/me/push-token`

Registers or replaces a device push token.

**Request**
```json
{
  "platform": "ios | android",
  "token": "string"
}
```

**Response 200**
```json
{ "ok": true }
```

---

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| POST | `/notifications/send-reminders` | Trigger inspection reminder push notifications (cron) |

### POST `/notifications/send-reminders`

Protected by `X-Cron-Secret` header. Called daily by GitHub Actions at 06:00 UTC.
Returns 401 if the header is missing or incorrect.

For each eligible user (enabled, in season, has overdue hives) with a registered push token, sends a push notification (currently stubbed — see `_send_push` — until Firebase/APNs credentials are configured). Independently, for each eligible user with `reminder_email_enabled = true`, sends a real email via Resend regardless of push-token state. A user with both a push token and `reminder_email_enabled = true` receives both.

**Request headers**
```
X-Cron-Secret: <secret>
```

**Response 200**
```json
{
  "sent": 3,
  "skipped_off_season": 12,
  "skipped_disabled": 1,
  "skipped_no_channel": 5
}
```

`skipped_no_channel` (renamed from `skipped_no_token`): counts users who are enabled and in-season but have neither a push token nor `reminder_email_enabled`, so there is no channel to notify them through.

---

## Custom Field Definitions

Custom fields extend the built-in hive and inspection fields. Definitions are scoped either to the **user** (apply to all hives/inspections) or to a specific **apiary** (apply only within that location). When rendering a form, merge user-scope and apiary-scope definitions; apiary-scope takes precedence on name conflicts.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/field-definitions` | List all definitions (user-scope) |
| POST | `/field-definitions` | Create user-scope definition |
| PUT | `/field-definitions/{id}` | Update definition |
| DELETE | `/field-definitions/{id}` | Delete definition |
| GET | `/apiaries/{id}/field-definitions` | List apiary-scope definitions |
| POST | `/apiaries/{id}/field-definitions` | Create apiary-scope definition |
| PUT | `/apiaries/{id}/field-definitions/{fid}` | Update apiary-scope definition |
| DELETE | `/apiaries/{id}/field-definitions/{fid}` | Delete apiary-scope definition |

### FieldDefinition object

```json
{
  "id": "uuid",
  "scope": "user | apiary",
  "apiary_id": "uuid | null",
  "target": "hive | inspection",
  "name": "string",
  "type": "text | number | boolean | date | select",
  "options": ["string"],
  "required": false,
  "default_value": "any | null",
  "sort_order": 0
}
```

`options` is only used when `type` is `select`.

### POST `/field-definitions` — Request body

```json
{
  "target": "hive | inspection",
  "name": "string",
  "type": "text | number | boolean | date | select",
  "options": ["string"],
  "required": false,
  "default_value": null,
  "sort_order": 0
}
```

---

## Apiaries

An apiary is a named location. Hives belong to exactly one apiary.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apiaries` | List apiaries |
| POST | `/apiaries` | Create apiary |
| GET | `/apiaries/{id}` | Get apiary detail |
| PUT | `/apiaries/{id}` | Update apiary |
| DELETE | `/apiaries/{id}` | Delete apiary (must have no hives) |

### Apiary object

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "latitude": "float | null",
  "longitude": "float | null",
  "address": "string | null",
  "hive_count": 3,
  "is_public": false,
  "access": "owner | shared | partial",
  "owner_name": "string | null",
  "created_at": "datetime"
}
```

`access` and `owner_name` are explained under [Sharing](#sharing): `owner_name` is `null` for the
caller's own apiaries, and `hive_count` counts only the hives the caller can see.

`is_public` controls whether this apiary appears on the public map. Defaults to `false` (opt-in). Apiaries with `is_public = false` are invisible to the public endpoints even if they have GPS coordinates.

If a public apiary has an `address` but no `latitude`/`longitude`, the server forward-geocodes the address on create/update and stores the result in `latitude`/`longitude` — this is what lets address-only apiaries (the common case for web-created ones) still appear as pins in `GET /public/stats`. If geocoding fails (unmatched address, upstream outage), the apiary keeps `latitude`/`longitude = null` and is simply omitted from the pin list until its address is corrected and saved again.

### POST / PUT `/apiaries` — Request body

```json
{
  "name": "Garden apiary",
  "description": "string | null",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "address": "string | null",
  "is_public": false
}
```

---

## QR Batches

QR codes are generated in advance ("pre-printed"), before any hive exists. Each token in a batch is an unlinked UUID. When a user scans an unlinked token for the first time, the app starts the hive initialisation wizard.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/qr-batches` | List batches |
| POST | `/qr-batches` | Generate a new batch |
| GET | `/qr-batches/{id}` | Get batch with all tokens |
| GET | `/qr-batches/{id}/pdf` | Download printable PDF (`application/pdf`) |
| DELETE | `/qr-batches/{id}` | Delete a batch none of whose codes is attached to a hive |

### DELETE `/qr-batches/{id}`

**204**, no body. Deletes the batch and all its codes.

**409 `QR_BATCH_IN_USE`** when at least one code of the batch is attached to a hive: scanning
that sticker is how the hive is found again, so the batch stays until the hives are gone. The
`linked_count` of the batch summary says in advance whether deleting can succeed, which lets a
client hide or disable the action instead of offering one that is going to be refused.
**404 `QR_BATCH_NOT_FOUND`** for a batch that is not the caller's.

### POST `/qr-batches` — Request body

```json
{ "count": 5 }
```

`count` must be between 1 and 50.

### QrBatch object

```json
{
  "id": "uuid",
  "count": 5,
  "created_at": "datetime",
  "tokens": [
    {
      "token": "string (uuid)",
      "linked_hive_id": "uuid | null"
    }
  ]
}
```

The PDF endpoint returns a printable A4 document with one QR code per label.

---

## Hives

### Scan / resolve a QR token

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/by-qr/{token}` | Resolve QR token |

**Response — token is linked**

HTTP 200, returns the full Hive object.

**Response — token exists but is unlinked**

HTTP 200:
```json
{ "status": "unlinked", "token": "string" }
```

The app should start the hive initialisation wizard and call `POST /hives/initialize`.

**Response — token unknown**

HTTP 404, error code `QR_TOKEN_NOT_FOUND`.

---

### Hive CRUD

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apiaries/{id}/hives` | List hives in an apiary |
| POST | `/apiaries/{id}/hives` | Create a hive (auto-generates QR token) |
| POST | `/hives/initialize` | Link an existing QR token to a new hive (mobile) |
| GET | `/hives/{id}` | Get hive detail |
| PUT | `/hives/{id}` | Update hive |
| DELETE | `/hives/{id}` | Delete hive and all inspections |
| GET | `/hives/{id}/qr` | Get QR image (`image/png`) |

### Hive object

```json
{
  "id": "uuid",
  "qr_token": "string",
  "apiary_id": "uuid",
  "name": "string",
  "hive_type": "langstroth | dadant | top_bar | warre | other",
  "latitude": "float | null",
  "longitude": "float | null",
  "acquisition_date": "date | null",
  "notes": "string | null",
  "custom_fields": {
    "<field_definition_id>": "value"
  },
  "initialized_at": "datetime",
  "last_inspection_at": "datetime | null",
  "access": "owner | shared",
  "created_at": "datetime"
}
```

### POST `/apiaries/{id}/hives` — Request body

Creates a hive without a pre-printed QR token. A QR token UUID is auto-generated and attached. Used by the web dashboard.

```json
{
  "name": "Hive 3",
  "hive_type": "langstroth",
  "acquisition_date": "2026-04-01",
  "notes": "string | null"
}
```

**Response 201** — full Hive object.

---

### POST `/hives/initialize` — Request body

GPS coordinates are captured by the mobile app on the first scan and sent here.

```json
{
  "qr_token": "string",
  "apiary_id": "uuid",
  "name": "Hive 3",
  "hive_type": "langstroth",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "acquisition_date": "2026-04-01",
  "notes": "string | null",
  "custom_fields": {}
}
```

**Response 201** — full Hive object.

Errors: `QR_TOKEN_NOT_FOUND`, `QR_TOKEN_ALREADY_LINKED`.

### PUT `/hives/{id}` — Request body

All fields optional.

```json
{
  "apiary_id": "uuid",
  "name": "string",
  "hive_type": "langstroth | dadant | top_bar | warre | other",
  "latitude": "float | null",
  "longitude": "float | null",
  "acquisition_date": "date | null",
  "notes": "string | null",
  "custom_fields": {}
}
```

---

## Inspections

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/{id}/inspections` | List inspections (paginated, newest first) |
| POST | `/hives/{id}/inspections` | Add inspection |
| GET | `/inspections/{id}` | Get single inspection |
| PUT | `/inspections/{id}` | Update inspection |
| DELETE | `/inspections/{id}` | Delete inspection |

### Inspection object

```json
{
  "id": "uuid",
  "hive_id": "uuid",
  "date": "2026-04-23",
  "queen_seen": "boolean | null",
  "queen_color": "white | yellow | red | green | blue | null",
  "brood_frames": "integer 0–10 | null",
  "honey_frames": "integer 0–10 | null",
  "mood": "calm | nervous | aggressive | null",
  "population_strength": "integer 1–3 | null",
  "varroa_level": "integer 0–3 | null",
  "varroa_count": "integer | null",
  "swarm_cells_seen": "boolean | null",
  "treatment_applied": "string | null",
  "feeding_done": "boolean | null",
  "feeding_type": "string | null",
  "weight_kg": "float | null",
  "notes": "string | null",
  "custom_fields": {
    "<field_definition_id>": "value"
  },
  "created_by_name": "string | null",
  "created_at": "datetime"
}
```

`created_by_name` is who recorded the inspection, so that two people working on one hive can see
who did what. `null` for records made before sharing existed, or whose author has deleted their
account.

### Rating scales

| Field | Values | Meaning |
|-------|--------|---------|
| `population_strength` | 1, 2, 3 | weak, medium, strong (subjective colony strength) |
| `varroa_level` | 0, 1, 2, 3 | none, low, medium, high (subjective mite load) |

Clients show these as word choices, not numbers. `varroa_count` is the retired mite count: it is still returned for older inspections, and a client that sends only `varroa_count` gets `varroa_level` derived from it (0 → 0, 1–2 → 1, 3–5 → 2, > 5 → 3). When both are sent, `varroa_level` wins. Migration 011 backfilled `varroa_level` the same way and rescaled `population_strength` from 1–5 (1–2 → 1, 3 → 2, 4–5 → 3).

### Queen color — SICAMM year cycle

| Color | Years ending |
|-------|-------------|
| White | 1 or 6 |
| Yellow | 2 or 7 |
| Red | 3 or 8 |
| Green | 4 or 9 |
| Blue | 5 or 0 |

### POST / PUT `/hives/{id}/inspections` — Request body

All inspection fields are optional. Send only what was recorded during the visit.

```json
{
  "date": "2026-04-23",
  "queen_seen": true,
  "queen_color": "white",
  "brood_frames": 4,
  "honey_frames": 3,
  "mood": "calm",
  "population_strength": 2,
  "varroa_level": 1,
  "swarm_cells_seen": false,
  "treatment_applied": "Oxalic acid",
  "feeding_done": false,
  "feeding_type": null,
  "weight_kg": 34.5,
  "notes": "Free text notes",
  "custom_fields": {},
  "client_id": "6f1c0f3e-9a1e-4c0a-9a5b-1e2d3c4b5a6f"
}
```

#### `client_id` — safe retries for offline clients

`client_id` is optional and only meaningful on **POST**. An app that records an inspection
without a connection queues it and retries later; a retry that is sent after the server
already stored the first attempt would otherwise create a duplicate.

- The client generates a UUID once per recorded inspection and reuses it for every retry.
- The first POST stores it and returns `201`.
- A later POST with the same `client_id` **for the same hive** does not create a second
  inspection: it returns the stored one with `200` and leaves it unchanged.
- Omitting `client_id` keeps the old behaviour — every POST creates an inspection.
- `client_id` is echoed in `InspectionOut` so a client can match a queued entry to the
  stored one; it is at most 64 characters.

---

## Sharing

Two beekeepers can work on the same apiary, or on single hives, together. The person who made
the thing is its **owner** and invites another by email address; the invited person is a
**collaborator** once they accept.

### What can be shared

| Target | Collaborator gets |
|--------|-------------------|
| An **apiary** | The apiary and **every hive in it**, including hives added later. |
| A single **hive** | That hive only. The apiary shows up in their list under its name so they can find their way, but they see none of its other hives, cannot edit the apiary and cannot add hives to it. |

To share some hives but not all, put them in an apiary of their own and share that.

A hive belongs to whoever owns the apiary it stands in, not to whoever created the record. A
collaborator who adds a hive to a shared apiary therefore cannot delete it or invite anybody to
it, and loses sight of it, like everything else in the apiary, once the apiary is no longer
shared with them. Somebody who sees an apiary only through single shared hives gets its name and
nothing else: no address, coordinates or description.

### Access levels

`access` appears on apiaries and hives so a client can show or hide actions:

| Value | On | Meaning |
|-------|----|---------|
| `owner` | apiary, hive | The caller's own apiary, and every hive standing in it, whoever added the hive. |
| `shared` | apiary, hive | Shared with the caller as a whole apiary, or the caller holds a share on this hive. |
| `partial` | apiary | The caller holds shares on some hives in it, not on the apiary. |

### Who may do what

All collaborators are equal: they can look and they can change. What stays with the owner is
whatever cannot be taken back or concerns people outside the apiary.

| Action | Owner | Collaborator (`shared`) | Collaborator (`partial`) |
|--------|:-----:|:-----------------------:|:------------------------:|
| See apiary, hives, inspections, stats, export | yes | yes | only the shared hives |
| Record, edit and delete inspections | yes | yes | on the shared hives |
| Edit a hive | yes | yes | on the shared hives |
| Add hives to the apiary | yes | yes | no |
| Edit the apiary (name, address, notes) | yes | yes | no |
| Edit the apiary's custom fields | yes | yes | no |
| Change `is_public` (the public map) | yes | **no** | no |
| Delete a hive or the apiary | yes | **no** | no |
| Invite, list and revoke collaborators | yes | no | no |
| Leave | | yes | yes |

A refused action answers **403 `OWNER_ONLY`**. Anything the caller cannot see at all answers
404, as it always did, so that the existence of other people's apiaries is not revealed.

Custom fields: an apiary's own fields are shared with its collaborators. A user's personal
fields (`scope: "user"`) are not; a collaborator sees the values stored under them as
unlabelled data and does not get the owner's personal form fields.

QR codes: scanning a code that is attached to a hive the caller can access resolves to that
hive. A code that is attached to nothing can only be used by whoever printed it.

### Invitations

An invitation goes to an email address and is **pending** until the invited person accepts.

* If an account with that address exists, the invitation is bound to it at once and shows up
  under `GET /shares/incoming`.
* If none exists, the invitation is kept for the address and an email with a link
  (`/dashboard/invitations?token=…`) is sent. Whoever opens the link and signs in or registers
  can accept it with `POST /shares/accept-by-token`. The token proves control of the mailbox,
  which a password registration does not, so an address cannot be claimed merely by
  registering it first.
* In both cases an email tells the person about it, and the answer to the owner is identical,
  so the endpoint cannot be used to find out which addresses have an account.

### POST `/shares`

Owner only.

```json
{ "email": "partner@example.com", "apiary_id": "uuid" }
```

Exactly one of `apiary_id` and `hive_id`. **201** with a [Share](#share-object).

| Error | Meaning |
|-------|---------|
| 422 | Neither or both of `apiary_id` and `hive_id` |
| 404 `APIARY_NOT_FOUND` / `HIVE_NOT_FOUND` | Not the caller's to share |
| 403 `OWNER_ONLY` | The caller can see it as a collaborator but does not own it |
| 400 `SHARE_WITH_SELF` | The address belongs to the caller |
| 409 `SHARE_ALREADY_EXISTS` | That address already has this invitation or access |

Limited to 20 invitations per hour per user.

### GET `/shares?apiary_id=…` or `?hive_id=…`

Owner only. The collaborators and open invitations for one target, newest first. Array of
[Share](#share-object).

### GET `/shares/incoming`

The caller's open invitations. Array of [IncomingShare](#incomingshare-object). Accepted shares
are not listed here: they are simply there, in the apiary and hive lists, with
`access: "shared"`.

### POST `/shares/{id}/accept` and `/shares/{id}/decline`

For the invited person. Accept makes the target visible to them; decline deletes the
invitation. **204**. 404 `SHARE_NOT_FOUND` for an invitation that is not theirs.

### POST `/shares/accept-by-token`

```json
{ "token": "string" }
```

For an invitation sent to an address that had no account when it was made. Binds it to the
caller and accepts it. **200** with the [IncomingShare](#incomingshare-object) it became.
**404 `SHARE_TOKEN_INVALID`** for an unknown, used or revoked token. A token works once.

### DELETE `/shares/{id}`

The owner revokes a collaborator or withdraws an invitation, or a collaborator leaves. **204**.
Nothing the collaborator recorded is removed: inspections stay with the hive.

### Share object

```json
{
  "id": "uuid",
  "email": "partner@example.com",
  "status": "pending | accepted",
  "target": { "type": "apiary | hive", "id": "uuid", "name": "string" },
  "collaborator_name": "string | null",
  "created_at": "datetime",
  "accepted_at": "datetime | null"
}
```

`collaborator_name` is only set once the invitation is accepted. The invitation token is never
part of any response.

### IncomingShare object

```json
{
  "id": "uuid",
  "owner_name": "string",
  "target": { "type": "apiary | hive", "id": "uuid", "name": "string" },
  "apiary_name": "string | null",
  "created_at": "datetime"
}
```

`apiary_name` is set when the target is a hive, so the invitation can say where it sits.

### Effect on the other endpoints

* `GET /apiaries` lists owned, shared and `partial` apiaries. Apiary objects carry `access`,
  and `owner_name` when the caller is not the owner. `hive_count` counts only the hives the
  caller can see.
* `GET /apiaries/{id}/hives` returns the hives the caller can see.
* Hive objects carry `access` (`owner` | `shared`).
* Inspection objects carry `created_by_name`: who recorded it, `null` for records made before
  sharing existed or whose author deleted their account.
* Stats, overview stats and exports cover everything the caller can see.
* Inspection reminders count and notify for every hive the caller can see, so two beekeepers
  on the same hive both get the reminder.
* `PUT /apiaries/{id}` answers 403 `OWNER_ONLY` when a collaborator changes `is_public`.

### When an owner deletes their account

What others work on does not disappear with it. For every apiary the owner shared, ownership
passes to the collaborator who accepted first. A hive shared on its own passes to its
collaborator, in a new apiary of theirs with the old apiary's name. Everything the owner did
not share is deleted as before. The collaborators' open invitations to the leaving owner's
other things are removed.

---

## Stats

Stats can be filtered by a preset window or an explicit date range. Both query parameters are optional; if neither is supplied the full history is used.

| Query param | Values | Description |
|-------------|--------|-------------|
| `preset` | `30d \| 90d \| 365d \| all` | Preset time window |
| `from` | `YYYY-MM-DD` | Start of custom range |
| `to` | `YYYY-MM-DD` | End of custom range |

`preset` and `from`/`to` are mutually exclusive. `from`/`to` take precedence.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/{id}/stats` | Stats for one hive |
| GET | `/apiaries/{id}/stats` | Aggregated stats for all hives in apiary |
| GET | `/stats/overview` | Overview across all apiaries |
| GET | `/stats/community-heatmap` | Multi-metric heatmap across all public apiaries (supporter/admin only) |

### HiveStats object

```json
{
  "hive_id": "uuid",
  "period": {
    "from": "date",
    "to": "date",
    "preset": "30d | 90d | 365d | all | custom"
  },
  "inspection_count": 12,
  "days_since_last_inspection": 7,
  "queen_seen_rate": 0.83,
  "mood_distribution": {
    "calm": 9,
    "nervous": 2,
    "aggressive": 1
  },
  "swarm_cells_count": 1,
  "treatments": [
    { "date": "2026-03-01", "treatment": "Oxalic acid" }
  ],
  "varroa_trend": [
    { "date": "2026-04-01", "value": 2 }
  ],
  "_note": "varroa_trend values are varroa_level (0–3)",
  "brood_frames_trend": [{ "date": "date", "value": "int" }],
  "honey_frames_trend": [{ "date": "date", "value": "int" }],
  "population_strength_trend": [{ "date": "date", "value": "int" }],
  "weight_trend": [{ "date": "date", "value": "float" }],
  "custom_field_stats": {
    "<field_definition_id>": {
      "field_name": "string",
      "type": "number | boolean | select | text | date",
      "trend": [{ "date": "date", "value": "any" }],
      "distribution": { "option_a": 4, "option_b": 2 }
    }
  }
}
```

`trend` is returned for `number` and `date` types. `distribution` is returned for `boolean` and `select` types. `text` fields are omitted from stats.

### ApiaryStats object

```json
{
  "apiary_id": "uuid",
  "period": { "from": "date", "to": "date", "preset": "string" },
  "hive_count": 5,
  "inspections_total": 48,
  "hives_inspected_last_30d": 4,
  "hives_not_inspected_30d": 1,
  "average_varroa": 1.4,
  "average_brood_frames": 4.8,
  "average_honey_frames": 3.2,
  "mood_distribution": { "calm": 40, "nervous": 6, "aggressive": 2 },
  "swarm_alerts": 2,
  "per_hive": [ /* array of HiveStats summary */ ]
}
```

### OverviewStats object

```json
{
  "period": { "from": "date", "to": "date", "preset": "string" },
  "apiary_count": 3,
  "hive_count": 14,
  "inspections_total": 130,
  "per_apiary": [ /* array of ApiaryStats summary */ ]
}
```

### GET `/stats/community-heatmap`

Requires `Authorization: Bearer <access_token>` for a **supporter or admin** account (`403 SUPPORTER_REQUIRED` otherwise) — this backs the members-only dashboard page. Aggregates inspection data from **public apiaries only** into a coarse grid (0.5° cells, ~50km) and returns it as a GeoJSON `Polygon` FeatureCollection for the members-dashboard heatmap — the same grid-aggregation pattern used by `GET /public/heatmap` (Public Dashboard section above), which is why individual apiary locations are never exposed at this resolution.

**Response 200**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [[ /* 5-point cell boundary */ ]] },
      "properties": {
        "avg_varroa": 2.4,
        "mood_score": 78,
        "avg_brood": 5.1,
        "swarm_pct": 12,
        "apiary_count": 6,
        "inspection_count": 34
      }
    }
  ]
}
```

`avg_varroa` is the mean `varroa_level` (0–3). `mood_score` and `swarm_pct` are percentages (0–100). `avg_varroa`/`mood_score`/`avg_brood` are `null` for a cell if no inspections in that cell reported the underlying field.

---

## Export

All export endpoints require authentication. The authenticated user must own the hive or apiary.

### `GET /hives/{hive_id}/inspections/export`

Download all inspections for a single hive.

| Query param | Type | Default | Values |
|-------------|------|---------|--------|
| `format` | string | `json` | `json`, `csv` |

**JSON response** (`application/json`, `Content-Disposition: attachment; filename="hive_{id}_inspections.json"`):
```json
[ /* array of InspectionOut objects, newest first */ ]
```

**CSV response** (`text/csv`, `Content-Disposition: attachment; filename="hive_{id}_inspections.csv"`):
Flat rows with columns: `id`, `hive_id`, `date`, `queen_seen`, `queen_color`, `brood_frames`, `honey_frames`, `mood`, `population_strength`, `varroa_level`, `varroa_count`, `swarm_cells_seen`, `treatment_applied`, `feeding_done`, `feeding_type`, `weight_kg`, `notes`, `created_at`, followed by one column per distinct custom-field key found across all inspections.

---

### `GET /apiaries/{apiary_id}/inspections/export`

Download all inspections for every hive in an apiary.

| Query param | Type | Default | Values |
|-------------|------|---------|--------|
| `format` | string | `json` | `json`, `csv` |

**JSON response**: same structure as the hive endpoint — flat array of `InspectionOut` objects.

**CSV response**: same columns as the hive endpoint plus a leading `hive_name` column identifying which hive each row belongs to.

---

## Public Dashboard

All endpoints in this section are **public** — no `Authorization` header required.
They expose only aggregate, anonymised data. Individual inspection records and user identity are never exposed.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/stats` | Global aggregate stats + all apiary pins |
| GET | `/public/apiaries/{id}` | Public detail for one apiary |
| GET | `/public/heatmap` | Varroa density GeoJSON for public map overlay |

---

### GET `/public/heatmap`

Returns a GeoJSON FeatureCollection of ~0.5° grid cells (~50 km) showing the average `varroa_level` (0–3) from all public apiaries. Only cells with at least one varroa reading are included. Coordinates use city-level precision (privacy-protected centroids).

**Response 200**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[9.75, 47.75], [10.25, 47.75], [10.25, 48.25], [9.75, 48.25], [9.75, 47.75]]]
      },
      "properties": {
        "avg_varroa": 3.2,
        "apiary_count": 4,
        "inspection_count": 23
      }
    }
  ]
}
```

---

### GET `/public/stats`

Returns platform-wide aggregate numbers and the coordinates of every apiary that has opted in to the public map, for use as map markers.

**Response 200**

```json
{
  "apiary_count": 12,
  "hive_count": 87,
  "inspection_count": 634,
  "avg_varroa_count": 2.8,
  "mood_distribution": { "calm": 410, "nervous": 89, "aggressive": 23 },
  "avg_brood_frames": 5.2,
  "avg_inspection_interval_days": 14.3,
  "apiaries": [
    {
      "id": "uuid",
      "name": "string",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "hive_count": 7,
      "city_name": "string | null"
    }
  ]
}
```

The `apiaries` pin list includes **only** apiaries where `is_public = true` and coordinates could be resolved (either direct `latitude`/`longitude`, or forward-geocoded from the free-text `address` — see `POST /apiaries`). All other fields (`apiary_count`, `hive_count`, `inspection_count`, and the aggregates below) are computed over **all public apiaries**, regardless of whether coordinates could be resolved.

Aggregate fields (computed over **all public apiaries**, not just those with GPS):
- `avg_varroa_count` — mean `varroa_level` (0–3) across public inspections that recorded it; `null` if none (name kept for compatibility)
- `mood_distribution` — raw counts per mood value for public inspections that recorded mood
- `avg_brood_frames` — mean `brood_frames` across public inspections that recorded it; `null` if none
- `avg_inspection_interval_days` — mean days between consecutive inspections, averaged per hive then across all hives with ≥ 2 inspections; `null` if no hive qualifies

---

### GET `/public/apiaries/{id}`

Returns a public summary of one apiary: location, hives, and aggregated inspection activity. No user-identifiable information is included.

**Response 200**

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "latitude": "float | null",
  "longitude": "float | null",
  "address": "string | null",
  "hive_count": 7,
  "inspection_count": 52,
  "last_inspection_date": "date | null",
  "average_varroa": 1.4,
  "mood_distribution": { "calm": 40, "nervous": 8, "aggressive": 2 },
  "hives": [
    {
      "id": "uuid",
      "name": "string",
      "hive_type": "langstroth",
      "last_inspection_date": "date | null"
    }
  ]
}
```

**Response 404** — `APIARY_NOT_FOUND` (also returned when the apiary exists but `is_public = false`)

---

## Hornet Tracker

All endpoints in this section are **public** — no `Authorization` header required.
They allow any citizen (no account needed) to report Asian hornet (*Vespa velutina*) catches and nests, submit photo sightings for community identification, and view aggregated data.

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/hornets/stats` | Public | Global aggregate statistics |
| POST | `/hornets/catches` | Public | Report a catch (count + optional GPS) |
| GET | `/hornets/nests` | Public | All nests as a GeoJSON FeatureCollection |
| POST | `/hornets/nests` | Public | Report a new nest sighting |
| GET | `/hornets/sightings` | Public | Paginated photo sightings |
| POST | `/hornets/sightings` | Public | Submit a photo sighting |
| POST | `/hornets/sightings/{id}/vote` | Public | Vote yes/no on a sighting |
| POST | `/hornets/sightings/{id}/report` | Public | Report a sighting as objectionable |
| PUT | `/admin/hornets/sightings/{id}/status` | Admin | Override sighting status |
| GET | `/hornets/traps` | Auth | List traps owned by the current user |
| POST | `/hornets/traps` | Public (optional auth) | Create a named trap |
| GET | `/hornets/traps/nearby` | Public | Traps within `radius_m` of a GPS point |
| GET | `/hornets/traps/geojson` | Public | All traps as a GeoJSON FeatureCollection |
| GET | `/hornets/traps/{access_code}` | Public | Trap detail + catch history |
| POST | `/hornets/traps/{access_code}/catches` | Public | Log/update a daily catch count |

---

### GET `/hornets/stats`

Returns platform-wide aggregate numbers for the hornet tracker.

**Response 200**

```json
{
  "total_caught": 1284,
  "total_nests": 47,
  "destroyed_nests": 12,
  "pending_sightings": 8,
  "confirmed_sightings": 31
}
```

---

### POST `/hornets/catches`

Report one or more caught Asian hornets. Location is optional (allows anonymous reporting without GPS).

**Request**

```json
{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "count": 3,
  "reporter_name": "string | null"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `latitude` | No | -90 to 90 |
| `longitude` | No | -180 to 180 |
| `count` | No (default 1) | 1–1000 |
| `reporter_name` | No | max 100 chars |

**Response 201**

```json
{
  "id": "uuid",
  "count": 3,
  "latitude": 48.8566,
  "longitude": 2.3522,
  "created_at": "datetime"
}
```

---

### GET `/hornets/nests`

Returns all reported nests as a GeoJSON FeatureCollection, suitable for map rendering. Each feature is colour-coded by `status`.

Public/unauthenticated. Coordinates are rounded to 3 decimal places (~111m) and `reporter_name` is omitted — this endpoint is world-readable, so exact home coordinates + a reporter's name are never published.

**Response 200**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [2.352, 48.857]
      },
      "properties": {
        "id": "uuid",
        "status": "found",
        "notes": "string | null",
        "photo_url": "string | null",
        "created_at": "datetime"
      }
    }
  ]
}
```

`status` values: `found` (active nest) · `destruction_ordered` (removal ordered) · `destroyed` (removed)

---

### POST `/hornets/nests`

Report a new nest. GPS coordinates are required; a photo may be attached (upload via `/api/hornets/upload` first).

**Request**

```json
{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "reporter_name": "string | null",
  "notes": "string | null",
  "photo_url": "string | null"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `latitude` | Yes | -90 to 90 |
| `longitude` | Yes | -180 to 180 |
| `reporter_name` | No | max 100 chars |
| `notes` | No | max 2000 chars |
| `photo_url` | No | `http://`/`https://` URL only, max 2000 chars |

**Response 201** — HornetNest object (see below).

---

### GET `/hornets/sightings`

Returns paginated community photo sightings for identification, newest first.

Accepts standard pagination params (`page`, `per_page`).

Public/unauthenticated. `reporter_name` is returned as-is (an intentional, user-opted-in attribution shown on the community page), but `latitude`/`longitude` are rounded to 3 decimal places (~111m) — the UI never displays sighting coordinates, so there's no reason to expose exact GPS via the raw API.

**Response 200** — wrapped in the standard pagination envelope:

```json
{
  "items": [ /* array of HornetSighting objects */ ],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

---

### POST `/hornets/sightings`

Submit a photo for community identification. The photo must be uploaded first via the Next.js upload proxy route (`POST /api/hornets/upload`), which returns a Vercel Blob URL.

**Request**

```json
{
  "photo_url": "https://...",
  "description": "string | null",
  "reporter_name": "string | null",
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `photo_url` | Yes | `http://`/`https://` URL only, max 2000 chars |
| `description` | No | max 2000 chars |
| `reporter_name` | No | max 100 chars |
| `latitude` | No | -90 to 90 |
| `longitude` | No | -180 to 180 |

**Response 201** — HornetSighting object (see below).

---

### POST `/hornets/sightings/{id}/vote`

Cast a yes/no vote on whether the photo shows an Asian hornet. Each call counts as one vote (no deduplication — rate limiting is handled by Vercel Firewall).

**Auto-confirm rule:** if `yes_votes > no_votes × 2` and `yes_votes + no_votes ≥ 5`, the sighting status is automatically set to `confirmed`.

**Request**

```json
{ "vote": "yes" }
```

`vote` must be `"yes"` or `"no"`.

**Response 204** — no body.

**Response 404** — `HORNET_SIGHTING_NOT_FOUND`

---

### POST `/hornets/sightings/{id}/report`

Report a photo sighting as objectionable — a wrong photo, something offensive, spam. Both
stores require an in-app way to report publicly visible user content, and a community vote
is not one: "this is not a hornet" and "this photo does not belong here" are different
statements.

Public and unauthenticated, like voting, because the community page can be read without an
account. Rate limited per client (10 per hour) so one person cannot bury a sighting.

**No request body.**

**Response 200:**

```json
{ "id": "uuid", "report_count": 2, "hidden": false }
```

| Field | Meaning |
|-------|---------|
| `report_count` | How many reports this sighting has now |
| `hidden` | `true` once the third report arrives: the sighting disappears from the public list until an admin decides |

**Hiding is reversible and never silent.** The admin sighting list shows `report_count` and
`hidden`, and `PUT /admin/hornets/sightings/{id}/status` clears both — an admin decision
overrides the reports, in either direction.

Three reports rather than one, because a single click would otherwise let anybody remove
any photo.

**Response 404** — `HORNET_SIGHTING_NOT_FOUND`

**Response 429** — `RATE_LIMITED`

---

### PUT `/admin/hornets/sightings/{id}/status`

Admin-only override to set the status of a sighting to `confirmed` or `rejected`.

**Request**

```json
{ "status": "confirmed" }
```

`status` must be `"confirmed"` or `"rejected"`.

**Response 204** — no body.

**Response 404** — `HORNET_SIGHTING_NOT_FOUND`

---

### HornetNest object

```json
{
  "id": "uuid",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "status": "found | destruction_ordered | destroyed",
  "reporter_name": "string | null",
  "notes": "string | null",
  "photo_url": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### HornetSighting object

```json
{
  "id": "uuid",
  "photo_url": "string",
  "description": "string | null",
  "reporter_name": "string | null",
  "latitude": "float | null",
  "longitude": "float | null",
  "status": "pending | confirmed | rejected",
  "yes_votes": 4,
  "no_votes": 1,
  "created_at": "datetime"
}
```

---

### Hornet Traps

A trap is a named, physical device with a fixed GPS location and a randomly generated 8-character `access_code` (e.g. `A7B2K9XZ`). Anyone who finds a trap in person can look it up by code and log a daily catch — catch logging is intentionally anonymous/unauthenticated (crowd-sourced), while trap *ownership* (for the "my traps" list) is optional and only tracked when the creator is logged in.

#### GET `/hornets/traps`

Requires `Authorization: Bearer <access_token>`. Returns all traps owned by the current user (`user_id` set at creation time), each with its full catch history.

**Response 200** — array of `HornetTrap` objects (see below).

---

#### POST `/hornets/traps`

Create a new trap. Auth is optional — if a valid Bearer token is supplied the trap is linked to that user (appears in their `GET /hornets/traps` list); otherwise it's created anonymously.

**Request**

```json
{
  "name": "string",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "notes": "string | null",
  "owner_name": "string | null"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | 1–200 chars |
| `latitude` | Yes | -90 to 90 |
| `longitude` | Yes | -180 to 180 |
| `notes` | No | max 2000 chars |
| `owner_name` | No | max 100 chars |

**Response 201** — `HornetTrap` object, including the generated `access_code`. This is the only response that returns the code — write it down / print it on the physical trap.

---

#### GET `/hornets/traps/nearby`

Find traps within a radius of a GPS point (e.g. "what trap am I standing next to?"). Public — no auth.

| Query param | Required | Constraints |
|-------------|----------|-------------|
| `lat` | Yes | -90 to 90 |
| `lon` | Yes | -180 to 180 |
| `radius_m` | No (default 50) | 1–500 |

**Response 200** — array of up to 20 results, sorted by distance ascending:

```json
[
  {
    "access_code": "A7B2K9XZ",
    "name": "string",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "distance_m": 12,
    "total_caught": 34
  }
]
```

Coordinates here are exact (not fuzzed) — the caller must already be within `radius_m` (max 500m) for a trap to appear, so this only ever confirms a location the caller is already standing at.

---

#### GET `/hornets/traps/geojson`

Returns all traps as a GeoJSON FeatureCollection for map rendering. Public/unauthenticated — coordinates are rounded to 3 decimal places (~111m), same rationale as `GET /hornets/nests` above. `access_code` and `owner_name` are not included.

**Response 200**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [2.352, 48.857] },
      "properties": {
        "access_code": "string",
        "name": "string",
        "total_caught": 34,
        "created_at": "datetime"
      }
    }
  ]
}
```

---

#### GET `/hornets/traps/{access_code}`

Look up a trap by its access code (case-insensitive). Public — this is how someone standing at the physical trap finds it to log a catch.

**Response 200** — `HornetTrap` object.

**Response 404** — `TRAP_NOT_FOUND`

---

#### POST `/hornets/traps/{access_code}/catches`

Log the catch count for one day. Upsert — a second call for the same `caught_on` date overwrites the count rather than adding a new row.

**Request**

```json
{ "count": 3, "caught_on": "2026-07-08" }
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `count` | No (default 1) | 1–500 |
| `caught_on` | Yes | date |

**Response 201** — `HornetTrapCatch` object.

**Response 404** — `TRAP_NOT_FOUND`

---

### HornetTrap object

```json
{
  "id": "uuid",
  "access_code": "string",
  "name": "string",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "notes": "string | null",
  "owner_name": "string | null",
  "created_at": "datetime",
  "total_caught": 34,
  "catches": [ /* array of HornetTrapCatch objects */ ]
}
```

### HornetTrapCatch object

```json
{
  "id": "uuid",
  "trap_id": "uuid",
  "count": 3,
  "caught_on": "date",
  "created_at": "datetime"
}
```

---

## Admin

All endpoints in this section require `Authorization: Bearer <access_token>` for an account with `is_admin = true`. Non-admins receive `403 FORBIDDEN`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/ping` | Health-check — confirms admin access |
| GET | `/admin/users` | Paginated user list with per-user counts |
| GET | `/admin/users/{user_id}` | Single user detail |
| PUT | `/admin/users/{user_id}/supporter` | Grant or revoke supporter status |
| DELETE | `/admin/users/{user_id}` | Permanently delete a user and all their data |
| GET | `/admin/stats` | Platform-wide aggregate stats (with preset filter) |
| GET | `/admin/apiaries` | Paginated list of all public apiaries |
| GET | `/admin/apiaries/flagged` | Apiaries flagged for review |
| PUT | `/admin/apiaries/{apiary_id}/set-private` | Force an apiary to private |
| GET | `/admin/health/summary` | System health summary |
| GET | `/admin/health/inactive-users` | Users with no activity in the last 30 days |
| GET | `/admin/health/no-varroa-inspections` | Apiaries whose hives have never recorded varroa |
| GET | `/admin/health/zero-inspection-hives` | Hives that have never been inspected |
| GET | `/admin/tokens/stats` | Active session counts |
| GET | `/admin/users/{user_id}/tokens` | Active sessions for one user |
| DELETE | `/admin/users/{user_id}/tokens` | Revoke all sessions for one user |
| PUT | `/admin/hornets/sightings/{id}/status` | Override a hornet sighting status |
| POST | `/admin/self-test/error` | Send a deliberate test error to the crash reporter |
| GET | `/admin/health/configuration` | What the running server actually received — environment, signing key, reporting |

---

### GET `/admin/health/configuration`

Reports what the **running process** received, which is not necessarily what the hosting
dashboard shows: a variable that never reaches the function is invisible everywhere else,
because the application keeps working with its default.

**Response 200:**

```json
{
  "environment": "production",
  "signing_key_is_the_public_default": false,
  "crash_reporting_configured": true,
  "push_android_configured": true,
  "push_ios_configured": false
}
```

The two push flags are `true` only when **every** value that channel needs is present —
`FIREBASE_PROJECT_ID` plus the service account JSON for Android, and the key id, team id and
`.p8` for iPhones. Two of three is not configured: APNs refuses a token signed without all
of them. Push is designed to fail quietly, so without this nothing anywhere says that
reminders never leave the building.

`signing_key_is_the_public_default: true` is a security problem, not a note: the default
lives in this repository, so anyone could forge an access token for any account. The
dashboard shows a warning for it. Values are never echoed, only answers about them.

---

### POST `/admin/self-test/error`

Proves that crash reporting is actually wired up, instead of waiting for a real crash to find
out it was not. Raises an error on purpose, reports it, and tells you where it went.

No body. Nothing is written to the database.

**Response 200:**

```json
{
  "reporting_enabled": true,
  "event_id": "708b97e0f3984e2ebe7337c4012eadc7",
  "environment": "production",
  "release": "4e4e0fa",
  "diagnosis": {
    "dsn_characters_in_settings": 97,
    "dsn_characters_in_process_env": 97
  }
}
```

| Field | Meaning |
|-------|---------|
| `reporting_enabled` | `false` when no `SENTRY_DSN` is configured — then nothing was sent and `event_id` is `null` |
| `event_id` | Search for it in Sentry; `null` if the report could not be handed over |
| `environment` | Which environment the report is tagged with (`production`, `staging`, `development`) |
| `release` | The configured release, empty string when unset |

A `reporting_enabled: true` with an `event_id` that never appears in Sentry means the DSN is
syntactically valid but rejected — most often a key and project number that do not belong
together.

`diagnosis` carries lengths, never the value. Both zero means the hosting platform never
passed the variable to the server — on Vercel, a variable only reaches deployments created
after it was saved, and a Secret-type variable is withheld from CLI builds entirely. A
non-zero process value with zero in settings would mean the server received it and failed
to read it, which is a different bug in a different place.

---

### GET `/admin/users`

**Query params:** `q` (email search), `supporter` (bool filter), `page`, `per_page`

**Response 200** — paginated list of `AdminUserOut`:

```json
{
  "items": [
    {
      "id": "uuid",
      "email": "string",
      "name": "string",
      "locale": "en | fr | de | es",
      "is_admin": false,
      "is_supporter": false,
      "created_at": "datetime",
      "apiary_count": 3,
      "hive_count": 12,
      "inspection_count": 87
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

---

### PUT `/admin/users/{user_id}/supporter`

**Request**

```json
{ "is_supporter": true }
```

**Response 200** — `UserOut`

---

### DELETE `/admin/users/{user_id}`

Permanently deletes the user and all their apiaries, hives, and inspections.

**Response 204** No Content

---

### GET `/admin/stats`

**Query params:** `preset` — `30d` (default), `90d`, `365d`, `all`

**Response 200**

```json
{
  "preset": "30d",
  "total_users": 142,
  "new_users_in_period": 18,
  "supporter_count": 23,
  "total_apiaries": 87,
  "public_apiaries": 34,
  "total_hives": 412,
  "total_inspections": 2841,
  "active_users_30d": 61,
  "signups_by_day": [
    { "date": "2026-05-01", "count": 3 }
  ]
}
```

---

### PUT `/admin/hornets/sightings/{id}/status`

**Request**

```json
{ "status": "confirmed" }
```

`status` must be `confirmed` or `rejected`.

**Response 204** No Content

---

## Object Reference

### Enums

| Enum | Values |
|------|--------|
| `locale` | `en`, `fr`, `de`, `es` |
| `hive_type` | `langstroth`, `dadant`, `top_bar`, `warre`, `other` |
| `queen_color` | `white`, `yellow`, `red`, `green`, `blue` |
| `mood` | `calm`, `nervous`, `aggressive` |
| `field_type` | `text`, `number`, `boolean`, `date`, `select` |
| `field_scope` | `user`, `apiary` |
| `field_target` | `hive`, `inspection` |
| `stats_preset` | `30d`, `90d`, `365d`, `all` |
| `nest_status` | `found`, `destruction_ordered`, `destroyed` |
| `sighting_status` | `pending`, `confirmed`, `rejected` |

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Token cannot be verified |
| `FORBIDDEN` | 403 | Resource belongs to another user |
| `USER_NOT_FOUND` | 404 | — |
| `APIARY_NOT_FOUND` | 404 | — |
| `HIVE_NOT_FOUND` | 404 | — |
| `INSPECTION_NOT_FOUND` | 404 | — |
| `FIELD_DEFINITION_NOT_FOUND` | 404 | — |
| `QR_BATCH_NOT_FOUND` | 404 | — |
| `QR_TOKEN_NOT_FOUND` | 404 | Token does not exist in any batch |
| `QR_TOKEN_ALREADY_LINKED` | 409 | Token is already assigned to a hive |
| `APIARY_HAS_HIVES` | 409 | Cannot delete apiary while hives exist |
| `QR_BATCH_IN_USE` | 409 | A code of the batch is attached to a hive |
| `OWNER_ONLY` | 403 | Visible to the caller as a collaborator, but only the owner may do this |
| `SHARE_NOT_FOUND` | 404 | Invitation or share that is not the caller's |
| `SHARE_TOKEN_INVALID` | 404 | Unknown, used or revoked invitation token |
| `SHARE_ALREADY_EXISTS` | 409 | That address already has this invitation or access |
| `SHARE_WITH_SELF` | 400 | The address belongs to the caller |
| `EMAIL_ALREADY_REGISTERED` | 409 | — |
| `VALIDATION_ERROR` | 422 | Request body failed validation (details in `error.fields`) |
| `QR_BATCH_LIMIT_EXCEEDED` | 422 | Requested count > 50 |
| `HORNET_SIGHTING_NOT_FOUND` | 404 | — |
| `HORNET_NEST_NOT_FOUND` | 404 | — |
| `INVALID_VOTE` | 422 | `vote` must be `yes` or `no` |
| `INVALID_SIGHTING_STATUS` | 422 | `status` must be `confirmed` or `rejected` |

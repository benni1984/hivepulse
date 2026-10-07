# HivePulse features

The full list of what HivePulse does today, where to find it, and which document describes it.
The same list is shown to users at `/release-notes` on the website (source: `lib/releaseNotes.ts`), and
the apps open that page from **Settings → Release notes**. Keep the three in step: when a feature ships,
add it to `lib/releaseNotes.ts` (a line in `RELEASES`, and in `FEATURES` if it is new), write or extend its
help page in `app/[locale]/help/[slug]/content/`, add a News entry in `lib/news.ts`, and update this file.

Platforms: **W** website, **I** iPhone app, **A** Android app.

## Apiaries and hives

| Feature | Where | W | I | A | Contract |
|---------|-------|:-:|:-:|:-:|----------|
| Apiaries with name, address or GPS position, description, optional public map entry | Apiary list, apiary page | ✔ | ✔ | ✔ | Apiaries |
| Hives with type (Langstroth, Dadant, Top Bar, Warré, other), acquisition date, notes; made by hand with the amber New Hive button, no sticker needed | Apiary page, hive page | ✔ | ✔ | ✔ | Hives |
| Custom fields for hives and inspections, for the account or one apiary | Settings → custom fields; apiary toolbar | ✔ | ✔ | ✔ | Field definitions |

## QR codes

| Feature | Where | W | I | A | Contract |
|---------|-------|:-:|:-:|:-:|----------|
| Generate batches in advance, print as PDF | QR batches | ✔ | ✔ | ✔ | QR Batches |
| Scan a sticker to open the hive; first scan of a new code sets the hive up | Scan tab | | ✔ | ✔ | QR Batches |
| Delete a batch no hive uses (`409 QR_BATCH_IN_USE` otherwise) | QR batches | ✔ | ✔ | ✔ | QR Batches |

## Inspections

| Feature | Where | W | I | A | Contract |
|---------|-------|:-:|:-:|:-:|----------|
| Record varroa, temper, queen, brood and honey frames, weight, treatments applied, notes | Hive page → new inspection | ✔ | ✔ | ✔ | Inspections |
| Glove-friendly input: large buttons, words instead of numbers | Inspection form | | ✔ | ✔ | |
| Works without a connection; uploaded later (`client_id` makes a repeat harmless) | Both apps | | ✔ | ✔ | Inspections |

## Home screen, treatments and reminders

| Feature | Where | W | I | A | Contract |
|---------|-------|:-:|:-:|:-:|----------|
| Home screen: next inspection, state of the hives, upcoming treatments, optional announcement card | Top of the apiary list / dashboard | ✔ | ✔ | ✔ | Home Summary |
| Planned treatments for a hive or an apiary: plan, mark done, reopen, delete | Hive page; apiary toolbar | ✔ | ✔ | ✔ | Planned Treatments |
| Inspection reminders with interval and season | Settings | ✔ | ✔ | ✔ | Reminders |

The announcement card is text the server sends (`announcement_*` settings); there is no advertising SDK.

## The beekeeping year

| Feature | Where | W | I | A | Contract |
|---------|-------|:-:|:-:|:-:|----------|
| Endless timeline of what to do when (feeding, inspections, swarm control, drone frames, moving and extracting per honey, varroa, winter), in four languages | Dashboard menu; calendar icon in the apiary list toolbar | ✔ | ✔ | ✔ | Beekeeping Year |
| Moved to the beekeeper's place by country and postal code (about 4 days per degree of latitude), adjustable by hand | Profile; Settings → Region | ✔ | ✔ | ✔ | Beekeeping Year |

The content is `backend/app/beekeeping_year.py` (dates for central Germany), the arithmetic `backend/app/season.py`.
Guide values only; medicines subject to the approvals of the country.

## Moving hives

| Feature | Where | W | I | A | Contract |
|---------|-------|:-:|:-:|:-:|----------|
| Move hives between apiaries or to a new place, with day, forage and note | Apiary page / toolbar | ✔ | ✔ | ✔ | Moving Hives |
| History per hive, map of every journey | Hive page; map icon in the apiary list toolbar | ✔ | ✔ | ✔ | Moving Hives |
| "Back to where they came from" shortcut (client-side, from the moves overview) | Move form | ✔ | ✔ | ✔ | |

## Working together

| Feature | Where | W | I | A | Contract |
|---------|-------|:-:|:-:|:-:|----------|
| Invite another beekeeper by e-mail to an apiary or single hives | Apiary or hive → work together | ✔ | ✔ | ✔ | Sharing |
| Accept in the app, on the website, or through the e-mail link | Top of the apiary list; end of the list for a link (Apple/Google sign-in needs none) | ✔ | ✔ | ✔ | Sharing |
| Owner-only: delete, public map, move, invite (`403 OWNER_ONLY`) | | ✔ | ✔ | ✔ | Sharing |

## Statistics, data and community

Per-hive charts, overview of all apiaries, community statistics, JSON/CSV export; the hornet tracker with
reports, community photos, map and named traps. See the help pages `hive-stats`, `community-stats`,
`data-export`, `hornet-tracker`, `hornet-traps`.

## Account

Sign in with e-mail, Apple or Google; English, German, French and Spanish; change password (not for
accounts made through Apple or Google); delete the account and all data (also revokes Apple access);
crash reports to an EU-region Sentry; a guided tour.

## Navigation (the same on iPhone and Android)

Tabs: Apiaries, Scan, Hornets, Members, Settings. Apiary list toolbar: statistics, QR batches, map of
moves, beekeeping year. Every create action is the amber labelled button at the bottom right.
Settings: custom fields, profile, change password, reminders, region, export, admin, help and tour, release
notes, diagnostics, log out, danger zone. See `CLAUDE.md`.

## Wording

German: Bienenstand, Volk, Kontrolle, QR-Batch (Beutentyp for the type of hive). French: rucher, ruche,
visite. Spanish: colmenar, colmena, revisión. Use these in new strings on every surface.

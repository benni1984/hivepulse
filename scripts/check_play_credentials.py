"""Prove the Play service account works, without changing anything.

An upload is a bad way to find out that a key was pasted short or a permission is missing:
Play never accepts the same version code twice, so a failed attempt costs the next number.

This opens an edit session, reads the tracks, and discards the session again. Nothing is
created, nothing is submitted, nothing is reviewed.

    PLAY_SERVICE_ACCOUNT_JSON='<the json>' python scripts/check_play_credentials.py

Needs `google-auth`:  pip install google-auth
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PACKAGE = "com.hivepulse.app"
BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE}"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"


def _token(raw: str) -> tuple[str, str]:
    """An access token for the service account, plus its address for the log."""
    try:
        info = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"PLAY_SERVICE_ACCOUNT_JSON is not valid JSON ({error}). "
            "A truncated paste is the usual cause — it must include both braces."
        )

    for field in ("client_email", "private_key", "token_uri"):
        if field not in info:
            raise SystemExit(f"the key is missing '{field}' — is this the JSON of a service account?")

    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request
    except ImportError:
        raise SystemExit("google-auth is not installed: pip install google-auth requests")

    credentials = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
    credentials.refresh(Request())
    return credentials.token, info["client_email"]


def _call(method: str, path: str, token: str) -> tuple[int, dict]:
    request = urllib.request.Request(
        f"{BASE}{path}", method=method, headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(request) as response:
            body = response.read().decode() or "{}"
            return response.status, json.loads(body)
    except urllib.error.HTTPError as error:
        body = error.read().decode()
        try:
            return error.code, json.loads(body)
        except json.JSONDecodeError:
            return error.code, {"raw": body[:400]}


def main() -> int:
    raw = os.environ.get("PLAY_SERVICE_ACCOUNT_JSON", "").strip()
    if not raw:
        print("PLAY_SERVICE_ACCOUNT_JSON is empty — nothing to check.")
        return 1

    token, email = _token(raw)
    print(f"service account: {email}")

    status, edit = _call("POST", "/edits", token)
    if status != 200:
        message = edit.get("error", {}).get("message", edit)
        print(f"::error::Play refused to open an edit session ({status}): {message}")
        if status == 401:
            print("  401 usually means the Google Play Android Developer API is not enabled.")
        if status == 403:
            print("  403 usually means the service account was not invited in the Play Console,")
            print("  or has no release permission for this app.")
        if status == 404:
            print(f"  404 means Play has no app with the package name {PACKAGE}.")
        return 1

    edit_id = edit["id"]
    print(f"edit session opened: {edit_id}")

    status, tracks = _call("GET", f"/edits/{edit_id}/tracks", token)
    if status == 200:
        names = [t.get("track") for t in tracks.get("tracks", [])]
        print("tracks visible:", ", ".join(n for n in names if n) or "(none yet)")

        # Which version actually sits where. Play's API does not expose whether a release is
        # still in review — only the console shows that — but it does say what Google holds
        # on each track, which answers "did the upload really arrive" on its own.
        print("\nreleases per track:")
        for track in tracks.get("tracks", []):
            releases = track.get("releases") or []
            if not releases:
                print(f"  {track.get('track')}: nothing")
                continue
            for release in releases:
                codes = ", ".join(str(c) for c in release.get("versionCodes", [])) or "no bundle"
                name = release.get("name") or "unnamed"
                fraction = release.get("userFraction")
                rollout = f", rolled out to {fraction:.0%}" if fraction else ""
                print(f"  {track.get('track')}: {name} (code {codes}) "
                      f"— {release.get('status', 'unknown')}{rollout}")
    else:
        print(f"::warning::could not read the tracks ({status}) — release permission may be missing")

    # Discard it, so this check leaves no trace in the console.
    status, _ = _call("DELETE", f"/edits/{edit_id}", token)
    print("edit session discarded" if status in (200, 204) else f"::warning::could not discard the session ({status})")

    print("\nThe service account can reach this app and open a release edit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

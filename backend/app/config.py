from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./HivePulse.db"
    environment: str = "development"  # set to "production" to enable prod-only safety checks/gates
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    admin_email: str = ""
    ci_setup_token: str = ""
    cron_secret: str = ""           # X-Cron-Secret header for POST /notifications/send-reminders
    # Push — Android (FCM HTTP v1). The legacy server key was retired by Google in 2024,
    # so delivery needs a service account; push is skipped while these are empty.
    firebase_project_id: str = ""
    firebase_service_account_json: str = ""
    # Push — iOS (APNs, token based). apns_sandbox routes to Apple's test host, which is
    # what a development build's device token is registered with.
    apns_key_id: str = ""
    apns_team_id: str = ""
    apns_private_key_p8: str = ""
    apns_bundle_id: str = "com.hivepulse.app"
    apns_sandbox: bool = False
    # Social sign-in. Comma-separated audiences — one client ID per platform. A token whose
    # "aud" is not on the list is refused, which is what stops a token minted for an
    # unrelated app by the same provider from working here. Empty means the provider is off.
    google_client_ids: str = ""
    apple_client_ids: str = ""
    # An announcement the home summary can show, as a card marked with its label. Off while the title
    # is empty. No advertising SDK is involved: this is text the server sends.
    announcement_id: str = ""
    announcement_label: str = "Ad"
    announcement_title: str = ""
    announcement_body: str = ""
    announcement_url: str = ""
    # Sign in with Apple, server side: the key that signs our requests to Apple. Needed to
    # revoke a user's tokens when their account is deleted. Inert while empty.
    apple_team_id: str = ""
    apple_key_id: str = ""
    apple_private_key: str = ""
    resend_api_key: str = ""        # Resend API key — reset emails logged to stdout when empty
    app_base_url: str = "https://hivepulse.multihead.de"  # used to build password-reset links
    # Error reporting — see docs/crash-reporting-setup.md. Inert while empty.
    sentry_dsn: str = ""
    release: str = ""              # commit sha, so a report points at the code that failed

    model_config = {"env_file": ".env"}


settings = Settings()

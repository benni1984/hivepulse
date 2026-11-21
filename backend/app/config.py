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
    # Supporter subscriptions (#17). RevenueCat verifies purchases for the App Store, Google
    # Play and the web; it is never asked at request time whether somebody has access -- its
    # webhook writes into `subscriptions`, and that table answers. Empty keys are the normal
    # state in CI and on a development machine: nothing is uploaded, nothing fails.
    revenuecat_api_key: str = ""        # server key, for POST /subscriptions/sync
    revenuecat_webhook_secret: str = "" # the Authorization header RevenueCat is told to send
    revenuecat_entitlement: str = "supporter"
    #: Which RevenueCat environment this deployment believes. "PRODUCTION" or "SANDBOX".
    #:
    #: RevenueCat's webhook configuration offers Production, Sandbox or Both, and **Both is
    #: its default**. A sandbox event accepted by production grants a real entitlement for a
    #: test card. What prevents that today is luck -- a sandbox purchase carries a staging
    #: account's id, and staging has its own database -- and luck stops being a safeguard the
    #: first time two databases share an id (#506).
    #:
    #: Production keeps the default; a staging deployment sets SANDBOX. Deliberately not
    #: derived from `environment` or from the presence of the sandbox purchase token: those
    #: answer other questions, and a check that reads a different signal than the one somebody
    #: set is a check that can disagree with itself.
    #:
    #: The default is the strict position. Forgetting it on staging means sandbox purchases are
    #: ignored there -- visible within a minute of testing, and harmless. The other way round
    #: is neither.
    revenuecat_environment: str = "PRODUCTION"
    #: Whether the website may sell at all. **Off by default, and that is the point** (#530).
    #:
    #: Reaches the browser on `GET /subscriptions/me` as `web_checkout_enabled`, beside the
    #: apps' switch. There is no purchase-link token any more: since #541 the Paddle checkout
    #: runs on our own domain through purchases-js, and the public SDK key is a build value in
    #: the website, not a secret the server hands out.
    #:
    #: A token in the environment used to be enough to put a buy button in front of people, so
    #: selling switched itself on with whatever deploy happened to come next -- including one
    #: about something else entirely. Paddle approves a checkout domain on its own schedule, and
    #: a checkout opened before that approval fails in the customer's face.
    #:
    #: Defaulting to "on unless disabled" would fail open: forget the variable, and the button
    #: appears. This way going live is an act somebody performs, at a moment they chose.
    web_checkout_enabled: bool = False
    #: Whether the **apps** may sell at all. Off by default, for the same reason and with
    #: the same consequence as the line above (#17).
    #:
    #: A build value in the apps would have done the job, and was the wrong answer: it can
    #: only be changed by shipping a new app through review. The store products appear when
    #: Apple and Google approve them, which is not a date anybody controls, and the switch
    #: has to be ready that morning rather than a week later.
    #:
    #: Reaches the apps on `GET /subscriptions/me`, which their paywall already fetches
    #: before it offers anything, so the gate costs no extra request.
    store_checkout_enabled: bool = False
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

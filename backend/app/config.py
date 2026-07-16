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
    firebase_server_key: str = ""   # FCM server key — push delivery stubbed when empty
    resend_api_key: str = ""        # Resend API key — reset emails logged to stdout when empty
    app_base_url: str = "https://hivepulse.multihead.de"  # used to build password-reset links

    model_config = {"env_file": ".env"}


settings = Settings()

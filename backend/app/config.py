from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./HivePulse.db"
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    admin_email: str = ""
    ci_setup_token: str = ""
    cron_secret: str = ""          # X-Cron-Secret header for POST /notifications/send-reminders
    firebase_server_key: str = ""  # FCM server key — push delivery stubbed when empty

    model_config = {"env_file": ".env"}


settings = Settings()

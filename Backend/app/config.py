from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    secret_key: str = "dev-secret"
    aws_region: str = "us-east-1"
    s3_videos_bucket: str = ""
    s3_thumbnails_bucket: str = ""
    access_token_expire_minutes: int = 60 * 24

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
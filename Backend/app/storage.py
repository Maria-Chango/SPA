import uuid

import boto3
from botocore.config import Config

from .config import settings

MAX_VIDEO_BYTES = 100 * 1024 * 1024
MAX_THUMB_BYTES = 5 * 1024 * 1024


def _client():
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        config=Config(signature_version="s3v4"),
    )


def public_url(bucket: str, key: str) -> str:
    return f"https://{bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


def new_key(user_id: int, ext: str) -> str:
    return f"{user_id}/{uuid.uuid4().hex}{ext}"


def presign_upload(bucket: str, key: str, content_type: str, max_bytes: int) -> dict:
    return _client().generate_presigned_post(
        Bucket=bucket,
        Key=key,
        Fields={"Content-Type": content_type},
        Conditions=[
            {"Content-Type": content_type},
            ["content-length-range", 1, max_bytes],
        ],
        ExpiresIn=600,
    )


def delete_by_url(url: str) -> None:
    """Borra el objeto si la URL pertenece a nuestros buckets. Nunca lanza error."""
    try:
        for bucket in (settings.s3_videos_bucket, settings.s3_thumbnails_bucket):
            if not bucket:
                continue
            base = public_url(bucket, "")
            if url.startswith(base):
                _client().delete_object(Bucket=bucket, Key=url[len(base):])
                return
    except Exception:
        pass
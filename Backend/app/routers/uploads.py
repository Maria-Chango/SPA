import os

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException, status

from .. import models, schemas, storage
from ..config import settings
from ..security import get_current_user

router = APIRouter(prefix="/uploads", tags=["Subidas"])

# extensión permitida -> Content-Type que S3 exigirá
VIDEO_TYPES = {".mp4": "video/mp4"}
THUMB_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}


def _presign(bucket: str, allowed: dict, max_bytes: int, filename: str, user: models.User):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Formato no permitido. Usa: {', '.join(allowed)}",
        )
    if not bucket:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Bucket S3 no configurado")

    key = storage.new_key(user.id, ext)
    try:
        post = storage.presign_upload(bucket, key, allowed[ext], max_bytes)
    except (BotoCoreError, ClientError):
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "No hay credenciales AWS disponibles")

    return schemas.UploadOut(
        url=post["url"],
        fields=post["fields"],
        file_url=storage.public_url(bucket, key),
    )


@router.post("/video", response_model=schemas.UploadOut)
def presign_video(data: schemas.UploadRequest, user: models.User = Depends(get_current_user)):
    return _presign(settings.s3_videos_bucket, VIDEO_TYPES, storage.MAX_VIDEO_BYTES, data.filename, user)


@router.post("/thumbnail", response_model=schemas.UploadOut)
def presign_thumbnail(data: schemas.UploadRequest, user: models.User = Depends(get_current_user)):
    return _presign(settings.s3_thumbnails_bucket, THUMB_TYPES, storage.MAX_THUMB_BYTES, data.filename, user)
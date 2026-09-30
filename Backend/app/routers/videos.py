from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from .. import models, schemas, storage

router = APIRouter(tags=["Videos"])


def video_out(v: models.Video) -> schemas.VideoOut:
    return schemas.VideoOut(
        id=v.id,
        title=v.title,
        description=v.description,
        video_url=v.video_url,
        thumbnail_url=v.thumbnail_url,
        views=v.views,
        created_at=v.created_at,
        user_id=v.user_id,
        user_name=v.user.name,
    )


def comment_out(c: models.Comment) -> schemas.CommentOut:
    return schemas.CommentOut(
        id=c.id,
        content=c.content,
        created_at=c.created_at,
        user_id=c.user_id,
        user_name=c.user.name,
        video_id=c.video_id,
    )


def get_video_or_404(db: Session, video_id: int) -> models.Video:
    video = db.get(models.Video, video_id)
    if video is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Video no encontrado")
    return video


@router.post("/videos", response_model=schemas.VideoOut, status_code=status.HTTP_201_CREATED)
def create_video(
    data: schemas.VideoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    video = models.Video(**data.model_dump(), user_id=current_user.id)
    db.add(video)
    db.commit()
    db.refresh(video)
    return video_out(video)


@router.get("/videos", response_model=list[schemas.VideoOut])
def list_videos(
    user_id: int | None = None,
    exclude_id: int | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Catálogo. `user_id` filtra por autor (perfil); `exclude_id` sirve para recomendados."""
    stmt = select(models.Video).options(joinedload(models.Video.user))
    if user_id is not None:
        stmt = stmt.where(models.Video.user_id == user_id)
    if exclude_id is not None:
        stmt = stmt.where(models.Video.id != exclude_id)
    stmt = stmt.order_by(models.Video.created_at.desc()).limit(limit).offset(offset)
    return [video_out(v) for v in db.scalars(stmt).all()]


@router.get("/videos/{video_id}", response_model=schemas.VideoOut)
def get_video(video_id: int, db: Session = Depends(get_db)):
    """Devuelve el video y suma una vista."""
    video = get_video_or_404(db, video_id)
    video.views += 1
    db.commit()
    db.refresh(video)
    return video_out(video)


@router.put("/videos/{video_id}", response_model=schemas.VideoOut)
def update_video(
    video_id: int,
    data: schemas.VideoUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    video = get_video_or_404(db, video_id)
    if video.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No puedes editar este video")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(video, field, value)
    db.commit()
    db.refresh(video)
    return video_out(video)


@router.delete("/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    video = get_video_or_404(db, video_id)
    if video.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No puedes eliminar este video")

    video_url, thumb_url = video.video_url, video.thumbnail_url
    db.delete(video)   # los comentarios se borran en cascada
    db.commit()
    storage.delete_by_url(video_url)
    storage.delete_by_url(thumb_url)


@router.post(
    "/videos/{video_id}/comments",
    response_model=schemas.CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    video_id: int,
    data: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_video_or_404(db, video_id)
    comment = models.Comment(content=data.content, user_id=current_user.id, video_id=video_id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment_out(comment)


@router.get("/videos/{video_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(video_id: int, db: Session = Depends(get_db)):
    get_video_or_404(db, video_id)
    stmt = (
        select(models.Comment)
        .options(joinedload(models.Comment.user))
        .where(models.Comment.video_id == video_id)
        .order_by(models.Comment.created_at.desc())
    )
    return [comment_out(c) for c in db.scalars(stmt).all()]
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    video_count: int = 0


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class VideoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    video_url: str = Field(max_length=500)
    thumbnail_url: str = Field(max_length=500)


class VideoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    thumbnail_url: str | None = Field(default=None, max_length=500)


class VideoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    created_at: datetime
    user_id: int
    user_name: str


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    created_at: datetime
    user_id: int
    user_name: str
    video_id: int


class UploadRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)


class UploadOut(BaseModel):
    url: str                
    fields: dict[str, str]  
    file_url: str            
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import models  # noqa: F401
from .routers import users, videos, uploads



Base.metadata.create_all(bind=engine)

app = FastAPI(title="Video Platform API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://bucket-fronted.s3-website-us-east-1.amazonaws.com",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)

app.include_router(videos.router)
app.include_router(uploads.router)

@app.get("/health")
def health():
    return {"status": "ok"}

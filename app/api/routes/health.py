"""Health: liveness and readiness."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

router = APIRouter()


@router.get("/", summary="Liveness")
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": settings.project_name,
        "environment": settings.env,
    }


@router.get("/ready", summary="Readiness (DB connectivity)")
async def readiness(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "service": settings.project_name,
                "detail": "database",
                "message": str(e),
            },
        )
    return {
        "status": "ok",
        "service": settings.project_name,
        "checks": {"database": "ok"},
    }

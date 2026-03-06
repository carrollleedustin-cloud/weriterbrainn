from fastapi import APIRouter

from app.core.config import settings
from app.api.routes import health, memory, chat, graph, persona, analytics, auth

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(memory.router, prefix="/memories", tags=["memories"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(graph.router, prefix="/graph", tags=["knowledge-graph"])
api_router.include_router(persona.router, prefix="/persona", tags=["persona"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


def get_api_root_router() -> APIRouter:
    root_router = APIRouter()
    root_router.include_router(api_router, prefix=settings.api_v1_prefix)
    return root_router


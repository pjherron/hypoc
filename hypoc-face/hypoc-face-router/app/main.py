"""
hypoc-face-router: Custom four-tier model router.
No LiteLLM. Uses openai SDK (tiers 1-3) and anthropic SDK (tier 4).
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncpg
import redis.asyncio as redis

from .router import route_request, get_tier_health
from .config import settings
from .models import ChatRequest, ChatResponse, UsageReport

app = FastAPI(title="hypoc-face-router", version="0.1.0")

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    tiers = await get_tier_health()
    return {"status": "ok", "tiers": tiers}


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Route a chat request to the cheapest capable model tier.
    Records usage to PostgreSQL for cost tracking.
    """
    return await route_request(req)


# ---------------------------------------------------------------------------
# Usage / cost reporting
# ---------------------------------------------------------------------------

@app.get("/usage/session/{session_id}", response_model=UsageReport)
async def usage_by_session(session_id: str):
    pool = await asyncpg.create_pool(settings.postgres_dsn)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT tier, model, tokens_in, tokens_out, cost_usd, requested_at "
            "FROM model_usage WHERE session_id = $1 ORDER BY requested_at",
            session_id,
        )
    await pool.close()
    return UsageReport(session_id=session_id, rows=[dict(r) for r in rows])


@app.get("/usage/user/{user_id}", response_model=UsageReport)
async def usage_by_user(user_id: str, days: int = 30):
    pool = await asyncpg.create_pool(settings.postgres_dsn)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT tier, model, SUM(tokens_in) as tokens_in, "
            "SUM(tokens_out) as tokens_out, SUM(cost_usd) as cost_usd "
            "FROM model_usage "
            "WHERE user_id = $1 AND requested_at > NOW() - INTERVAL '$2 days' "
            "GROUP BY tier, model ORDER BY cost_usd DESC",
            user_id, days,
        )
    await pool.close()
    return UsageReport(user_id=user_id, rows=[dict(r) for r in rows])

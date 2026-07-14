"""
Routing logic: select cheapest capable tier, call provider, log usage.
"""
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import asyncpg
import redis.asyncio as aioredis

from .config import settings
from .models import ChatRequest, ChatResponse

TIER_CLIENTS = {}  # initialized lazily

TIER_NAMES = {1: "local", 2: "self-hosted", 3: "copilot", 4: "premium"}

# Complexity → minimum tier required
COMPLEXITY_TIER = {
    "low":    1,  # local handles it
    "medium": 2,  # self-hosted or better
    "high":   3,  # Copilot or better
    "max":    4,  # premium only
}


def _openai_client(base_url: str, api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(base_url=base_url, api_key=api_key)


def _anthropic_client() -> AsyncAnthropic:
    return AsyncAnthropic(api_key=settings.anthropic_api_key)


async def get_tier_health() -> dict:
    """Ping each configured tier and return availability."""
    health = {}
    r = aioredis.from_url(settings.redis_url)

    for tier_num, name in TIER_NAMES.items():
        cached = await r.get(f"tier:{tier_num}:health")
        health[name] = cached.decode() if cached else "unknown"

    await r.aclose()
    return health


async def route_request(req: ChatRequest) -> ChatResponse:
    min_tier = COMPLEXITY_TIER.get(req.complexity or "medium", 2)

    # Try tiers in order starting from min_tier
    for tier in range(min_tier, 5):
        try:
            response, model_used = await _call_tier(tier, req)
            await _log_usage(req, tier, model_used, response)
            return ChatResponse(
                content=response,
                tier=tier,
                tier_name=TIER_NAMES[tier],
                model=model_used,
            )
        except Exception:
            continue  # escalate to next tier

    raise Exception("All tiers unavailable")


async def _call_tier(tier: int, req: ChatRequest):
    messages = [{"role": "user", "content": req.prompt}]

    if tier == 1:
        client = _openai_client(settings.ollama_url, "ollama")
        resp = await client.chat.completions.create(
            model=settings.ollama_model, messages=messages
        )
        return resp.choices[0].message.content, settings.ollama_model

    elif tier == 2:
        client = _openai_client(settings.self_hosted_url, settings.self_hosted_api_key)
        resp = await client.chat.completions.create(
            model=settings.self_hosted_model, messages=messages
        )
        return resp.choices[0].message.content, settings.self_hosted_model

    elif tier == 3:
        client = _openai_client(settings.copilot_url, settings.copilot_api_key)
        resp = await client.chat.completions.create(
            model=settings.copilot_model, messages=messages
        )
        return resp.choices[0].message.content, settings.copilot_model

    elif tier == 4:
        client = _anthropic_client()
        resp = await client.messages.create(
            model=settings.premium_model,
            max_tokens=4096,
            messages=messages,
        )
        return resp.content[0].text, settings.premium_model


async def _log_usage(req: ChatRequest, tier: int, model: str, response: str):
    try:
        pool = await asyncpg.create_pool(settings.postgres_dsn)
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO model_usage
                   (session_id, user_id, tier, model, tokens_in, tokens_out, cost_usd)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                req.session_id, req.user_id, tier, model,
                len(req.prompt.split()),       # rough estimate
                len(response.split()),          # rough estimate
                None,                           # cost populated by background job
            )
        await pool.close()
    except Exception:
        pass  # logging failure must never break the request

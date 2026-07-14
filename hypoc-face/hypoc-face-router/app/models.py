from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    complexity: Optional[str] = "medium"  # low|medium|high|max
    tier_hint: Optional[int] = None       # force a specific tier (power-user override)


class ChatResponse(BaseModel):
    content: str
    tier: int
    tier_name: str
    model: str


class UsageRow(BaseModel):
    tier: Optional[int] = None
    model: Optional[str] = None
    tokens_in: Optional[int] = None
    tokens_out: Optional[int] = None
    cost_usd: Optional[float] = None


class UsageReport(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    rows: List[dict] = []

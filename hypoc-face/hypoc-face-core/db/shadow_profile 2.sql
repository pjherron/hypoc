-- Shadow Profile: per-user learned skill and agent preferences
-- Populated automatically by observing session behavior. Never manually curated.

CREATE TABLE IF NOT EXISTS user_shadow_profile (
    id               SERIAL PRIMARY KEY,
    user_id          TEXT NOT NULL,
    skill_name       TEXT NOT NULL,
    invocation_count INTEGER DEFAULT 0,
    decline_count    INTEGER DEFAULT 0,
    last_used_at     TIMESTAMPTZ,
    avg_complexity   TEXT,            -- low|medium|high|max
    project_scope    TEXT,            -- NULL = global, else project path
    UNIQUE (user_id, skill_name, project_scope)
);

-- Model usage: every routed request logged here for cost tracking
CREATE TABLE IF NOT EXISTS model_usage (
    id              SERIAL PRIMARY KEY,
    session_id      TEXT NOT NULL,
    user_id         TEXT,
    tier            INTEGER NOT NULL, -- 1=local, 2=self-hosted, 3=copilot, 4=premium
    model           TEXT NOT NULL,
    tokens_in       INTEGER,
    tokens_out      INTEGER,
    cost_usd        NUMERIC(10,6),
    requested_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON user_shadow_profile (user_id, project_scope);
CREATE INDEX ON model_usage (session_id);
CREATE INDEX ON model_usage (user_id, requested_at DESC);

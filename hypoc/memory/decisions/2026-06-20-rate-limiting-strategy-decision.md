---
type: decision
source-session: ses_jun_rate_0009
date: 2026-06-20
topics: ["rate limiting", "API management", "token bucket", "tenant quotas"]
title: "Rate Limiting Strategy Decision"
---

# Rate Limiting Strategy Decision

## Decision

The team decided to implement a token bucket rate limiter scoped per tenant, with a small shared burst pool for the API as a whole.

## Rationale

The token bucket approach smooths traffic bursts without penalizing long-running tenants. Per-tenant quotas remain cheap and predictable to reason about, and refill math is trivial.
## Alternatives considered

- fixed window counters
- sliding window logs
- global per-IP limits

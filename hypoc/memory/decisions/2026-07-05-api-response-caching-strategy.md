---
type: decision
source-session: ses_jul_cache_0011
date: 2026-07-05
topics: ["API Caching", "Write-Through Cache", "TTLs", "Cache Stampede"]
title: "API Response Caching Strategy"
---

# API Response Caching Strategy

## Decision

The team decided to implement an application-level write-through cache with per-resource TTLs and a small stamped lock.

## Rationale

This approach provides exact invalidation on writes, bounded staleness per resource, and the stampede lock prevents thundering herds from hitting the origin.
## Alternatives considered

- relying on a reverse proxy cache
- pure client-side caching

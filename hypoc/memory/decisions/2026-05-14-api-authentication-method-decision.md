---
type: decision
source-session: ses_may_auth_0001
date: 2026-05-14
topics: ["API Authentication", "JWT Tokens", "Refresh Tokens", "Stateless Verification"]
title: "API Authentication Method Decision"
---

# API Authentication Method Decision

## Decision

The team decided to implement JWT access tokens with a sliding refresh-token flow for user authentication.

## Rationale

This approach allows stateless verification for the API, uses short-lived access tokens expiring in thirty minutes, rotates refresh tokens on every use, and revokes them at refresh time.
## Alternatives considered

- opaque session tokens
- long-lived JWTs without refresh

---
type: decision
source-session: ses_jul_data_0003
date: 2026-07-02
topics: ["event storage", "PostgreSQL", "JSONB columns", "infrastructure"]
title: "Event Stream Storage Decision"
---

# Event Stream Storage Decision

## Decision

The team decided to use PostgreSQL with JSONB columns for storing the event stream.

## Rationale

This decision was made because it allows transactional writes next to the existing relational schema and avoids additional infrastructure to operate.
## Alternatives considered

- a dedicated event bus such as Kafka
- a separate document store

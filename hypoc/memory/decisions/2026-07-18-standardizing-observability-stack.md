---
type: decision
source-session: ses_jul_obs_0004
date: 2026-07-18
topics: ["observability", "OpenTelemetry", "Grafana", "APM"]
title: "Standardizing Observability Stack"
---

# Standardizing Observability Stack

## Decision

The team decided to standardize on shipping OpenTelemetry traces and metrics into Grafana.

## Rationale

Vendor-neutral SDKs with a single dashboard for traces, logs, and metrics.
## Alternatives considered

- A commercial APM vendor
- A Prometheus-only stack without tracing

---
type: decision
source-session: ses_jun_deploy_0002
date: 2026-06-09
topics: ["deployment strategy", "Kubernetes", "production release", "zero downtime"]
title: "Web Service Deployment Strategy"
---

# Web Service Deployment Strategy

## Decision

The team decided to ship blue-green deploys to the Kubernetes cluster.

## Rationale

Zero-downtime cutovers and instant rollback by flipping traffic back to the previous color.
## Alternatives considered

- rolling updates
- canary deploys

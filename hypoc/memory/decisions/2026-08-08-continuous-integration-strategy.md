---
type: decision
source-session: ses_aug_ci_0006
date: 2026-08-08
topics: ["continuous integration", "GitHub Actions", "runtime versions"]
title: "Continuous Integration Strategy"
---

# Continuous Integration Strategy

## Decision

The team decided to use a GitHub Actions matrix across the supported runtime versions for continuous integration.

## Rationale

This approach provides parallel coverage of every supported version without duplicating workflow files.
## Alternatives considered

- a single combined job
- a self-hosted runner

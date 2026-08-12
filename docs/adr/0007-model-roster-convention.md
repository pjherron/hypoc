# ADR 0007 — Model Roster Convention

**Status**: Accepted
**Date**: 2026-08-12

## Context

Every hypoc deployment must answer "which model runs where?" Without a
convention, each adopter accumulates an untracked pile of ollama tags: models
that were never pulled, models that are broken on a given OS, models that are
wrong for agentic work, and models whose hosting jurisdiction was never
considered. Downstreams (e.g. bmxoc) need a shape for their concrete rosters;
hypoc needs that shape to live here, once, so downstreams instantiate rather
than invent.

ADR 0002 settled *routing* (deployment tiers: local → self-hosted → Copilot →
premium, cheapest-capable-first). It did not settle *which models fill those
tiers* or how that choice is reviewed and recorded.

## Decision

Hypoc defines a **roster convention**; concrete rosters live downstream.

1. **Router spine, not size tiers.** A roster is keyed by the router's
   deployment tiers (ADR 0002). Size subdivisions exist only *inside* `local`,
   expressed as machine RAM classes (e.g. 6GB / 16GB / 32GB / 64GB+).
2. **One primary per slot.** Each slot names exactly one primary model and at
   most one documented fallback. If a candidate can't displace the primary, it
   goes on a dated monitor list or the excluded list — with a reason. Roster
   bloat is a defect.
3. **Capability ceilings + escalation advisory.** Every slot declares what it
   cannot do. When a task exceeds a slot's ceiling, the platform RECOMMENDS an
   external larger model (self-hosted or premium) — advisory only, never
   forced, because small tiers are sometimes the only option (offline, policy,
   or constrained work machines).
4. **Sizing rule.** Modelfile ≤ ~60% of machine RAM (modelfile + KV cache +
   OS/agent overhead must coexist). A "<N GB modelfile" tier is meaningless
   without stating the machine class it serves.
5. **Jurisdiction axes.** Record vendor origin *and* hosting location *and*
   data retention separately. Policy is expressed per axis (e.g. "CN-hosted
   endpoints excluded; CN-vendor local weights allowed; CN-vendor via
   0-day-retention US hosts allowed, non-default").
6. **Review method.** Roster changes go through the `model-roster-review`
   skill: registry verification, agentic benchmarks (SWE-bench Verified,
   Terminal-Bench, Tau2, NL2Repo), hardware fit, jurisdiction check,
   known-broken sweep, and a keep/drop/monitor disposition for every incumbent.

## Consequences

- Concrete rosters live in downstream distribution repos (typically private).
  Their policy values are the org's own; their shape is this ADR's.
- The escalation-advisory is platform policy today; emitting it from
  `hypoc-face-router` is implementation work that lands when the rebuilt
  router is upstreamed. When it lands, its placeholder tier models
  (`llama3`, `mistral`, `gpt-4o`) must be replaced by roster-driven config.
- Benchmarks in rosters are vendor/lab-reported and dated; cross-lab deltas
  under ~3 points are treated as noise, and self-published comparisons trigger
  an eval period before a primary is considered settled.
- New local models are evaluated against the slot primary, not added alongside
  it — this is the enforcement mechanism for rule 2.

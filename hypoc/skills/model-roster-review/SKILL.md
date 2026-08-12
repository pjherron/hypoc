---
name: model-roster-review
description: Review or build a model roster for agentic development. Use when choosing which models fill routing tiers, auditing an existing ollama/OpenCode model list, refreshing stale picks, or evaluating a newly released model against the current roster. Follows ADR 0006.
origin: Hypoc
---

# Model Roster Review

Produce or update a roster that conforms to ADR 0006 (router spine, one primary
per slot, capability ceilings, jurisdiction axes, monitor/excluded lists).

## When to Use

- Building a downstream's roster for the first time
- Auditing an existing config: unused, broken, or agentic-weak entries
- A notable model drops and someone asks "should this be in the roster?"
- Periodic refresh (benchmarks and macOS/ollama compatibility move fast)

## Inputs to Collect First

- The current model config (e.g. `opencode.json` provider block) AND what is
  actually pulled (`ollama list`) — the diff is usually instructive.
- The fleet's hardware classes (RAM per machine, dedicated VRAM or not).
- The org's central tasks (picks are workload-specific; a SAS→Python migration
  shop and a frontend shop choose differently).
- The org's jurisdiction policy per axis: vendor origin / hosting / retention.

## Method

1. **Reality check.** For every configured model: does it exist in the
   registry? Is it pulled? Does it need a minimum ollama version? Configured-
   but-not-pulled and pulled-but-broken both go on the list with the reason.
2. **Agentic evidence.** Rank candidates by agentic benchmarks, in this order
   of relevance: SWE-bench Verified, Terminal-Bench, Tau2 (tool-calling
   reliability), NL2Repo (repo-scale). General benchmarks (MMLU, LCB) are
   tiebreakers only — they do not predict tool-loop discipline. Prefer
   third-party evals; flag self-published comparisons for an eval period.
3. **Hardware fit.** Modelfile ≤ ~60% of the target machine's RAM. Assign each
   survivor to its machine class; a model that fits no class well is excluded
   even if it's good (e.g. 13GB on a 6/16/32GB fleet).
4. **Jurisdiction check.** Record vendor origin, hosting location, retention.
   Local weights: data never leaves the machine regardless of vendor. Hosted:
   apply the org's policy per axis. Never bury this in prose — it belongs in
   structured fields.
5. **Known-broken sweep.** Check the model's registry page for issue banners
   (e.g. "investigating an issue on macOS/Metal"). Broken-but-promising goes to
   `monitor` with the date and re-evaluation trigger — never silently dropped,
   never rostered.
6. **Slot assignment.** One primary per slot, at most one fallback. Every
   incumbent gets a written disposition: keep / drop / monitor. New candidates
   must displace the primary on evidence, or they are excluded with a reason.

## Output Shape

Machine-readable roster (JSON) keyed by router tier, plus a short narrative
doc: decisions locked with rationale, the slot table, dispositions, sources
with fetch dates. See bmxoc `models/roster.json` for the reference instance.

## Rules

- Dates on everything: benchmarks rot; write "as of" dates next to scores.
- Cross-lab benchmark deltas under ~3 points are noise; don't churn primaries
  over noise.
- "Bigger is better" is usually false past the workhorse class: dense 70B
  loses to 30–35B MoEs on speed AND on agentic benches. Spend headroom on
  context and parallelism, not parameters.
- Coding-irrelevant models (omni/document-intelligence, e.g. Nemotron Omni)
  are excluded no matter how good their scores look.
- The roster is policy + evidence, not aspiration: every entry must run today
  on the stated hardware class.

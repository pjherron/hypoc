---
name: sas-migration
description: Migrate SAS programs to Python, Java, or Postgres equivalents with operational fidelity as the acceptance criterion. Handles audit checkpoints, conclusionary reports, and effort tracking for cost estimation.
origin: Platform
---

# SAS Migration

Migrate legacy SAS programs to modern equivalents (Python, Java, Postgres) while preserving operational fidelity — not byte-for-bit output parity, but correct behavior in production.

## Domain Context

Load `CONTEXT.md` at session start for pharma QC domain terms. Key terms:
- **Operational fidelity** — the acceptance criterion. Migrated system does the same job, reports are correct, QC checkpoints are trustworthy.
- **Conclusionary report** — terminal, manager-facing output.
- **Audit checkpoint** — intermediate extraction point used to QC the monitored system. Many per program.
- **Pilot migration** — 3 programs being migrated as real working examples to calibrate cost estimation for 33 remaining.

## Migration Workflow

### 1. Inventory the SAS program
- Map all DATA steps, PROC steps, macro calls, and library references
- Identify all output points: conclusionary reports and audit checkpoints
- Document data types, formats, and any SAS-specific behaviors (missing value handling, sorting defaults, date formats)

### 2. Map to target language
- SAS DATA step → Python (pandas/polars) or Java
- PROC SQL → Postgres query or SQLAlchemy
- SAS formats/informats → Python equivalents, with notes on divergence
- Macros → Python functions or parameterized queries
- Note anywhere Python/Java behavior differs from SAS — these are fidelity risks

### 3. Preserve audit checkpoints
- Each checkpoint in the SAS program must have a named equivalent in the migrated code
- Checkpoint outputs must be extractable at the same logical point in the pipeline
- Document the checkpoint map: `SAS checkpoint name → migrated equivalent → extraction method`

### 4. Verify operational fidelity
- Run both SAS and migrated versions on the same input data
- Compare conclusionary report outputs — flag divergences
- Spot-check audit checkpoint outputs at key extraction points
- Document any intentional divergences (where SAS behavior was wrong or obsolete)

### 5. Track effort
- Log time per migration phase: inventory, mapping, implementation, verification
- Note complexity signals: macro count, external library dependencies, checkpoint count, data volume
- Feed into the cost re-estimation model for remaining 33 programs

## Output Artifacts

Per migrated program:
- Migrated source code (Python / Java / SQL)
- Checkpoint map (SAS → migrated)
- Fidelity notes (where behavior differs and why)
- Effort log (hours per phase)
- Test results (input/output comparison summary)

## Activation

Use when starting a SAS migration session. Works alongside `domain-modeling` (to maintain the pharma QC glossary) and `verification-loop` (to confirm fidelity before sign-off).

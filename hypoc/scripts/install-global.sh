#!/usr/bin/env bash
# Wire hypoc into the global opencode config so its skills/agents work in ANY project.
# Idempotent — safe to re-run (e.g. after moving the hypoc checkout).
set -euo pipefail
HYPOC_HOME="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$HOME/.config/opencode/opencode.json"
python3 - "$HYPOC_HOME" "$CONFIG" <<'PY'
import json, sys
hypoc, config = sys.argv[1], sys.argv[2]
cfg = json.load(open(config))
skills = ["bootstrap", "skill-invoke", "session-recruitment", "skill-recruitment"]
wanted = [f"{hypoc}/skills/{s}/SKILL.md" for s in skills]
# drop any stale hypoc entries (old paths), then add current ones
ins = [i for i in cfg.get("instructions", []) if "/skills/" not in i or not any(i.endswith(f"/{s}/SKILL.md") for s in skills)]
pointer = config.rsplit("/",1)[0] + "/hypoc-home.md"
open(pointer, "w").write(f"""# Hypoc Library Location

HYPOC_HOME={hypoc}

The hypoc skill library is at `{hypoc}/skills/` and agents at `{hypoc}/agents/`.
Wherever a hypoc skill references `${{WORKSPACE_DIR}}/hypoc/skills/...` or a relative
`skills/...` path, resolve it against HYPOC_HOME, i.e. `{hypoc}/skills/...`.
Recruit skills from HYPOC_HOME regardless of the current project directory.
Do NOT scan or read the hypoc repository itself unless the user is working on hypoc.
""")
ins = [i for i in ins if not i.endswith("/hypoc-home.md")]
cfg["instructions"] = [pointer] + ins + wanted
json.dump(cfg, open(config, "w"), indent=2)
print(f"hypoc wired globally from {hypoc}")
PY

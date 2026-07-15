#!/usr/bin/env bash
# Sync locally installed Ollama models into the opencode global config.
# Run after `ollama pull <model>` to make the new model available in opencode.

set -euo pipefail

OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"

if ! curl -sf "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
  echo "Error: Ollama not reachable at $OLLAMA_URL" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 required" >&2
  exit 1
fi

python3 - "$OPENCODE_CONFIG" "$OLLAMA_URL" <<'PYEOF'
import sys, json, urllib.request

config_path = sys.argv[1]
ollama_url  = sys.argv[2]

# Fetch models from Ollama
with urllib.request.urlopen(f"{ollama_url}/api/tags") as r:
    models = json.load(r)["models"]

# Context window heuristics by parameter size
def limits(param_size: str, is_cloud: bool):
    ctx = 262144 if is_cloud else 128000
    p = param_size.replace("B","")
    try:
        n = float(p)
        if n <= 10:
            ctx = min(ctx, 32000)
        elif n <= 50:
            ctx = min(ctx, 64000)
    except ValueError:
        pass
    out = 32768 if is_cloud else 8192
    return {"context": ctx, "output": out}

# Models known to lack tool/function calling support
NO_TOOLS = {"llama2", "mixtral", "mistral"}

def supports_tools(name: str) -> bool:
    base = name.split(":")[0].split("/")[-1]
    return base not in NO_TOOLS

def fmt_size(bytes):
    gb = bytes / 1024 / 1024 / 1024
    if gb >= 1:
        return f"{gb:.0f}GB"
    mb = bytes / 1024 / 1024
    return f"{mb:.0f}MB"

# Build models dict — skip models that don't support tool/function calling
new_models = {}
skipped = []
for m in models:
    name = m["name"]
    if not supports_tools(name):
        skipped.append(name)
        continue
    is_cloud = name.endswith(":cloud") or name.endswith("-cloud")
    size_bytes = m.get("size", 0)
    suffix = "cloud" if is_cloud else fmt_size(size_bytes)
    display = f"{name} ({suffix})"
    new_models[name] = {
        "_launch": True,
        "name": display,
        "limit": limits(m["details"].get("parameter_size","70B"), is_cloud)
    }

# Load and update config
with open(config_path) as f:
    cfg = json.load(f)

cfg.setdefault("provider", {}).setdefault("ollama", {})["models"] = new_models

with open(config_path, "w") as f:
    json.dump(cfg, f, indent=2)

print(f"Synced {len(new_models)} Ollama models to {config_path}")
for name, entry in sorted(new_models.items()):
    print(f"  {entry['name']}")
if skipped:
    print(f"Skipped {len(skipped)} tool-incompatible model(s): {', '.join(skipped)}")
PYEOF

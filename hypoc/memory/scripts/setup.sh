#!/usr/bin/env bash
# Bootstrap the mnemonic spine's infrastructure and validate config.
#  1. Ollama: embedder model (nomic-embed-text) + distill cheap tier (qwen3.5:latest)
#  2. Qdrant: reachable at localhost:6333 (static binary under .swarm/qdrant/)
#  3. Config: YAML validates
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Ollama"
if ! curl -sf -m 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "ERROR: Ollama is not running at localhost:11434." >&2
  exit 1
fi
models="$(ollama list 2>/dev/null || true)"
for model in "nomic-embed-text" "qwen3.5:latest"; do
  if ! grep -q "$model" <<<"$models"; then
    echo "ERROR: Ollama model '$model' missing. Run: ollama pull $model" >&2
    exit 1
  fi
done
echo "    models present: nomic-embed-text, qwen3.5:latest"

echo "==> Qdrant"
if curl -sf -m 3 http://localhost:6333/ >/dev/null 2>&1; then
  echo "    reachable at localhost:6333"
else
  echo "    not running. Launch with:"
  echo "      REPO=$(git -C "$ROOT_DIR" rev-parse --show-toplevel 2>/dev/null || echo '<repo root>')"
  echo "      (cd \$REPO/.swarm/qdrant && ./run-qdrant.sh &)"
  exit 1
fi

echo "==> Config"
if command -v bun >/dev/null 2>&1; then
  bun -e "import('./lib/config.js').then(async (m) => { await m.loadConfig(); console.log('    config OK.'); })"
else
  echo "    bun not found; skipping config validation." >&2
fi

echo "==> Ready. Run: bun bin/consolidate.js (distill->commit->embed->index), then bun bin/recall.js \"<query>\""

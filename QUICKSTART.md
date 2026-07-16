# Quickstart

## Prerequisites

- [Ollama](https://ollama.com) with at least one tool-capable model pulled (see below)
- [opencode](https://opencode.ai) — `curl -fsSL https://opencode.ai/install | sh`

## 1. Clone

```bash
git clone git@github.com:pjherron/hypoc.git
cd hypoc/hypoc
```

## 2. Register your Ollama models

```bash
./scripts/sync-ollama-models.sh
```

Queries the local Ollama API and writes `~/.config/opencode/opencode.json` — tool-incompatible
models are excluded, file sizes shown next to each name. Re-run after any `ollama pull`.

## 3. Start opencode

**Terminal (primary):**
```bash
opencode
```

**Browser UI (built in):**
```bash
opencode web
```

On first session the bootstrap skill fires automatically. Describe what you want in plain
English — no skill names needed.

---

## Ollama models

```bash
ollama pull llama3.3:70b-instruct-q4_K_M   # best quality (42GB)
ollama pull phi4                           # fast / lightweight (9GB)
```

Note: models without function/tool calling (llama2, mistral, mixtral, deepseek-r1) do not
work with opencode and are excluded by the sync script automatically.

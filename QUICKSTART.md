# Quickstart

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Ollama](https://ollama.com) with `llama3.3:70b-instruct-q4_K_M` pulled
- [opencode](https://opencode.ai) (`curl -fsSL https://opencode.ai/install | sh`)
- [Bun](https://bun.sh) for local UI development

## 1. Clone

```bash
git clone git@github.com:pjherron/hypoc.git
cd hypoc
```

## 2. Configure environment

```bash
cp hypoc-face/hypoc-face-core/.env.example hypoc-face/hypoc-face-core/.env
cp hypoc-face/hypoc-face-router/.env.example hypoc-face/hypoc-face-router/.env
```

The defaults use Ollama on `localhost:11434`. No API keys needed for local mode.

## 3. Start services

```bash
docker compose up -d
```

This starts:
| Service | Port | What it does |
|---|---|---|
| postgres | 5433 | Database |
| redis | 6379 | Cache / queues |
| hypoc-face-core | 8002 | REST API, auth, cost tracking |
| hypoc-face-router | 8001 | 4-tier model routing (Ollama → cloud fallback) |
| hypoc-face-ui | 3000 | Browser UI (Chat, Cost Dashboard, Skill Log) |

Check everything is up:
```bash
docker compose ps
```

## 4. Open the UI

```bash
open http://localhost:3000
```

## 5. Start the CLI (opencode)

```bash
cd hypoc
opencode
```

On first session the bootstrap skill fires automatically. Describe what you want in plain English.

---

## Local UI development

```bash
cd hypoc-face/hypoc-face-ui
bun install
bun --bun run dev     # http://localhost:5173 with hot reload
```

## Pull a different Ollama model

```bash
ollama pull phi4          # fast / lightweight (14B)
ollama pull llama3.3:70b-instruct-q4_K_M   # default (70B, best quality)
```

Update `OLLAMA_MODEL` in `hypoc-face/hypoc-face-router/.env` to switch.

## Logs

```bash
docker compose logs -f hypoc-face-core
docker compose logs -f hypoc-face-router
```

## Stop everything

```bash
docker compose down
```

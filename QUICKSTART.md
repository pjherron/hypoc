# Quickstart

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Ollama](https://ollama.com) with a model pulled (see below)
- [opencode](https://opencode.ai) — `curl -fsSL https://opencode.ai/install | sh`

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

Defaults use Ollama on `localhost:11434`. No API keys needed for local mode.

## 3. Start backend services

```bash
docker compose up -d
```

| Service | Port | What it does |
|---|---|---|
| postgres | 5433 | Database (cost tracking, user profiles, session metadata) |
| redis | 6379 | Cache / queues |
| hypoc-face-core | 8002 | REST API — RBAC, cost tracking, audit logs |
| hypoc-face-router | 8001 | 4-tier model routing (Ollama → cloud fallback) |

## 4. Start opencode

**Terminal (primary):**
```bash
cd hypoc
opencode
```

**Browser UI** (opencode's built-in web interface):
```bash
cd hypoc
opencode web
```

On first session the bootstrap skill fires automatically. Describe what you want in plain English — no skill names needed.

---

## Ollama models

```bash
ollama pull llama3.3:70b-instruct-q4_K_M   # best quality (42GB)
ollama pull phi4                             # fast / lightweight (9GB)
```

Update `OLLAMA_MODEL` in `hypoc-face/hypoc-face-router/.env` to switch.

## Logs

```bash
docker compose logs -f hypoc-face-core
docker compose logs -f hypoc-face-router
```

## Stop

```bash
docker compose down
```

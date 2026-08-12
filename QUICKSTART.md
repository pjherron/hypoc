# Quickstart

Get hypoc running on top of your existing opencode install. ~5 minutes.

## Prerequisites

- [opencode](https://opencode.ai) — `curl -fsSL https://opencode.ai/install | sh`
- macOS: [Homebrew](https://brew.sh) (used to install Ollama). Linux: nothing extra.

Everything else — Ollama, Qdrant, the required models — is installed by `./bin/install`.

## 1. Clone

```bash
git clone git@github.com:pjherron/hypoc.git
cd hypoc/hypoc
```

## 2. Install

```bash
./bin/install
```

Installs the `hypoc` command, Ollama and Qdrant if missing, pulls the models the
workspace needs (`llama3.1:8b`, `phi4`, `nomic-embed-text`), and puts `~/.local/bin`
on your PATH. Then registers your Ollama models:

```bash
./scripts/sync-ollama-models.sh
```

Re-run the sync script after any `ollama pull`.

## 3. Start

```bash
hypoc            # terminal (primary)
hypoc web        # browser UI (built into opencode)
```

`hypoc` runs opencode with the hypoc workspace configuration — same binary, hypoc surface.
It also starts Ollama and Qdrant if they're not already running. On first session the
bootstrap skill fires automatically; describe what you want in plain English — no skill
names needed.

---

## What gets installed on your machine (on top of vanilla opencode)

| Change | Where | Why |
|---|---|---|
| `hypoc` launcher | `~/.local/bin/hypoc` (symlink) | Single entry point |
| PATH entry | `~/.zshrc` / `~/.bashrc` / `~/.bash_profile` | So `hypoc` resolves |
| Ollama | Homebrew cask (macOS) / `ollama.com` script (Linux) | Local model runtime |
| Ollama models | `llama3.1:8b`, `phi4:latest`, `nomic-embed-text` (~14GB) | Default model, build/distill, embeddings |
| Qdrant binary | `hypoc/hypoc/.swarm/qdrant/` (repo-local) | Memory brain store |
| Ollama model registration | `~/.config/opencode/opencode.json` | opencode sees your local models |
| Workspace config, skills, agents | the cloned repo (`hypoc/hypoc/`) | The hypoc surface |
| Plugins (fetched by opencode on first run) | npm: `ecc-universal`; git: `superpowers` | Model router + skill conventions |
| Memory module state | repo: `memory/decisions/` (git-committed), Qdrant collection, `memory/.sweep-state.json` | Decision recall |

The memory module, when enabled, **writes git commits** (decision artifacts) into the repo
and **injects recalled decisions into new sessions** automatically (warm-start). Everything
stays local: Ollama + Qdrant, no cloud calls.

## Uninstall

```bash
rm ~/.local/bin/hypoc           # remove launcher
# remove the PATH line from your shell rc if you don't want it
rm -rf hypoc                    # delete the clone (includes the repo-local Qdrant + its data)
```

Vanilla opencode and your global config keep working; the model registrations in
`~/.config/opencode/opencode.json` are plain provider entries you can leave or delete.
Ollama itself (and the pulled models) is a normal Ollama install — remove with
`brew uninstall --cask ollama` (macOS) if you don't want it.

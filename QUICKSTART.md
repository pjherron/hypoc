# Quickstart

Get hypoc running on top of your existing opencode install. ~5 minutes.

## Prerequisites

- [opencode](https://opencode.ai) — `curl -fsSL https://opencode.ai/install | sh`
- [Ollama](https://ollama.com) with at least one tool-capable model:
  ```bash
  ollama pull llama3.3:70b-instruct-q4_K_M   # best quality (42GB)
  ollama pull phi4                           # fast / lightweight (9GB)
  ```
- [Qdrant](https://qdrant.tech) on `localhost:6333` — only needed for the memory module
  (warm-start recall). The rest of hypoc works without it.

You don't need to start these by hand: the `hypoc` launcher starts Ollama and Qdrant if
they're not already running, and warns if it can't.

## 1. Clone

```bash
git clone git@github.com:pjherron/hypoc.git
cd hypoc/hypoc
```

## 2. Install the `hypoc` command

```bash
./bin/install
```

Adds a `hypoc` symlink in `~/.local/bin` (and that dir to your PATH if needed).

## 3. Register your Ollama models

```bash
./scripts/sync-ollama-models.sh
```

Writes your model list into `~/.config/opencode/opencode.json`. Re-run after any `ollama pull`.

## 4. Start

```bash
hypoc            # terminal (primary)
hypoc web        # browser UI (built into opencode)
```

`hypoc` runs opencode with the hypoc workspace configuration — same binary, hypoc surface.
On first session the bootstrap skill fires automatically; describe what you want in plain
English — no skill names needed.

---

## What gets installed on your machine (on top of vanilla opencode)

| Change | Where | Why |
|---|---|---|
| `hypoc` launcher | `~/.local/bin/hypoc` (symlink) | Single entry point |
| PATH entry | `~/.zshrc` / `~/.bashrc` / `~/.bash_profile` | So `hypoc` resolves |
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
rm -rf hypoc                    # delete the clone
```

Vanilla opencode and your global config keep working; the model registrations in
`~/.config/opencode/opencode.json` are plain provider entries you can leave or delete.

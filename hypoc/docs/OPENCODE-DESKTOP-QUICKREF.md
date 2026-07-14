# OpenCode Desktop - Quick Reference

## One-Line Commands

```bash
# Start
bash scripts/desktop/start.sh

# Enter
bash scripts/desktop/shell.sh

# Stop
bash scripts/desktop/stop.sh
```

## What's Inside

✅ Ubuntu 22.04  
✅ Node.js 22 LTS  
✅ Python 3.12  
✅ Git + SSH  
✅ Security tools (gitleaks, semgrep, snyk)  
✅ OpenCode + ECC plugins  
✅ Your workspace (live-mounted)  

## Common Tasks

```bash
# Security audit
docker exec opencode-desktop bash scripts/security/audit.sh

# Run tests
docker exec opencode-desktop npm test

# Git operations
docker exec opencode-desktop git status

# Install dependencies
docker exec opencode-desktop npm install
```

## File Locations (Inside Container)

- **Your code**: `/workspace`
- **Git config**: `/home/developer/.gitconfig`
- **SSH keys**: `/home/developer/.ssh`
- **OpenCode config**: `/home/developer/.opencode`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Docker not running | Start Docker Desktop |
| Container not found | `bash scripts/desktop/start.sh` |
| Permission errors | Container uses your host UID |
| Out of space | `docker system prune -a` |

---

**Full docs**: `docs/OPENCODE-DESKTOP.md`

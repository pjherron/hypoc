# OpenCode Desktop - Containerized Environment

Run your complete OpenCode development environment in a Docker container with all tools pre-installed.

## 🎯 What You Get

- **Ubuntu 22.04** base image
- **Node.js 22 LTS** with npm
- **Python 3.12** with pip
- **Security tools** pre-installed (gitleaks, semgrep, snyk)
- **OpenCode** and ECC plugins
- **Your workspace** mounted for live editing
- **Persistent caches** for npm, pip, and command history
- **Git configuration** from your host
- **SSH keys** mounted for GitLab/GitHub access

## 🚀 Quick Start

### 1. Start OpenCode Desktop

```bash
bash scripts/desktop/start.sh
```

This will:
- Build the Docker image (first time only, ~5 minutes)
- Start the container
- Offer to drop you into a shell

### 2. Enter the Container

```bash
bash scripts/desktop/shell.sh
```

Or directly:
```bash
docker exec -it opencode-desktop bash
```

### 3. Work Inside the Container

Once inside, you have full access to:

```bash
# Your workspace (live-mounted)
cd /workspace

# Run security audit
bash scripts/security/audit.sh

# Install npm packages
npm install

# Run Python scripts
python3 --version

# Use Git (your config is mounted)
git status
git commit -m "changes"

# Use OpenCode tools
npx @claude-flow/cli@latest --version
```

### 4. Stop the Container

```bash
bash scripts/desktop/stop.sh
```

Or:
```bash
docker-compose down
```

## 📁 What's Mounted

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `.` (project root) | `/workspace` | Your code (live editing) |
| `~/.gitconfig` | `/home/developer/.gitconfig` | Git configuration |
| `~/.ssh` | `/home/developer/.ssh` | SSH keys (GitLab/GitHub) |
| `~/.opencode` | `/home/developer/.opencode` | OpenCode config |
| `~/.claude` | `/home/developer/.claude` | Claude config |
| Volume: `npm-cache` | `/home/developer/.npm` | npm cache (persistent) |
| Volume: `pip-cache` | `/home/developer/.cache/pip` | pip cache (persistent) |
| Volume: `bash-history` | `/home/developer/.bash_history` | Command history |

## 🔐 Environment Variables

Set these in your host environment before starting:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GITLAB_TOKEN="glpat-..."
export SNYK_TOKEN="..."
```

The container will automatically pick them up.

## 🛠️ Pre-Installed Tools

### Development
- Node.js 22 LTS + npm
- Python 3.12 + pip
- Git
- vim, nano (editors)
- ripgrep, fd, bat (search tools)

### Security
- **gitleaks** - Secret scanning
- **semgrep** - SAST analysis
- **snyk** - Vulnerability scanning
- **eslint** - Linting + security rules
- **npm audit** - Dependency checking

### OpenCode
- **ecc-universal** - ECC plugins
- **@claude-flow/cli** - Claude Flow CLI
- TypeScript, ESLint

## 📊 Resource Limits

Default configuration:
- **CPU**: 2-4 cores
- **Memory**: 4-8 GB

Edit `docker-compose.yml` to adjust:

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 8G
    reservations:
      cpus: '2.0'
      memory: 4G
```

## 🔧 Advanced Usage

### Rebuild Image

```bash
docker-compose build --no-cache
```

### View Logs

```bash
docker-compose logs -f
```

### Run Commands Without Entering Shell

```bash
docker exec opencode-desktop npm --version
docker exec opencode-desktop bash scripts/security/audit.sh
docker exec opencode-desktop git status
```

### Clean Up Everything

```bash
# Stop container
docker-compose down

# Remove volumes (DESTRUCTIVE - loses caches)
docker-compose down -v

# Remove image
docker rmi opencode-desktop:latest
```

## 🐛 Troubleshooting

### Docker not running
```
❌ Docker is not running!
```
**Solution**: Start Docker Desktop

### Port conflicts
If using `network_mode: host`, ensure no services conflict on your host.

**Solution**: Change to bridge mode in `docker-compose.yml`:
```yaml
ports:
  - "3000:3000"
  - "8080:8080"
```

### Permission issues
If files created in container have wrong ownership:

**Solution**: The container runs as your host UID/GID, so this shouldn't happen. If it does:
```bash
# On host
sudo chown -R $(whoami):$(whoami) .
```

### Container won't start
```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down
docker rmi opencode-desktop:latest
bash scripts/desktop/start.sh
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

## 🎓 Workflows

### Daily Development

```bash
# Morning: Start container
bash scripts/desktop/start.sh

# Work inside container
docker exec -it opencode-desktop bash
cd /workspace
git pull
npm install
npm run dev

# Evening: Stop container
bash scripts/desktop/stop.sh
```

### Team Onboarding

```bash
# New team member setup (< 10 minutes)
git clone <repo>
cd opencode
bash scripts/desktop/start.sh

# They're ready to work!
```

### CI/CD Integration

Use the same Dockerfile for CI/CD:

```yaml
# .gitlab-ci.yml
test:
  image: opencode-desktop:latest
  script:
    - npm test
    - bash scripts/security/audit.sh
```

## 🆚 Host vs Container

| Task | Where to Run |
|------|--------------|
| Git operations | Either (config mounted) |
| npm install | Container (better isolation) |
| Code editing | Host (use your IDE) |
| Security audits | Container (tools pre-installed) |
| Tests | Container (consistent environment) |
| Docker commands | Host |

## 💡 Tips

1. **Keep container running**: It starts fast, no need to stop/start frequently
2. **Use multiple terminals**: Open several shells to the same container
3. **Mount additional directories**: Edit `docker-compose.yml` volumes
4. **Customize environment**: Edit `Dockerfile` and rebuild
5. **Share image**: Push to registry for team use

## 🔗 Related Files

- `Dockerfile` - Container image definition
- `docker-compose.yml` - Orchestration configuration
- `.dockerignore` - Files excluded from build
- `scripts/desktop/start.sh` - Start script
- `scripts/desktop/stop.sh` - Stop script
- `scripts/desktop/shell.sh` - Quick shell access

## 📋 Checklist

After first setup, verify:
- [ ] Container starts: `bash scripts/desktop/start.sh`
- [ ] Shell access works: `bash scripts/desktop/shell.sh`
- [ ] Git works: `docker exec opencode-desktop git status`
- [ ] Security tools work: `docker exec opencode-desktop gitleaks version`
- [ ] npm works: `docker exec opencode-desktop npm --version`
- [ ] Python works: `docker exec opencode-desktop python3 --version`
- [ ] Workspace mounted: Files visible in `/workspace`

---

**Questions?** Check the main README or create an issue in GitLab.

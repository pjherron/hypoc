<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Quick Start: Deploying to GitLab

## Prerequisites

- GitLab account at [Org] instance: `git.example.edu`
- Git configured with your [Org] credentials
- SSH key added to GitLab (recommended)

## Step 1: Connect to GitLab Remote

```bash
cd ${PROJECT_DIR}/enterprise-toolkit

# Add GitLab remote
git remote add origin git@git.example.edu:pjherron/opencode-enterprise-toolkit.git

# Or use HTTPS
# git remote add origin https://git.example.edu/pjherron/opencode-enterprise-toolkit.git

# Verify remote
git remote -v
```

## Step 2: Create GitLab Repository

**Option A: Via GitLab Web UI**
1. Go to https://git.example.edu/projects/new
2. Project name: `opencode-enterprise-toolkit`
3. Visibility: Internal or Private (your choice)
4. Don't initialize with README (we already have one)
5. Create project

**Option B: Via GitLab CLI (if installed)**
```bash
glab repo create opencode-enterprise-toolkit \
  --internal \
  --description "Enterprise infrastructure skills and tooling for OpenCode"
```

## Step 3: Push to GitLab

```bash
# Rename branch to main (GitLab default)
git branch -M main

# Push to GitLab
git push -u origin main

# Create v1.0.0 tag
git tag -a v1.0.0 -m "Release v1.0.0: Initial enterprise toolkit"
git push origin v1.0.0
```

## Step 4: Verify on GitLab

Visit: https://git.example.edu/pjherron/opencode-enterprise-toolkit

You should see:
- ✅ All files committed
- ✅ README.md displayed on main page
- ✅ v1.0.0 tag in releases

## Step 5: Install Globally

```bash
# Install from GitLab (after pushing)
npm install -g git+ssh://git@git.example.edu/pjherron/opencode-enterprise-toolkit.git

# Or with HTTPS
# npm install -g git+https://git.example.edu/pjherron/opencode-enterprise-toolkit.git

# Verify installation
ls -la /opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/
```

## Step 6: Configure OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "instructions": [
    "file:///opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/skills/aws-infrastructure/SKILL.md",
    "file:///opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/skills/kubernetes-patterns/SKILL.md",
    "file:///opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/skills/fastapi-patterns/SKILL.md"
  ]
}
```

Or for project-specific:

Add to your project's `.opencode.json`:

```json
{
  "plugins": [
    {
      "name": "skill-discovery",
      "path": "./node_modules/@your-org/opencode-enterprise-toolkit/plugins/skill-discovery.js",
      "enabled": true
    }
  ]
}
```

## Step 7: Test

```bash
# Start OpenCode session
cd ~/dev/test-project
opencode

# In OpenCode, verify skills loaded:
# "I should have aws-infrastructure, kubernetes-patterns, and fastapi-patterns skills loaded"
```

## Updating

```bash
# Pull latest changes
cd ${PROJECT_DIR}/enterprise-toolkit
git pull origin main

# Reinstall globally
npm install -g .

# Or update from GitLab
npm update -g @your-org/opencode-enterprise-toolkit
```

## Sharing with Team

Share the installation command:

```bash
npm install -g git+ssh://git@git.example.edu/pjherron/opencode-enterprise-toolkit.git
```

Team members will need:
1. Access to the GitLab repo (add them as members)
2. SSH key configured or HTTPS credentials
3. Node.js 18+ installed

## Troubleshooting

**"Permission denied" when pushing:**
- Ensure you're a member of the GitLab project
- Check SSH key is added: `ssh -T git@git.example.edu`

**"Repository not found":**
- Create the repo on GitLab first (Step 2)
- Verify remote URL: `git remote -v`

**Skills not loading in OpenCode:**
- Check global install path: `npm list -g --depth=0 | grep opencode`
- Verify file paths in config are absolute
- Restart OpenCode session

---

**Ready to push?** Run the commands in Step 3!

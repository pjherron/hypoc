# Security Tools

Comprehensive security testing and evaluation tools for the OpenCode project.

## Quick Start

```bash
# 1. Setup security tools
bash scripts/security/setup.sh

# 2. Run security audit
bash scripts/security/audit.sh

# 3. Install pre-commit hook (automatic)
# Already installed by setup.sh

# 4. Test pre-commit hook
git add .
git commit -m "test security checks"
```

## Available Scripts

### 1. Setup (`setup.sh`)

Installs and configures all security tools:

```bash
bash scripts/security/setup.sh
```

**What it does:**
- Installs gitleaks, semgrep, trufflehog (via Homebrew)
- Installs npm security packages (eslint plugins, snyk)
- Sets up pre-commit hook
- Creates configuration files (.gitleaks.toml, .eslintrc.json)
- Updates .gitignore with security exclusions

### 2. Audit (`audit.sh`)

Runs comprehensive security audit:

```bash
bash scripts/security/audit.sh
```

**Checks performed:**
- ✅ npm dependency vulnerabilities
- ✅ Secret scanning (gitleaks)
- ✅ Static analysis (semgrep)
- ✅ ESLint security rules
- ✅ Snyk vulnerability scan
- ✅ Dangerous file detection
- ✅ .gitignore validation
- ✅ Hardcoded secret detection

**Exit codes:**
- `0` - All checks passed
- `1` - Errors found (blocks deployment)

### 3. Pre-Commit Hook (`pre-commit`)

Automatically runs before every commit:

```bash
# Runs automatically on git commit
git commit -m "your message"

# Skip hook if needed (NOT RECOMMENDED)
git commit --no-verify -m "skip security checks"
```

**Pre-commit checks:**
- 🔍 Secret scanning (gitleaks)
- 🔍 Dangerous pattern detection
- 📦 Dependency audit (if package-lock.json changed)
- 🔧 ESLint security rules
- 📏 File size check (prevents large files)
- 🚫 .env file detection
- 📊 Code quality check (claude-flow)

## NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "security:setup": "bash scripts/security/setup.sh",
    "security:audit": "bash scripts/security/audit.sh",
    "security:secrets": "gitleaks detect --source . --verbose",
    "security:secrets:staged": "gitleaks protect --staged --verbose",
    "security:sast": "semgrep --config=auto .",
    "security:full": "npm run security:audit && npm run security:secrets && npm run security:sast",
    "security:precommit": "bash scripts/security/pre-commit"
  }
}
```

## Tool Installation

### Required Tools

```bash
# macOS (Homebrew)
brew install gitleaks semgrep jq

# npm tools
npm install -g snyk

# Authenticate Snyk
snyk auth
```

### Optional Tools

```bash
# TruffleHog (alternative secret scanner)
brew install trufflesecurity/trufflehog/trufflehog

# OWASP Dependency-Check
brew install dependency-check
```

## Configuration Files

### `.gitleaks.toml`

Secret scanning configuration:

```toml
title = "Gitleaks Configuration"

[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''(?i)api[_-]?key[_-]?[=:]\s*['\"]?([0-9a-zA-Z_\-]{32,})['\"]?'''

[allowlist]
paths = [
  '''test/fixtures/''',
  '''\.example$'''
]
```

### `.eslintrc.json`

ESLint security rules:

```json
{
  "plugins": ["security", "no-secrets"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-unsafe-regex": "error",
    "security/detect-eval-with-expression": "error",
    "no-secrets/no-secrets": "error"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Security Audit
        run: bash scripts/security/audit.sh
      
      - name: Upload Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: security-report
          path: security-reports/
```

## Troubleshooting

### Pre-commit hook not running

```bash
# Check if executable
ls -la .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit

# Test manually
.git/hooks/pre-commit
```

### False positives in gitleaks

Add to `.gitleaks.toml`:

```toml
[allowlist]
paths = [
  '''test/fixtures/fake-keys\.js$'''
]
commits = ["known-safe-commit-hash"]
```

### npm audit blocking commits

```bash
# Fix automatically
npm audit fix

# Or update audit level in pre-commit script
npm audit --audit-level=critical  # Only block on critical
```

## Best Practices

1. ✅ **Run locally before pushing** - `npm run security:audit`
2. ✅ **Never commit secrets** - Use environment variables
3. ✅ **Review security warnings** - Don't skip with `--no-verify`
4. ✅ **Keep tools updated** - Run setup.sh periodically
5. ✅ **Audit dependencies weekly** - `npm audit`
6. ✅ **Monitor production** - Enable Snyk monitoring

## Resources

- [Security Eval Testing Skill](../../skills/security-eval-testing/SKILL.md) - Complete documentation
- [Security Review Skill](ECC universal) - Security checklist
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Support

If you encounter issues:

1. Check tool installation: `which gitleaks semgrep snyk`
2. Verify configurations exist: `ls -la .gitleaks.toml .eslintrc.json`
3. Test tools individually: `gitleaks detect --source .`
4. Review skill documentation: `skills/security-eval-testing/SKILL.md`

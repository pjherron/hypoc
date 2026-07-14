<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Security Evaluation & Testing - Quick Start Guide

## 🎯 What You Get

✅ **Pre-commit security hooks** - Catch issues before they hit the repo  
✅ **Automated dependency auditing** - npm audit integration  
✅ **Secret scanning** - Prevent credential leaks (gitleaks)  
✅ **Static analysis** - Find security bugs (semgrep)  
✅ **Code quality checks** - Claude Flow verification  
✅ **CI/CD ready** - GitHub Actions integration  

## 📦 Installation (One Command)

```bash
cd ${PROJECT_DIR}
bash scripts/security/setup.sh
```

**This installs:**
- gitleaks (secret scanner)
- semgrep (SAST tool)
- trufflehog (alternative secret scanner)
- jq (JSON processor)
- npm security packages (eslint plugins)
- Pre-commit hook
- Configuration files

## 🚀 Usage

### Daily Development

```bash
# Work normally - pre-commit hook runs automatically
git add .
git commit -m "feat: add new feature"

# Pre-commit will:
# ✓ Scan for secrets
# ✓ Check for dangerous patterns
# ✓ Audit dependencies (if package-lock.json changed)
# ✓ Run ESLint security rules
# ✓ Verify code quality
```

### Manual Security Audit

```bash
# Run full security audit anytime
bash scripts/security/audit.sh

# Or using npm (after adding scripts)
npm run security:audit
```

### Scan for Secrets

```bash
# Scan entire repository
npm run security:secrets

# Scan only staged files (what pre-commit uses)
npm run security:secrets:staged
```

### CI/CD Integration

Add to `.github/workflows/security.yml`:

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
      - name: Install Dependencies
        run: npm ci
      - name: Security Audit
        run: bash scripts/security/audit.sh
```

## 📚 Using the Skill

The skill is now available in OpenCode:

```bash
# Load the skill when needed
@skill security-eval-testing

# Or reference in conversation:
# "Use security-eval-testing skill to audit this code"
```

**The skill covers:**
- Pre-commit hook setup and configuration
- Security testing frameworks
- Dependency auditing (npm, Snyk)
- Secret scanning (gitleaks, TruffleHog)
- Static analysis (semgrep, ESLint)
- Security test suites (unit tests, SQL injection, XSS)
- CI/CD integration examples
- Troubleshooting common issues

## 🔧 NPM Scripts (Add to package.json)

```json
{
  "scripts": {
    "security:setup": "bash scripts/security/setup.sh",
    "security:audit": "bash scripts/security/audit.sh",
    "security:secrets": "gitleaks detect --source . --verbose",
    "security:secrets:staged": "gitleaks protect --staged --verbose",
    "security:sast": "semgrep --config=auto .",
    "security:snyk": "snyk test",
    "security:full": "npm run security:audit && npm run security:secrets && npm run security:sast",
    "security:precommit": "bash scripts/security/pre-commit"
  }
}
```

## ⚙️ Configuration Files Created

After running `setup.sh`, you'll have:

- `.gitleaks.toml` - Secret scanning rules
- `.eslintrc.json` - ESLint security rules
- `.git/hooks/pre-commit` - Pre-commit security checks
- Updated `.gitignore` - Security report exclusions

## 🛡️ What Gets Checked

### Pre-Commit (Every Commit)
- 🔍 Secret scanning (API keys, tokens, passwords)
- 🔍 Dangerous patterns (eval, dangerouslySetInnerHTML)
- 📦 Dependency vulnerabilities (high/critical)
- 🔧 ESLint security rules
- 📏 File size limits (prevents large files)
- 🚫 .env file detection
- 📊 Code quality score

### Full Audit (Manual or CI)
- ✅ All pre-commit checks
- ✅ Static analysis (semgrep)
- ✅ Snyk vulnerability scan
- ✅ Dangerous file detection
- ✅ .gitignore validation
- ✅ Hardcoded secret detection

## 🔥 Skip Pre-Commit (Not Recommended)

```bash
# Only in emergencies
git commit --no-verify -m "emergency fix"
```

## 📖 Documentation

- **Full Skill**: `skills/security-eval-testing/SKILL.md`
- **Scripts README**: `scripts/security/README.md`
- **Security Review**: See ECC `security-review` skill (already loaded)
- **Verification**: See `Verification & Quality Assurance` skill

## 🐛 Troubleshooting

### Pre-commit not running

```bash
ls -la .git/hooks/pre-commit  # Should be executable
chmod +x .git/hooks/pre-commit
```

### Tools not found

```bash
# Check installations
which gitleaks semgrep snyk

# Reinstall if needed
bash scripts/security/setup.sh
```

### False positives in gitleaks

Edit `.gitleaks.toml` and add to allowlist:

```toml
[allowlist]
paths = [
  '''test/fixtures/'''
]
```

## 🎓 Best Practices

1. **Run locally before pushing** - `npm run security:audit`
2. **Never commit secrets** - Always use environment variables
3. **Review warnings** - Don't blindly skip with `--no-verify`
4. **Keep tools updated** - Rerun `setup.sh` monthly
5. **Audit weekly** - Schedule regular security checks
6. **Monitor production** - Set up Snyk continuous monitoring

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk Advisor](https://snyk.io/advisor/)
- [Gitleaks Docs](https://github.com/gitleaks/gitleaks)
- [Semgrep Rules](https://semgrep.dev/r)

## ✅ Next Steps

1. **Run setup** (if not done): `bash scripts/security/setup.sh`
2. **Add npm scripts** to your `package.json`
3. **Run first audit**: `npm run security:audit`
4. **Test pre-commit**: Make a commit and verify hook runs
5. **Configure Snyk**: `snyk auth` (optional but recommended)
6. **Add to CI/CD**: Create `.github/workflows/security.yml`

---

**Questions?** Check the full skill documentation at `skills/security-eval-testing/SKILL.md`

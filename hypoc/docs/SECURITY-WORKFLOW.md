# Security Workflow & Architecture

## 📊 Complete Security Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPER WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Developer Codes │
                    └──────────────────┘
                               │
                               ▼
                     ┌─────────────────┐
                     │   git add .     │
                     │   git commit    │
                     └─────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-COMMIT HOOK                              │
│  (Automatic - runs before every commit)                         │
└─────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │ Secret  │         │Dangerous│         │   Dep   │
    │ Scan    │         │Patterns │         │  Audit  │
    │gitleaks │         │  regex  │         │npm audit│
    └─────────┘         └─────────┘         └─────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │ ESLint  │         │  File   │         │  Code   │
    │Security │         │  Size   │         │ Quality │
    │  Rules  │         │  Check  │         │  Score  │
    └─────────┘         └─────────┘         └─────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  All Checks Pass? │
                    └──────────────────┘
                         │          │
                    ✅ YES       ❌ NO
                         │          │
                         ▼          ▼
                  ┌─────────┐  ┌─────────┐
                  │ Commit  │  │ Block   │
                  │Accepted │  │ Commit  │
                  └─────────┘  └─────────┘
                         │          │
                         │          ▼
                         │   ┌────────────┐
                         │   │ Show Error │
                         │   │ Fix Issues │
                         │   └────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CI/CD PIPELINE                            │
│  (Automated on push to GitHub)                                  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ GitHub      │
                  │ Actions     │
                  │ Triggered   │
                  └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │Run audit.sh │
                  └─────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │npm audit│    │gitleaks │    │ semgrep │
    │  High+  │    │ detect  │    │  SAST   │
    └─────────┘    └─────────┘    └─────────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │  Snyk   │    │Dangerous│    │Hardcoded│
    │  Scan   │    │  Files  │    │ Secrets │
    └─────────┘    └─────────┘    └─────────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ All Pass?   │
                  └─────────────┘
                    │         │
               ✅ YES      ❌ NO
                    │         │
                    ▼         ▼
            ┌─────────┐  ┌──────────┐
            │ Deploy  │  │  Block   │
            │ Allowed │  │  Merge   │
            └─────────┘  └──────────┘
                    │         │
                    │         ▼
                    │  ┌──────────────┐
                    │  │Upload Reports│
                    │  │ Notify Team  │
                    │  └──────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION MONITORING                       │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Snyk Monitor  │
            │  (Continuous) │
            └───────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │ New Vulnerability?  │
        └─────────────────────┘
                 │       │
            ✅ NO      ❌ YES
                 │       │
                 │       ▼
                 │  ┌──────────┐
                 │  │ Alert    │
                 │  │ Team     │
                 │  │ Create   │
                 │  │ Issue    │
                 │  └──────────┘
                 │
                 ▼
          ┌──────────┐
          │Continue  │
          │Monitoring│
          └──────────┘
```

## 🔄 Detailed Check Flow

### Pre-Commit Hook (2-5 seconds)

```
┌────────────────────────────────────────────┐
│ 1. SECRET SCANNING (gitleaks)             │
├────────────────────────────────────────────┤
│ Scans: API keys, tokens, passwords,       │
│        JWT tokens, private keys            │
│ Target: Staged files only                  │
│ Speed: <1 second                           │
│ Blocks: Commit if secrets found            │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ 2. DANGEROUS PATTERNS (regex)              │
├────────────────────────────────────────────┤
│ Checks: password=, api_key=, eval(),      │
│        dangerouslySetInnerHTML             │
│ Target: All staged code files              │
│ Speed: <500ms                              │
│ Blocks: Warning (can override)             │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ 3. DEPENDENCY AUDIT (npm audit)            │
├────────────────────────────────────────────┤
│ Runs: Only if package-lock.json changed    │
│ Level: High/Critical only                  │
│ Speed: 1-2 seconds                         │
│ Blocks: Commit if high+ vulns found        │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ 4. ESLINT SECURITY (eslint)                │
├────────────────────────────────────────────┤
│ Rules: security/*, no-secrets/*            │
│ Target: .js, .ts, .jsx, .tsx files         │
│ Speed: 1-2 seconds                         │
│ Blocks: Warning (can override)             │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ 5. FILE SIZE CHECK (wc)                    │
├────────────────────────────────────────────┤
│ Limit: 1MB per file                        │
│ Purpose: Prevent accidental large commits  │
│ Speed: <100ms                              │
│ Blocks: Warning only                       │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ 6. ENV FILE DETECTION (grep)               │
├────────────────────────────────────────────┤
│ Blocks: .env, .env.* (not .example)        │
│ Speed: <100ms                              │
│ Blocks: HARD BLOCK - cannot commit         │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ 7. CODE QUALITY (claude-flow)              │
├────────────────────────────────────────────┤
│ Threshold: 0.90 (90%)                      │
│ Speed: 1-2 seconds (if available)          │
│ Blocks: Warning only                       │
└────────────────────────────────────────────┘
```

### Full Audit (30-60 seconds)

```
┌────────────────────────────────────────────┐
│ Stage 1: DEPENDENCY VULNERABILITIES        │
├────────────────────────────────────────────┤
│ • npm audit (high/critical)                │
│ • Checks all dependencies in package.json  │
│ • Reports CVEs and severity                │
│ Time: 10-15 seconds                        │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ Stage 2: SECRET SCANNING                   │
├────────────────────────────────────────────┤
│ • gitleaks detect (full repo history)      │
│ • Checks all files, not just staged        │
│ • Scans git history for secrets            │
│ Time: 5-10 seconds                         │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ Stage 3: STATIC ANALYSIS                   │
├────────────────────────────────────────────┤
│ • semgrep --config=auto                    │
│ • OWASP Top 10 checks                      │
│ • Language-specific security rules         │
│ Time: 10-20 seconds                        │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ Stage 4: ESLINT SECURITY                   │
├────────────────────────────────────────────┤
│ • All .js, .ts, .jsx, .tsx files           │
│ • Security plugin rules                    │
│ • Custom security patterns                 │
│ Time: 1-2 seconds                          │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ Stage 5: SNYK VULNERABILITY SCAN           │
├────────────────────────────────────────────┤
│ • Snyk test + Snyk code test               │
│ • Checks dependencies + source code        │
│ • Provides fix recommendations             │
│ Time: 5-10 seconds                         │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ Stage 6: DANGEROUS FILE DETECTION          │
├────────────────────────────────────────────┤
│ • Finds .env, *secret*, *private* files    │
│ • Excludes known safe patterns             │
│ • Lists potentially sensitive files        │
│ Time: 1-2 seconds                          │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ Stage 7: GITIGNORE VALIDATION              │
├────────────────────────────────────────────┤
│ • Checks for .env, node_modules, *.log     │
│ • Verifies .gitignore exists               │
│ • Warns about missing patterns             │
│ Time: <100ms                               │
└────────────────────────────────────────────┘
                   ▼
┌────────────────────────────────────────────┐
│ Stage 8: HARDCODED SECRETS SEARCH          │
├────────────────────────────────────────────┤
│ • Regex search in code files               │
│ • Looks for password=, api_key=, etc.      │
│ • Reports line numbers and matches         │
│ Time: 2-5 seconds                          │
└────────────────────────────────────────────┘
```

## 🎯 Decision Tree

```
                  [Developer Action]
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     [Commit]        [Manual]      [CI/CD]
          │              │              │
          ▼              ▼              ▼
   Pre-Commit Hook   audit.sh     GitHub Actions
     (7 checks)     (8 stages)     (Full Pipeline)
          │              │              │
          │              │              │
    Fast & Light   Comprehensive    Plus Deploy
     (2-5 sec)      (30-60 sec)      (2-5 min)
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                [All Pass? ✅]
                         │
                         ▼
              [Proceed to Next Stage]
```

## 📈 Performance Metrics

| Check Type | Speed | Frequency | Blocks |
|------------|-------|-----------|--------|
| Secret scan (staged) | <1s | Every commit | YES |
| Dangerous patterns | <500ms | Every commit | WARN |
| Dependency audit | 1-2s | If package-lock changed | YES |
| ESLint security | 1-2s | Every commit | WARN |
| File size | <100ms | Every commit | WARN |
| .env detection | <100ms | Every commit | YES |
| Code quality | 1-2s | Every commit | WARN |
| **Pre-commit Total** | **2-5s** | **Every commit** | - |
|  |  |  |  |
| Full secret scan | 5-10s | Manual/CI | YES |
| Static analysis | 10-20s | Manual/CI | YES |
| Snyk scan | 5-10s | Manual/CI | YES |
| Hardcoded secrets | 2-5s | Manual/CI | WARN |
| **Full Audit Total** | **30-60s** | **Manual/CI** | - |

## 🔐 Security Coverage Map

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY DOMAINS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ Secret Mgmt    │  │ Dependencies   │  │ Code Security│ │
│  │ ✓ API keys     │  │ ✓ npm audit    │  │ ✓ SQL inject │ │
│  │ ✓ Tokens       │  │ ✓ Snyk         │  │ ✓ XSS        │ │
│  │ ✓ Passwords    │  │ ✓ CVE tracking │  │ ✓ CSRF       │ │
│  │ ✓ .env files   │  │ ✓ Licenses     │  │ ✓ eval()     │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐                   │
│  │ Infrastructure │  │ Quality        │                   │
│  │ ✓ File limits  │  │ ✓ Truth score  │                   │
│  │ ✓ .gitignore   │  │ ✓ Coverage     │                   │
│  │ ✓ Permissions  │  │ ✓ Best practice│                   │
│  └────────────────┘  └────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚦 Exit Codes & Actions

| Exit Code | Meaning | Pre-Commit | Audit | CI/CD |
|-----------|---------|------------|-------|-------|
| **0** | All checks passed | Commit ✅ | Success ✅ | Deploy ✅ |
| **1** | Critical errors | Block ❌ | Fail ❌ | Block ❌ |
| **N/A** | Warnings only | Warn ⚠️ | Success ⚠️ | Deploy ⚠️ |

---

**Last Updated**: April 17, 2026

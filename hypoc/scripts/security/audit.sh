#!/bin/bash
# Quick Security Audit Script
# Runs all available security checks

set -e

echo "🔒 Running Security Audit"
echo "========================"
echo ""

ERRORS=0
WARNINGS=0

# Helper functions
run_check() {
  local name="$1"
  local command="$2"
  
  echo "🔍 $name..."
  if eval "$command"; then
    echo "  ✅ Passed"
  else
    ERRORS=$((ERRORS + 1))
    echo "  ❌ Failed"
  fi
  echo ""
}

run_check_warn() {
  local name="$1"
  local command="$2"
  
  echo "🔍 $name..."
  if eval "$command"; then
    echo "  ✅ Passed"
  else
    WARNINGS=$((WARNINGS + 1))
    echo "  ⚠️  Warning"
  fi
  echo ""
}

# 1. Dependency Audit
if [ -f "package-lock.json" ]; then
  run_check "npm Audit (High/Critical)" "npm audit --audit-level=high"
else
  echo "⏭️  Skipping npm audit (no package-lock.json)"
  echo ""
fi

# 2. Secret Scanning
if command -v gitleaks &> /dev/null; then
  run_check "Secret Scanning (gitleaks)" "gitleaks detect --source . --no-git --verbose"
else
  echo "⏭️  Skipping secret scan (gitleaks not installed)"
  echo "   Install: brew install gitleaks"
  echo ""
fi

# 3. Static Analysis
if command -v semgrep &> /dev/null; then
  run_check_warn "Static Analysis (semgrep)" "semgrep --config=auto --error ."
else
  echo "⏭️  Skipping static analysis (semgrep not installed)"
  echo "   Install: brew install semgrep"
  echo ""
fi

# 4. ESLint Security
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
  run_check_warn "ESLint Security Rules" "npx eslint . --ext .js,.ts,.jsx,.tsx"
else
  echo "⏭️  Skipping ESLint (no config found)"
  echo ""
fi

# 5. Snyk
if command -v snyk &> /dev/null; then
  run_check_warn "Snyk Vulnerability Scan" "snyk test --severity-threshold=high"
else
  echo "⏭️  Skipping Snyk (not installed)"
  echo "   Install: npm install -g snyk && snyk auth"
  echo ""
fi

# 6. Check for common dangerous files
echo "🔍 Checking for dangerous files..."
DANGEROUS_FILES=$(find . -type f \( -name "*.env" -o -name "*secret*" -o -name "*private*" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -name "*.example" \
  ! -name "*.sample" \
  ! -name "*.template" \
  ! -name "*.md" \
  2>/dev/null || true)

if [ -z "$DANGEROUS_FILES" ]; then
  echo "  ✅ No suspicious files found"
else
  echo "  ⚠️  Potentially sensitive files found:"
  echo "$DANGEROUS_FILES" | sed 's/^/     /'
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 7. Check .gitignore
echo "🔍 Checking .gitignore..."
if [ -f ".gitignore" ]; then
  MISSING_PATTERNS=()
  
  grep -q "\.env" .gitignore || MISSING_PATTERNS+=(".env")
  grep -q "node_modules" .gitignore || MISSING_PATTERNS+=("node_modules")
  grep -q "*.log" .gitignore || MISSING_PATTERNS+=("*.log")
  
  if [ ${#MISSING_PATTERNS[@]} -eq 0 ]; then
    echo "  ✅ .gitignore looks good"
  else
    echo "  ⚠️  Missing patterns in .gitignore:"
    printf '     %s\n' "${MISSING_PATTERNS[@]}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  ⚠️  No .gitignore file found"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 8. Check for hardcoded secrets in code
echo "🔍 Searching for hardcoded secrets..."
HARDCODED=$(grep -r -n -E "(password|secret|api_key|token).*=.*['\"][^'\"]{8,}['\"]" \
  --include="*.js" \
  --include="*.ts" \
  --include="*.jsx" \
  --include="*.tsx" \
  --include="*.py" \
  --exclude-dir="node_modules" \
  --exclude-dir=".git" \
  --exclude-dir="dist" \
  --exclude-dir="build" \
  . 2>/dev/null || true)

if [ -z "$HARDCODED" ]; then
  echo "  ✅ No obvious hardcoded secrets found"
else
  echo "  ⚠️  Possible hardcoded secrets found:"
  echo "$HARDCODED" | head -10 | sed 's/^/     /'
  if [ $(echo "$HARDCODED" | wc -l) -gt 10 ]; then
    echo "     ... and $(( $(echo "$HARDCODED" | wc -l) - 10 )) more"
  fi
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "════════════════════════════════"
echo "📊 Security Audit Summary"
echo "════════════════════════════════"
echo ""
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All checks passed!"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Passed with warnings"
  exit 0
else
  echo "❌ Security audit failed"
  echo ""
  echo "Fix the errors above before deploying to production."
  exit 1
fi

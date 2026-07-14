#!/bin/bash
# Security Setup Script
# Installs and configures security tools for development

set -e

echo "🔒 Setting up security tools..."
echo ""

# Check OS
OS="$(uname -s)"

# Function to check if command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Install Homebrew tools (macOS/Linux)
install_brew_tools() {
  if ! command_exists brew; then
    echo "⚠️  Homebrew not installed. Visit https://brew.sh"
    return 1
  fi
  
  echo "📦 Installing Homebrew tools..."
  
  if ! command_exists gitleaks; then
    echo "  Installing gitleaks..."
    brew install gitleaks
  else
    echo "  ✓ gitleaks already installed"
  fi
  
  if ! command_exists semgrep; then
    echo "  Installing semgrep..."
    brew install semgrep
  else
    echo "  ✓ semgrep already installed"
  fi
  
  if ! command_exists trufflehog; then
    echo "  Installing trufflehog..."
    brew install trufflesecurity/trufflehog/trufflehog
  else
    echo "  ✓ trufflehog already installed"
  fi
  
  if ! command_exists jq; then
    echo "  Installing jq..."
    brew install jq
  else
    echo "  ✓ jq already installed"
  fi
}

# Install npm tools
install_npm_tools() {
  echo ""
  echo "📦 Installing npm security tools..."
  
  if ! command_exists npm; then
    echo "❌ npm not installed. Please install Node.js first."
    return 1
  fi
  
  # Global tools
  npm install -g snyk 2>/dev/null || echo "  ⚠️  Could not install snyk globally (permission issue?)"
  
  # Project dependencies
  if [ -f "package.json" ]; then
    echo "  Installing project security dependencies..."
    npm install --save-dev \
      eslint \
      eslint-plugin-security \
      eslint-plugin-no-secrets \
      @typescript-eslint/parser \
      @typescript-eslint/eslint-plugin \
      husky \
      2>/dev/null || echo "  ⚠️  Some dependencies failed to install"
  fi
}

# Setup pre-commit hook
setup_precommit() {
  echo ""
  echo "🪝 Setting up pre-commit hook..."
  
  if [ ! -d ".git" ]; then
    echo "  ⚠️  Not a git repository. Skipping hook setup."
    return 1
  fi
  
  # Create hooks directory if it doesn't exist
  mkdir -p .git/hooks
  
  # Copy pre-commit hook
  if [ -f "scripts/security/pre-commit" ]; then
    cp scripts/security/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "  ✓ Pre-commit hook installed"
  else
    echo "  ⚠️  Pre-commit hook script not found"
  fi
  
  # Setup husky if available
  if [ -f "package.json" ] && command_exists npx; then
    echo "  Setting up husky..."
    npx husky install 2>/dev/null || echo "  ⚠️  Could not initialize husky"
  fi
}

# Create security config files
create_config_files() {
  echo ""
  echo "📝 Creating security configuration files..."
  
  # .gitleaks.toml
  if [ ! -f ".gitleaks.toml" ]; then
    cat > .gitleaks.toml << 'EOF'
title = "Gitleaks Configuration"

[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''(?i)api[_-]?key[_-]?[=:]\s*['\"]?([0-9a-zA-Z_\-]{32,})['\"]?'''

[[rules]]
id = "jwt-token"
description = "JWT Token"
regex = '''eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*'''

[allowlist]
paths = [
  '''^\.git/''',
  '''node_modules/''',
  '''\.md$''',
  '''test/fixtures/''',
  '''\.example$''',
  '''\.sample$'''
]
EOF
    echo "  ✓ Created .gitleaks.toml"
  else
    echo "  ✓ .gitleaks.toml already exists"
  fi
  
  # .eslintrc.json (if package.json exists)
  if [ -f "package.json" ] && [ ! -f ".eslintrc.json" ] && [ ! -f ".eslintrc.js" ]; then
    cat > .eslintrc.json << 'EOF'
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:security/recommended"
  ],
  "plugins": ["security", "no-secrets"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-eval-with-expression": "error",
    "no-secrets/no-secrets": "error"
  }
}
EOF
    echo "  ✓ Created .eslintrc.json"
  else
    echo "  ✓ ESLint config already exists or not needed"
  fi
  
  # Add to .gitignore
  if [ -f ".gitignore" ]; then
    if ! grep -q "# Security reports" .gitignore; then
      cat >> .gitignore << 'EOF'

# Security reports
security-reports/
gitleaks-report.json
semgrep-report.json
snyk-report.html
audit-report.json
.snyk
EOF
      echo "  ✓ Updated .gitignore"
    fi
  fi
}

# Add npm scripts
add_npm_scripts() {
  echo ""
  echo "📦 Adding npm security scripts..."
  
  if [ ! -f "package.json" ]; then
    echo "  ⚠️  No package.json found. Skipping."
    return 1
  fi
  
  # Check if scripts section exists
  if ! grep -q '"scripts"' package.json; then
    echo "  ⚠️  No scripts section in package.json. Add manually."
    return 1
  fi
  
  echo "  Add these scripts to package.json:"
  echo ""
  cat << 'EOF'
  "scripts": {
    "security:setup": "bash scripts/security/setup.sh",
    "security:audit": "npm audit --audit-level=moderate",
    "security:audit:fix": "npm audit fix",
    "security:secrets": "gitleaks detect --source . --verbose",
    "security:secrets:staged": "gitleaks protect --staged --verbose",
    "security:sast": "semgrep --config=auto .",
    "security:snyk": "snyk test",
    "security:full": "npm run security:audit && npm run security:secrets && npm run security:sast",
    "security:precommit": "npm run security:secrets:staged && npm run security:audit",
    "security:ci": "npm run security:full"
  }
EOF
  echo ""
}

# Main installation
main() {
  echo "🚀 Security Tools Setup"
  echo "======================"
  echo ""
  
  # Install tools based on OS
  if [ "$OS" = "Darwin" ] || [ "$OS" = "Linux" ]; then
    install_brew_tools
  fi
  
  install_npm_tools
  setup_precommit
  create_config_files
  add_npm_scripts
  
  echo ""
  echo "✅ Security setup complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Add npm scripts to package.json (see above)"
  echo "  2. Run 'npm run security:audit' to check dependencies"
  echo "  3. Run 'npm run security:secrets' to scan for secrets"
  echo "  4. Configure Snyk: snyk auth"
  echo "  5. Test pre-commit hook: git commit"
  echo ""
  echo "Documentation: skills/security-eval-testing/SKILL.md"
}

main "$@"

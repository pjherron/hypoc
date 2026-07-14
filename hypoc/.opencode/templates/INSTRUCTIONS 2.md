# Project Instructions

Last updated: [AUTO-GENERATED DATE]

## Project Overview

**Name**: [Project Name]  
**Purpose**: [Brief description of what this project does]  
**Tech Stack**: [List primary technologies]

## Quick Start

### Prerequisites
```bash
# List required tools and versions
node >= 18.0.0
npm >= 9.0.0
git >= 2.30.0
```

### Installation
```bash
# Clone and setup
git clone [repository-url]
cd [project-directory]
npm install
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Development Workflow

### TDD Workflow (ENFORCED)
1. **Write Test First** - Create failing test
2. **Implement Minimum** - Write just enough code to pass
3. **Refactor** - Clean up while keeping tests green
4. **Commit** - Only commit with passing tests

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks

### Commit Conventions
```
type(scope): description

- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructure
- test: Adding tests
- chore: Maintenance
```

## Architecture

### Directory Structure
```
/src              - Source code
/tests            - Test files
/docs             - Documentation
/config           - Configuration files
/scripts          - Utility scripts
/examples         - Example code
/agents           - AI agent definitions
/skills           - Skill modules
/.opencode        - OpenCode configuration
```

### Key Patterns
- **Domain-Driven Design**: Organize by domain, not by type
- **Immutability**: Never mutate, always create new objects
- **Type Safety**: Use TypeScript with strict mode
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Input Validation**: Validate all user input at boundaries

## Security (CRITICAL)

### Pre-Commit Checklist
Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

### Secret Management
```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error('API_KEY not configured')
}
```

## Code Quality

### File Size Limits
- Typical: 200-400 lines
- Maximum: 800 lines
- If larger: Extract utilities and split by concern

### Style Guide
- Use `const` over `let`, never `var`
- Prefer arrow functions
- Use async/await over promises
- Destructure objects and arrays
- Use template literals for strings

### Testing Requirements
- **Unit Tests**: Test individual functions/methods
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test user workflows
- **Minimum Coverage**: 80%

## Agent & Skill System

### Available Agents
See `agents/` directory for:
- **coder**: Code generation and editing
- **reviewer**: Code review and quality
- **tester**: Test generation and execution
- **security-auditor**: Security analysis
- [See AGENTS.md for full list]

### Available Skills
See `skills/` directory for:
- Development workflows
- Testing patterns
- Security checks
- Documentation generation
- [See skills/ for full catalog]

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Tests Fail
```bash
# Run in watch mode for debugging
npm run test:watch
```

#### Type Errors
```bash
# Check types explicitly
npm run type-check
```

## Resources

### Documentation
- [Main README](../docs/README.md)
- [Architecture Docs](../docs/architecture/)
- [API Reference](../docs/api/)

### External Links
- [Project Repository](URL)
- [Issue Tracker](URL)
- [Deployment Guide](URL)

---

*Keep this file updated as project requirements evolve.*

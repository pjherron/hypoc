# Contributing to OpenCode Enterprise Toolkit

Thank you for considering contributing! This toolkit is built to help enterprise AI teams work more effectively.

## What We're Looking For

### New Skills
- Enterprise infrastructure patterns (cloud, containers, databases)
- Production deployment workflows
- Security and compliance patterns
- DevOps and CI/CD tooling
- Data engineering patterns

### Improvements to Existing Skills
- Real-world examples and anti-patterns
- Performance optimizations
- Security best practices
- Token efficiency improvements

### Plugin Enhancements
- Better context detection
- Smarter skill suggestions
- Lower overhead
- More project types

## Skill Guidelines

### Structure

Every skill must have:

```yaml
---
name: skill-name
description: One-line description under 100 chars
origin: ECC
---

# Skill Name

Brief introduction paragraph.

## When to Activate

- Specific scenario 1
- Specific scenario 2
- Specific scenario 3

## Patterns

### Pattern Name

Description with code examples.

## Anti-Patterns

What NOT to do (with examples).

## Best Practices

Summary checklist.
```

### Token Efficiency

- Target: 5K-10K tokens per skill
- Maximum: 15K tokens (needs justification)
- Use tables and lists over paragraphs
- Link to external docs for deep dives
- Avoid duplicating content from other skills

### Quality Standards

- [ ] Tested in real OpenCode session
- [ ] All code examples work
- [ ] No hardcoded secrets or credentials
- [ ] Cross-platform compatible (macOS, Linux)
- [ ] Clear activation criteria
- [ ] At least 3 practical examples
- [ ] Anti-patterns section included

## Development Workflow

### 1. Fork & Branch

```bash
git clone https://git.example.edu/pjherron/opencode-enterprise-toolkit.git
cd opencode-enterprise-toolkit
git checkout -b feature/my-contribution
```

### 2. Make Changes

```bash
# Add new skill
mkdir -p skills/my-skill
vim skills/my-skill/SKILL.md

# Or improve existing
vim skills/aws-infrastructure/SKILL.md
```

### 3. Test Locally

```bash
# Install locally
npm install -g .

# Test in OpenCode session
cd ~/dev/test-project
opencode
# Load your skill and verify it works
```

### 4. Check Token Count

```bash
# Rough estimate (words * 1.3)
wc -w skills/my-skill/SKILL.md

# Better: use tiktoken
npm install -g tiktoken
tiktoken count skills/my-skill/SKILL.md
```

### 5. Commit

```bash
git add skills/my-skill/
git commit -m "feat(skills): add my-skill for X patterns

- Covers use cases A, B, C
- Token cost: ~7.2K
- Includes examples and anti-patterns"
```

### 6. Push & Create MR

```bash
git push origin feature/my-contribution
# Create merge request on GitLab
```

## Commit Message Format

Follow conventional commits:

```
feat(skills): add kubernetes-patterns skill
fix(plugins): correct token count calculation
docs(readme): clarify installation steps
refactor(aws): split into multiple sections
```

## Review Process

1. Automated checks (linting, token count)
2. Maintainer review for quality and relevance
3. Test in real session
4. Merge to main
5. Tag new version

## Code of Conduct

- Be respectful and constructive
- Focus on enterprise use cases
- Prioritize security and best practices
- Keep it professional (this is [Org])

## Questions?

Open an issue or contact author@example.edu

## License

By contributing, you agree your code is licensed under MIT.

# Repository Setup Complete

## Directory Structure

This repository has been initialized with the Claude Code structure:

- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Superpowers Skills Framework

The Superpowers skills framework has been installed and configured.

### Installation Details

- Added to: `~/.config/opencode/opencode.json`
- Plugin: `superpowers@git+https://github.com/obra/superpowers.git`
- Auto-installs on OpenCode restart

### Verification

To verify the installation, ask OpenCode:
```
Tell me about your superpowers
```

Or use the skill tool:
```
use skill tool to list skills
use skill tool to load superpowers/brainstorming
```

### Updating

Superpowers updates automatically when you restart OpenCode.

## TDD Workflow

All future tasks will follow Test-Driven Development (TDD) workflow:

1. **Write Test First** - Create failing tests before implementation
2. **Implement Minimum Code** - Write just enough code to pass the test
3. **Refactor** - Clean up code while keeping tests green
4. **Run Tests** - Always verify tests pass after changes
5. **Commit** - Commit only when tests are green

### TDD Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/specific-test.spec.ts

# Run tests with coverage
npm run test:coverage
```

### Testing Philosophy

This project follows **London School TDD** (mock-first):
- Mock external dependencies
- Test behavior, not implementation
- Keep tests isolated and fast
- Use dependency injection for testability

## Build & Verify

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Run all tests
npm test
```

## Next Steps

1. Restart OpenCode to activate Superpowers
2. Verify installation with: "Tell me about your superpowers"
3. Begin development following TDD workflow
4. Use Superpowers skills for enhanced productivity

## Support

- Superpowers: https://github.com/obra/superpowers
- OpenCode: https://opencode.ai
- Project Issues: (Add your repo issue tracker here)

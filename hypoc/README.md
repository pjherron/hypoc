<!-- Configuration variables referenced in this document:
  AWS_REGION                AWS region for deployment (e.g. us-gov-west-1, us-east-1)  (e.g. us-gov-west-1)
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Hypoc - OpenCode Configuration

"The best way to predict the future is to invent it." - __HYPOC_KAY__

This repo is named after __HYPOC_KAY__, an American computer scientist and pioneer of object-oriented programming and graphical window interfaces. While working at Xerox PARC in the 1970s he created Smalltalk, the first object-oriented programming language, the first computing notebooks and tablets, and the first prototypes for an interface that would eventually become known as Windows, a feature adopted by both Microsoft and Apple. He also created Disney animatronics. Kay received the Turing Award in 2003.

---

Shareable OpenCode configuration with skills, agents, and patterns. Foundation for building AI-powered development environments.

> **Note:** This is the base Hypoc configuration. For the enterprise multi-tenant platform (Hypoc-Face), see the separate `hypoc-face/` directory which uses Hypoc as a git submodule.

## Overview

This repository contains:
- **14 always-loaded skills** including automatic session/project/skill recruitment
- **CLAUDE.md** with workspace development workflow and constraints
- **3 custom skills** created from scratch (aws-infrastructure, kubernetes-patterns, fastapi-patterns)
- **Context-aware discovery plugin** for automatic skill suggestions
- **Dated memory system** with timeline tracking
- **227 skills** including [Org] HR Operations for comprehensive coverage
- **Bedrock prompt caching enabled** (~90% cost reduction on cached content)
- **Complete documentation** and examples

## Features

### Infrastructure Skills
- **AWS**: EC2, ECS Fargate, Lambda, S3, RDS, VPC, IAM, CloudFormation
- **Kubernetes**: Manifests, Helm, autoscaling, monitoring, security
- **Docker**: Multi-stage builds, security best practices, optimization
- **FastAPI**: Async patterns, Pydantic validation, WebSockets, production deployment
- **Python**: Async programming, type hints, Pythonic idioms

### Automation
- **Discovery Plugin**: Context-aware skill suggestions based on project type and keywords
- **Memory System**: Dated timeline with automatic capture of important events
- **Token Optimization**: Strategic skill loading to maximize context efficiency

### Configuration
- **Global Skills**: 13 always-loaded patterns (~89K tokens)
- **Project Skills**: Context-specific additions
- **Discovery System**: Smart suggestions without context pollution
- **Cost Optimization**: Bedrock prompt caching enabled (1-hour TTL, ~90% savings)

## Quick Start

### Installation

1. **Clone this repository:**
```bash
git clone https://github.com/pjherron/opencode-enterprise-ai-setup.git
cd opencode-enterprise-ai-setup
```

2. **Install dependencies:**
```bash
npm install -g ecc-universal
npm install -g @claude-flow/cli
```

3. **Link global config:**
```bash
# Backup your existing config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup

# Use this repo's config
ln -sf $(pwd)/.config/opencode.json ~/.config/opencode/opencode.json
```

4. **Compile discovery plugin:**
```bash
cd .opencode/plugins
./compile.sh
```

5. **Initialize memory:**
```bash
npx @claude-flow/cli memory init
```

### Usage

**Start OpenCode in any project** - infrastructure skills are always available:
```bash
cd /your/project
opencode
```

**Use the discovery plugin** - get suggestions based on context:
```
You: "I need Docker support"
Plugin: Suggests docker-patterns
```

**Capture important work:**
```bash
node .opencode/helpers/memory-manager.mjs capture "Your summary"
node .opencode/helpers/memory-manager.mjs milestone "Major achievement"
node .opencode/helpers/memory-manager.mjs deployment "Production release"
```

**Search your history:**
```bash
node .opencode/helpers/memory-manager.mjs search "kubernetes"
node .opencode/helpers/memory-manager.mjs recent 10
```

## Repository Structure

```
opencode-enterprise-ai-setup/
├── .opencode/
│   ├── opencode.json                  # Project configuration
│   ├── plugins/
│   │   ├── skill-discovery.ts         # Discovery plugin source
│   │   └── compile.sh                 # Build script
│   └── helpers/
│       └── memory-manager.mjs         # Memory capture tool
│
├── skills/
│   ├── aws-infrastructure/            # Custom AWS patterns
│   ├── kubernetes-patterns/           # Custom K8s patterns
│   ├── fastapi-patterns/              # Custom FastAPI patterns
│   └── ... (183 ECC skills)
│
├── examples/
│   └── ml-api/                        # Example deployment
│
├── MEMORY.md                          # Session memory with timeline
└── README.md                          # This file
```

## Skills Included

### Automatic Recruitment (3 skills - NEW)
- session-recruitment (automatic past session discovery and loading)
- project-tracking (mandatory TodoWrite usage for all multi-step work)
- skill-recruitment (automatic past skill and pattern discovery)

### Core Enterprise (5 skills)
- coding-standards
- security-review
- tdd-workflow
- eval-harness
- deep-research

### DevOps & Deployment (3 skills)
- docker-patterns
- deployment-patterns
- terminal-ops

### Backend Development (3 skills)
- python-patterns
- fastapi-patterns
- mcp-server-patterns

### Cloud Infrastructure (2 skills)
- aws-infrastructure (custom)
- kubernetes-patterns (custom)

**Total: 14 always-loaded skills**

## Token Budget

```
200K total
├─ 89K  Always-loaded skills (45%)
├─ 80K  Conversation + tool results
└─ 31K  Available for exploration (16%)
```

## Configuration

### Global Config (`~/.config/opencode/opencode.json`)
```json
{
  "provider": {
    "amazon-bedrock": {
      "prompt_caching": true,
      "cache_point_ttl": "1h",
      "options": {
        "region": "${AWS_REGION}",
        "baseURL": "https://bedrock-runtime.${AWS_REGION}.amazonaws.com"
      },
      "models": {
        "claude-4.5-gov": {
          "id": "us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0"
        }
      }
    }
  },
  "model": "amazon-bedrock/claude-4.5-gov",
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "ecc-universal"
  ],
  "instructions": [
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/coding-standards/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/security-review/SKILL.md",
    // ... 11 more skills
  ]
}
```

### Project Config (`.opencode.json`)
```json
{
  "workingDirectory": "${PROJECT_DIR}",
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "ecc-universal",
    "./.opencode/plugins/skill-discovery.js"
  ],
  "instructions": [
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/frontend-patterns/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/backend-patterns/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/api-design/SKILL.md"
  ]
}
```

## Documentation

- **CLAUDE.md** - Workspace development workflow and operational constraints
- **docs/BEDROCK_CACHING_UPDATE.md** - Prompt caching configuration and benefits
- **SETUP_COMPLETE.md** - Complete setup documentation
- **INFRASTRUCTURE_SKILLS_ADDED.md** - Infrastructure skills guide
- **SESSION_MEMORY_GUIDE.md** - Memory system documentation
- **CONTEXT_MEMORY_GUIDE.md** - Context-driven memory usage
- **QUICK_START.md** - Quick reference
- **FILE_STRUCTURE.md** - Project layout

## Memory System

Capture important events with dates and context:

```bash
# Capture event
node .opencode/helpers/memory-manager.mjs capture "Summary"

# Record milestone
node .opencode/helpers/memory-manager.mjs milestone "Major achievement"

# Search history
node .opencode/helpers/memory-manager.mjs search "keyword"

# Show recent
node .opencode/helpers/memory-manager.mjs recent 10
```

All entries are stored in `MEMORY.md` with timestamps and tags.

## Use Cases

### For Enterprise AI Development
- Model experiments → Infrastructure → Deployment → Strategy
- Full-stack: Foundation models, MLOps, cloud infrastructure
- Always-available patterns for AWS, K8s, Docker, FastAPI

### For Infrastructure Work
- Deploy FastAPI apps to ECS Fargate
- Set up Kubernetes clusters with autoscaling
- Configure AWS VPCs, RDS, ElastiCache
- Containerize applications with Docker

### For Team Standardization
- Shared skill configuration
- Consistent patterns across projects
- Memory system for institutional knowledge

## Contributing

This is a personal configuration repository. If you want to contribute:

1. Fork this repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## Credits

Built on top of:
- **[Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code)** by @affaan-m
- **[Superpowers](https://github.com/obra/superpowers)** by @obra
- **[OpenCode](https://opencode.ai)** by Anomaly

## License

MIT License - See LICENSE file for details

## Author

**your-username** - Enterprise AI Developer

Builds AI systems end-to-end: from foundation model experiments to production infrastructure and business strategy.

---

**Status**: Active development | Last updated: 2026-06-19 | OpenCode 1.15.0 | Bedrock Caching Enabled

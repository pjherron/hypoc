# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-04-21

### Added
- Initial release of OpenCode Enterprise Toolkit
- **Skills:**
  - `aws-infrastructure` - AWS patterns (EC2, ECS, Lambda, S3, RDS, VPC, IAM, CloudFormation)
  - `kubernetes-patterns` - Kubernetes patterns (manifests, Helm, autoscaling, monitoring)
  - `fastapi-patterns` - FastAPI patterns (async, Pydantic, WebSockets, production)
- **Plugins:**
  - `skill-discovery` - Context-aware skill suggestion based on project type and keywords
- **Examples:**
  - `ml-api` - Complete ML API deployment example with FastAPI, Docker, ECS, CloudFormation
- **Documentation:**
  - Comprehensive README with usage patterns
  - Contributing guidelines
  - Token budget recommendations

### Token Costs
- aws-infrastructure: ~7.2K tokens
- kubernetes-patterns: ~10.8K tokens
- fastapi-patterns: ~6.1K tokens
- Total (all 3): ~24K tokens (12% of 200K budget)

### Target Audience
- Enterprise AI engineers
- DevOps and platform teams
- Cloud infrastructure developers
- Teams working with AWS, Kubernetes, and modern Python stacks

[1.0.0]: https://git.example.edu/pjherron/opencode-enterprise-toolkit/-/releases/v1.0.0

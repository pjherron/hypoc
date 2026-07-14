#!/bin/bash
# OpenCode Desktop - Start Script
# Launches containerized OpenCode development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║         🚀 OpenCode Desktop - Containerized 🚀           ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo ""
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is running"

# Check if image exists, build if not
if ! docker images | grep -q "opencode-desktop"; then
    echo -e "${YELLOW}📦 Building OpenCode Desktop image (first time only)...${NC}"
    echo ""
    docker-compose build
    echo ""
    echo -e "${GREEN}✓${NC} Image built successfully"
fi

# Check if container is already running
if docker ps | grep -q "opencode-desktop"; then
    echo -e "${YELLOW}⚠️  OpenCode Desktop is already running${NC}"
    echo ""
    echo "Options:"
    echo "  1. Attach to running container: docker attach opencode-desktop"
    echo "  2. Open new shell: docker exec -it opencode-desktop bash"
    echo "  3. Stop and restart: docker-compose down && $0"
    exit 0
fi

# Export environment
export UID=$(id -u)
export GID=$(id -g)
export USER=$(whoami)

# Start container
echo -e "${BLUE}🚀 Starting OpenCode Desktop...${NC}"
echo ""

docker-compose up -d

echo ""
echo -e "${GREEN}✓${NC} OpenCode Desktop started successfully!"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎯 Quick Commands:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Enter container:${NC}"
echo -e "    docker exec -it opencode-desktop bash"
echo ""
echo -e "  ${GREEN}View logs:${NC}"
echo -e "    docker-compose logs -f"
echo ""
echo -e "  ${GREEN}Stop container:${NC}"
echo -e "    docker-compose down"
echo ""
echo -e "  ${GREEN}Rebuild image:${NC}"
echo -e "    docker-compose build --no-cache"
echo ""
echo -e "  ${GREEN}Run security audit:${NC}"
echo -e "    docker exec -it opencode-desktop bash scripts/security/audit.sh"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Tip:${NC} Your local workspace is mounted at /workspace inside the container"
echo -e "${YELLOW}💡 Tip:${NC} All changes persist between container restarts"
echo ""

# Auto-attach option
read -p "Would you like to enter the container now? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${GREEN}Entering OpenCode Desktop...${NC}"
    echo ""
    docker exec -it opencode-desktop bash
fi

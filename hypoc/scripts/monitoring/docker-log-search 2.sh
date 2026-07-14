#!/bin/bash
# Docker Log Search Script
# Search through Docker logs with advanced filtering

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load configuration
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/.env"
fi

# Configuration with defaults
ENABLE_COLORS=${ENABLE_COLORS:-true}

# Colors
if [[ "$ENABLE_COLORS" == "true" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Usage function
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] PATTERN

Search Docker container logs with grep-like functionality.

OPTIONS:
    -c, --container NAME    Search only specific container (default: all)
    -t, --tail N           Show last N lines before searching (default: all)
    -f, --follow           Follow log output (like tail -f)
    -i, --ignore-case      Case-insensitive search
    -A, --after N          Show N lines after match
    -B, --before N         Show N lines before match
    -s, --since TIME       Show logs since timestamp (e.g., "2023-01-01", "1h")
    -l, --list             List all containers and exit
    -h, --help             Show this help message

EXAMPLES:
    # Search for "error" in all containers
    $(basename "$0") error

    # Case-insensitive search in specific container
    $(basename "$0") -i -c nginx ERROR

    # Show 5 lines of context around matches
    $(basename "$0") -A 5 -B 5 "connection refused"

    # Follow logs and search
    $(basename "$0") -f exception

    # Search logs from last hour
    $(basename "$0") -s 1h "failed to start"

EOF
    exit 1
}

# Default values
CONTAINER=""
TAIL=""
FOLLOW=false
IGNORE_CASE=""
AFTER=0
BEFORE=0
SINCE=""
LIST=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--container)
            CONTAINER="$2"
            shift 2
            ;;
        -t|--tail)
            TAIL="--tail $2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -i|--ignore-case)
            IGNORE_CASE="-i"
            shift
            ;;
        -A|--after)
            AFTER="$2"
            shift 2
            ;;
        -B|--before)
            BEFORE="$2"
            shift 2
            ;;
        -s|--since)
            SINCE="--since $2"
            shift 2
            ;;
        -l|--list)
            LIST=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        -*)
            echo "Unknown option: $1"
            usage
            ;;
        *)
            PATTERN="$1"
            shift
            ;;
    esac
done

# List containers if requested
if [[ "$LIST" == true ]]; then
    echo -e "${GREEN}Running containers:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
    exit 0
fi

# Check if pattern is provided
if [[ -z "${PATTERN:-}" ]]; then
    echo -e "${RED}Error: Search pattern is required${NC}"
    usage
fi

# Build grep options
GREP_OPTS="$IGNORE_CASE"
if [[ $AFTER -gt 0 ]]; then
    GREP_OPTS="$GREP_OPTS -A $AFTER"
fi
if [[ $BEFORE -gt 0 ]]; then
    GREP_OPTS="$GREP_OPTS -B $BEFORE"
fi

# Function to search logs
search_container() {
    local container=$1
    local container_name=$(docker ps --filter "id=$container" --format "{{.Names}}" 2>/dev/null)
    
    if [[ -z "$container_name" ]]; then
        container_name=$container
    fi
    
    echo -e "${BLUE}=== $container_name ===${NC}"
    
    if [[ "$FOLLOW" == true ]]; then
        docker logs -f $TAIL $SINCE "$container" 2>&1 | grep --color=always $GREP_OPTS "$PATTERN" || true
    else
        docker logs $TAIL $SINCE "$container" 2>&1 | grep --color=always $GREP_OPTS "$PATTERN" || true
    fi
}

# Search specific container or all containers
if [[ -n "$CONTAINER" ]]; then
    search_container "$CONTAINER"
else
    # Get all running containers
    CONTAINERS=$(docker ps -q)
    
    if [[ -z "$CONTAINERS" ]]; then
        echo -e "${YELLOW}No running containers found${NC}"
        exit 0
    fi
    
    for container in $CONTAINERS; do
        search_container "$container"
        echo ""
    done
fi

#!/bin/bash
# Docker Stats Monitoring Script
# Shows real-time resource usage for Docker containers

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load configuration
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/.env"
fi

# Configuration with defaults
ALERT_CPU_THRESHOLD=${ALERT_CPU_THRESHOLD:-0}
ALERT_MEM_THRESHOLD=${ALERT_MEM_THRESHOLD:-0}
ENABLE_COLORS=${ENABLE_COLORS:-true}

# Colors
if [[ "$ENABLE_COLORS" == "true" ]]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    GREEN=''
    YELLOW=''
    RED=''
    BLUE=''
    NC=''
fi

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Monitor Docker container resource usage.

OPTIONS:
    -c, --container NAME    Monitor specific container
    -o, --once             Show stats once and exit (default: continuous)
    -s, --sort FIELD       Sort by field (cpu, mem, name)
    -a, --alert CPU MEM    Alert if CPU% or MEM% exceeds threshold
    -j, --json             Output in JSON format
    -h, --help             Show this help message

EXAMPLES:
    # Continuous monitoring (default)
    $(basename "$0")

    # Monitor specific container
    $(basename "$0") -c nginx

    # Show once and exit
    $(basename "$0") -o

    # Alert if any container uses >80% CPU or >90% memory
    $(basename "$0") -a 80 90

    # JSON output
    $(basename "$0") -o -j

EOF
    exit 1
}

# Default values
CONTAINER=""
ONCE=false
SORT_FIELD=""
ALERT_CPU=$ALERT_CPU_THRESHOLD
ALERT_MEM=$ALERT_MEM_THRESHOLD
JSON=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--container)
            CONTAINER="$2"
            shift 2
            ;;
        -o|--once)
            ONCE=true
            shift
            ;;
        -s|--sort)
            SORT_FIELD="$2"
            shift 2
            ;;
        -a|--alert)
            ALERT_CPU="$2"
            ALERT_MEM="$3"
            shift 3
            ;;
        -j|--json)
            JSON=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Check for alerts
check_alerts() {
    local name=$1
    local cpu=$2
    local mem=$3
    
    cpu_val=$(echo "$cpu" | sed 's/%//')
    mem_val=$(echo "$mem" | sed 's/%//')
    
    if (( $(echo "$cpu_val > $ALERT_CPU" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "${RED}[ALERT]${NC} $name: CPU usage ${cpu} exceeds threshold (${ALERT_CPU}%)"
    fi
    
    if (( $(echo "$mem_val > $ALERT_MEM" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "${RED}[ALERT]${NC} $name: Memory usage ${mem} exceeds threshold (${ALERT_MEM}%)"
    fi
}

# JSON output
if [[ "$JSON" == true ]]; then
    if [[ -n "$CONTAINER" ]]; then
        docker stats --no-stream --format "{{json .}}" "$CONTAINER"
    else
        docker stats --no-stream --format "{{json .}}" --all
    fi
    exit 0
fi

# Regular monitoring
if [[ "$ONCE" == true ]]; then
    echo -e "${GREEN}Docker Container Resource Usage (snapshot):${NC}"
    if [[ -n "$CONTAINER" ]]; then
        docker stats --no-stream "$CONTAINER"
    else
        docker stats --no-stream --all
    fi
    
    # Check alerts if configured
    if [[ $ALERT_CPU -gt 0 ]] || [[ $ALERT_MEM -gt 0 ]]; then
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}" --all | tail -n +2 | while read name cpu mem rest; do
            check_alerts "$name" "$cpu" "$mem"
        done
    fi
else
    echo -e "${GREEN}Docker Container Resource Usage (live, press Ctrl+C to exit):${NC}"
    if [[ -n "$CONTAINER" ]]; then
        docker stats "$CONTAINER"
    else
        docker stats --all
    fi
fi

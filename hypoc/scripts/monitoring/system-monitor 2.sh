#!/bin/bash
# System Monitoring Script
# Shows system-wide resource usage and health

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
ALERT_DISK_THRESHOLD=${ALERT_DISK_THRESHOLD:-0}
DEFAULT_WATCH_INTERVAL=${DEFAULT_WATCH_INTERVAL:-5}
ENABLE_COLORS=${ENABLE_COLORS:-true}
MONITOR_DISK_PATH=${MONITOR_DISK_PATH:-/}

# Colors
if [[ "$ENABLE_COLORS" == "true" ]]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m'
else
    GREEN=''
    YELLOW=''
    RED=''
    BLUE=''
    CYAN=''
    NC=''
fi

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Monitor system resource usage and health.

OPTIONS:
    -w, --watch N          Refresh every N seconds (default: continuous once)
    -c, --compact          Compact output (one-line summary)
    -j, --json             Output in JSON format
    -a, --alert            Alert on high resource usage
    -h, --help             Show this help message

EXAMPLES:
    # Show current stats
    $(basename "$0")

    # Refresh every 5 seconds
    $(basename "$0") -w 5

    # Compact one-line output (good for logging)
    $(basename "$0") -c

    # JSON output
    $(basename "$0") -j

EOF
    exit 1
}

# Default values
WATCH=0
COMPACT=false
JSON=false
ALERT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--watch)
            WATCH="$2"
            shift 2
            ;;
        -c|--compact)
            COMPACT=true
            shift
            ;;
        -j|--json)
            JSON=true
            shift
            ;;
        -a|--alert)
            ALERT=true
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

# Get system stats
get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}'
}

get_mem_usage() {
    free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}'
}

get_mem_details() {
    free -h | grep Mem | awk '{print $3 "/" $2}'
}

get_disk_usage() {
    df -h "$MONITOR_DISK_PATH" | tail -1 | awk '{print $5}' | sed 's/%//'
}

get_disk_details() {
    df -h "$MONITOR_DISK_PATH" | tail -1 | awk '{print $3 "/" $2}'
}

get_disk_mount() {
    df -h "$MONITOR_DISK_PATH" | tail -1 | awk '{print $6}'
}

get_load_avg() {
    uptime | awk -F'load average:' '{print $2}' | sed 's/^[ \t]*//'
}

get_uptime() {
    uptime -p 2>/dev/null | sed 's/up //' || uptime | awk '{print $3 " " $4}' | sed 's/,//'
}

# JSON output
if [[ "$JSON" == true ]]; then
    cpu=$(get_cpu_usage)
    mem=$(get_mem_usage)
    mem_details=$(get_mem_details)
    disk=$(get_disk_usage)
    disk_details=$(get_disk_details)
    load=$(get_load_avg)
    uptime_val=$(get_uptime)
    
    cat <<EOF
{
  "timestamp": "$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')",
  "cpu_percent": $cpu,
  "memory_percent": $mem,
  "memory_usage": "$mem_details",
  "disk_percent": $disk,
  "disk_usage": "$disk_details",
  "disk_mount": "$(get_disk_mount)",
  "load_average": "$load",
  "uptime": "$uptime_val"
}
EOF
    exit 0
fi

# Compact output
if [[ "$COMPACT" == true ]]; then
    cpu=$(get_cpu_usage)
    mem=$(get_mem_usage)
    disk=$(get_disk_usage)
    load=$(get_load_avg | awk '{print $1}')
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] CPU:${cpu}% MEM:${mem}% DISK:${disk}% LOAD:${load}"
    exit 0
fi

# Display function
show_stats() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           SYSTEM RESOURCE MONITOR                      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # CPU
    cpu=$(get_cpu_usage)
    cpu_int=${cpu%.*}
    if [[ $cpu_int -gt ${ALERT_CPU_THRESHOLD:-80} ]]; then
        color=$RED
        [[ "$ALERT" == true ]] && echo -e "${RED}[ALERT]${NC} CPU usage is high!"
    elif [[ $cpu_int -gt 60 ]]; then
        color=$YELLOW
    else
        color=$GREEN
    fi
    echo -e "${BLUE}CPU Usage:${NC}      ${color}${cpu}%${NC}"
    
    # Memory
    mem=$(get_mem_usage)
    mem_details=$(get_mem_details)
    mem_int=${mem%.*}
    if [[ $mem_int -gt ${ALERT_MEM_THRESHOLD:-90} ]]; then
        color=$RED
        [[ "$ALERT" == true ]] && echo -e "${RED}[ALERT]${NC} Memory usage is critical!"
    elif [[ $mem_int -gt 75 ]]; then
        color=$YELLOW
    else
        color=$GREEN
    fi
    echo -e "${BLUE}Memory Usage:${NC}   ${color}${mem}%${NC} ($mem_details)"
    
    # Disk
    disk=$(get_disk_usage)
    disk_details=$(get_disk_details)
    disk_mount=$(get_disk_mount)
    if [[ $disk -gt ${ALERT_DISK_THRESHOLD:-85} ]]; then
        color=$RED
        [[ "$ALERT" == true ]] && echo -e "${RED}[ALERT]${NC} Disk space is critical!"
    elif [[ $disk -gt 75 ]]; then
        color=$YELLOW
    else
        color=$GREEN
    fi
    echo -e "${BLUE}Disk Usage:${NC}     ${color}${disk}%${NC} ($disk_details) ${CYAN}[$disk_mount]${NC}"
    
    # Load average
    load=$(get_load_avg)
    echo -e "${BLUE}Load Average:${NC}   ${GREEN}${load}${NC}"
    
    # Uptime
    uptime_val=$(get_uptime)
    echo -e "${BLUE}Uptime:${NC}         ${GREEN}${uptime_val}${NC}"
    
    # Docker stats if available
    if command -v docker &> /dev/null; then
        docker_count=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')
        echo -e "${BLUE}Docker Containers:${NC} ${GREEN}${docker_count} running${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}────────────────────────────────────────────────────────${NC}"
    
    if [[ $WATCH -gt 0 ]]; then
        echo -e "Refreshing every ${WATCH} seconds... (Ctrl+C to exit)"
    else
        echo -e "Run with ${YELLOW}-w N${NC} to refresh every N seconds"
    fi
}

# Main loop
if [[ $WATCH -gt 0 ]]; then
    while true; do
        show_stats
        sleep "$WATCH"
    done
else
    show_stats
fi

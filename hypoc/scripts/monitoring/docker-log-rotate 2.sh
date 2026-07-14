#!/bin/bash
# Docker Log Rotation Script
# Rotates and compresses Docker container logs to save disk space

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load configuration
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/.env"
fi

# Configuration with defaults
MAX_LOG_SIZE_MB=${MAX_LOG_SIZE_MB:-100}
KEEP_ROTATED=${KEEP_ROTATED:-7}
LOG_DIR=${LOG_DIR:-/var/lib/docker/containers}
BACKUP_DIR=${BACKUP_DIR:-/var/log/docker-backups}
ENABLE_COLORS=${ENABLE_COLORS:-true}

# Colors for output
if [[ "$ENABLE_COLORS" == "true" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (for accessing Docker logs)"
   exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Get all running containers
CONTAINERS=$(docker ps --format '{{.ID}}:{{.Names}}')

if [[ -z "$CONTAINERS" ]]; then
    log_warn "No running containers found"
    exit 0
fi

log_info "Starting Docker log rotation..."
log_info "Max log size: ${MAX_LOG_SIZE_MB}MB, Keep rotated: ${KEEP_ROTATED}"

# Process each container
while IFS=: read -r container_id container_name; do
    log_file="${LOG_DIR}/${container_id}/${container_id}-json.log"
    
    if [[ ! -f "$log_file" ]]; then
        log_warn "Log file not found for container $container_name ($container_id)"
        continue
    fi
    
    # Get log file size in MB
    size_bytes=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null)
    size_mb=$((size_bytes / 1024 / 1024))
    
    if [[ $size_mb -gt $MAX_LOG_SIZE_MB ]]; then
        log_info "Rotating logs for $container_name (${size_mb}MB)"
        
        # Create timestamped backup
        timestamp=$(date +%Y%m%d-%H%M%S)
        backup_file="${BACKUP_DIR}/${container_name}-${timestamp}.log"
        
        # Copy and compress
        cp "$log_file" "$backup_file"
        gzip "$backup_file"
        log_info "  Backed up to ${backup_file}.gz"
        
        # Truncate the original log file
        truncate -s 0 "$log_file"
        log_info "  Truncated $container_name log"
        
        # Clean up old rotated logs
        old_logs=$(find "$BACKUP_DIR" -name "${container_name}-*.log.gz" | sort -r | tail -n +$((KEEP_ROTATED + 1)))
        if [[ -n "$old_logs" ]]; then
            echo "$old_logs" | while read -r old_log; do
                rm -f "$old_log"
                log_info "  Removed old backup: $(basename "$old_log")"
            done
        fi
    else
        log_info "$container_name: ${size_mb}MB (OK)"
    fi
done <<< "$CONTAINERS"

# Show disk usage summary
log_info "Disk usage summary:"
df -h "$LOG_DIR" "$BACKUP_DIR" | tail -n +2

log_info "Log rotation complete!"

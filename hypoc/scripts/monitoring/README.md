# Docker & System Monitoring Scripts

Simple shell scripts for monitoring and managing Docker logs and system resources on EC2.

## Quick Start

1. **Copy to your EC2 instance:**
```bash
scp -r scripts/monitoring ec2-user@your-ec2-ip:/home/ec2-user/
```

2. **Configure:**
```bash
cd monitoring
cp .env.example .env
nano .env  # Edit your settings
```

3. **Make executable:**
```bash
chmod +x *.sh
```

4. **Test:**
```bash
./system-monitor.sh
```

## Configuration

Edit `.env` to customize:
- Log rotation thresholds and retention
- Alert thresholds for CPU/Memory/Disk
- Output formatting and colors
- Backup directories

## Scripts

### 1. docker-log-rotate.sh
Automatically rotates and compresses Docker container logs.

**Features:**
- Rotates logs when they exceed a size threshold (default: 100MB)
- Compresses old logs with gzip
- Keeps configurable number of rotated logs (default: 7)
- Runs per-container rotation

**Usage:**
```bash
# Run manually
sudo ./docker-log-rotate.sh

# Configure via .env file (recommended)
# Edit MAX_LOG_SIZE_MB and KEEP_ROTATED in .env

# Add to cron (daily at 2am)
echo "0 2 * * * /opt/monitoring/docker-log-rotate.sh >> /var/log/docker-rotation.log 2>&1" | sudo crontab -
```

### 2. docker-log-search.sh
Search Docker container logs with grep-like functionality.

**Usage:**
```bash
# Search all containers for "error"
./docker-log-search.sh error

# Case-insensitive search
./docker-log-search.sh -i ERROR

# Search specific container
./docker-log-search.sh -c nginx "connection refused"

# Show context (5 lines before and after)
./docker-log-search.sh -B 5 -A 5 exception

# Follow logs (like tail -f)
./docker-log-search.sh -f "starting server"

# Search logs from last hour
./docker-log-search.sh -s 1h "failed"

# List all containers
./docker-log-search.sh -l
```

### 3. docker-stats.sh
Monitor Docker container resource usage.

**Usage:**
```bash
# Live monitoring (press Ctrl+C to exit)
./docker-stats.sh

# Show once and exit
./docker-stats.sh -o

# Monitor specific container
./docker-stats.sh -c nginx

# Alert if CPU >80% or Memory >90% (uses .env thresholds by default)
./docker-stats.sh -a 80 90

# JSON output
./docker-stats.sh -o -j
```

### 4. system-monitor.sh
Monitor system-wide resources (CPU, memory, disk, load).

**Usage:**
```bash
# Show current stats
./system-monitor.sh

# Refresh every 5 seconds
./system-monitor.sh -w 5

# Compact one-line output (good for logging)
./system-monitor.sh -c

# JSON output
./system-monitor.sh -j

# Enable alerts (uses .env thresholds)
./system-monitor.sh -w 10 -a
```

## Installation (Production Setup)

1. **Move scripts to system directory:**
```bash
sudo mkdir -p /opt/monitoring
sudo cp *.sh .env /opt/monitoring/
sudo chmod +x /opt/monitoring/*.sh
```

2. **Add to PATH (optional):**
```bash
echo 'export PATH=$PATH:/opt/monitoring' >> ~/.bashrc
source ~/.bashrc
```

3. **Set up cron jobs for automation:**
```bash
# Edit crontab
crontab -e

# Add these lines:
# Rotate logs daily at 2am
0 2 * * * sudo /opt/monitoring/docker-log-rotate.sh >> /var/log/docker-rotation.log 2>&1

# Log system stats every 10 minutes
*/10 * * * * /opt/monitoring/system-monitor.sh -c >> /var/log/system-stats.log 2>&1

# Alert on high resource usage every 5 minutes
*/5 * * * * /opt/monitoring/docker-stats.sh -o -a >> /var/log/docker-alerts.log 2>&1
```

4. **Set up log rotation for monitoring logs:**
```bash
sudo tee /etc/logrotate.d/monitoring <<EOF
/var/log/docker-rotation.log
/var/log/system-stats.log
/var/log/docker-alerts.log
{
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 $(whoami) $(whoami)
}
EOF
```

## Quick Commands

```bash
# Check disk space used by Docker
du -sh /var/lib/docker/

# See largest Docker logs
sudo find /var/lib/docker/containers -name "*-json.log" -exec du -h {} \; | sort -h | tail -10

# View rotated logs
ls -lh /var/log/docker-backups/
zcat /var/log/docker-backups/container-name-20240101-020000.log.gz | grep error

# Monitor everything in tmux
tmux new -s monitor
# Split panes (Ctrl+B then %) and run:
# Pane 1: ./system-monitor.sh -w 5
# Pane 2: ./docker-stats.sh
# Pane 3: ./docker-log-search.sh -f error
```

## Troubleshooting

**"Permission denied" errors:**
- Run log rotation script with `sudo`
- Ensure scripts are executable: `chmod +x *.sh`

**Can't find docker command:**
- Check Docker is installed: `docker --version`
- Add user to docker group: `sudo usermod -aG docker $USER` (logout/login required)

**Scripts not in PATH:**
- Use full path: `/opt/monitoring/docker-stats.sh`
- Or add to PATH: `export PATH=$PATH:/opt/monitoring`

**No color output:**
- Set `ENABLE_COLORS=true` in `.env`
- Check terminal supports colors: `echo $TERM`

**Alerts not working:**
- Check thresholds in `.env` are set (not 0)
- Run with `-a` flag explicitly for testing

## Requirements

- Docker installed
- Bash 4.0+
- Standard Unix tools (grep, awk, sed, bc, free, df, top)
- Root access for log rotation (sudo)

## Advanced Usage

### Create a monitoring dashboard script:
```bash
#!/bin/bash
# dashboard.sh - All-in-one monitoring view

tmux new-session -d -s monitor
tmux split-window -h
tmux split-window -v
tmux select-pane -t 0
tmux split-window -v

tmux send-keys -t 0 '/opt/monitoring/system-monitor.sh -w 5' C-m
tmux send-keys -t 1 '/opt/monitoring/docker-stats.sh' C-m
tmux send-keys -t 2 '/opt/monitoring/docker-log-search.sh -f -i error' C-m
tmux send-keys -t 3 'watch -n 10 df -h' C-m

tmux attach-session -t monitor
```

### Export metrics to a file:
```bash
# Log all metrics every minute
* * * * * /opt/monitoring/system-monitor.sh -j >> /var/log/metrics/system-$(date +\%Y\%m\%d).json
* * * * * /opt/monitoring/docker-stats.sh -o -j >> /var/log/metrics/docker-$(date +\%Y\%m\%d).json
```

### Send alerts via email (requires mailutils):
```bash
# In .env, set ALERT_EMAIL=your@email.com
# Then in cron:
*/5 * * * * /opt/monitoring/docker-stats.sh -o -a 80 90 2>&1 | grep -i alert && echo "Container alert detected" | mail -s "Docker Alert" $ALERT_EMAIL
```

## License

These scripts are provided as-is for monitoring Docker and system resources.

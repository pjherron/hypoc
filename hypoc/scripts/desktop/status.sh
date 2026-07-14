#!/bin/bash
# Check OpenCode Desktop status

echo "🔍 OpenCode Desktop Status"
echo "=========================="
echo ""

# Check if image exists
if docker images | grep -q "opencode-desktop"; then
    echo "✅ Image: Built"
    docker images | grep opencode-desktop | awk '{print "   Size: " $7 " " $8 ", Created: " $4 " " $5 " " $6}'
else
    echo "⏳ Image: Not built yet (build in progress or not started)"
fi

echo ""

# Check if container exists
if docker ps -a | grep -q "opencode-desktop"; then
    echo "✅ Container: Exists"
    if docker ps | grep -q "opencode-desktop"; then
        echo "   Status: Running ✅"
    else
        echo "   Status: Stopped"
    fi
else
    echo "⏳ Container: Not created yet"
fi

echo ""

# Check Docker build processes
if ps aux | grep -v grep | grep -q "docker.*build"; then
    echo "🔨 Build: In Progress"
else
    echo "Build: Not running"
fi

echo ""
echo "Commands:"
echo "  Start:  bash scripts/desktop/start.sh"
echo "  Shell:  bash scripts/desktop/shell.sh"
echo "  Stop:   bash scripts/desktop/stop.sh"

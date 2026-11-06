#!/bin/bash
# OS Detection Script for Orange Pi
# Helps identify the Linux distribution and available package managers

echo "🔍 Detecting Orange Pi OS..."
echo ""

# Try to get OS info
if [ -f /etc/os-release ]; then
    echo "=== /etc/os-release ==="
    cat /etc/os-release
    echo ""
fi

if [ -f /etc/issue ]; then
    echo "=== /etc/issue ==="
    cat /etc/issue
    echo ""
fi

echo "=== Package Manager Detection ==="
for pm in apt apk dnf yum pacman zypper; do
    if command -v $pm &> /dev/null; then
        echo "✅ Found: $pm"
        $pm --version 2>/dev/null || true
    else
        echo "❌ Not found: $pm"
    fi
done

echo ""
echo "=== Python Info ==="
if command -v python3 &> /dev/null; then
    echo "✅ Python 3: $(python3 --version)"
else
    echo "❌ Python 3 not found"
fi

if command -v pip3 &> /dev/null; then
    echo "✅ pip3: $(pip3 --version)"
else
    echo "❌ pip3 not found"
fi

if command -v python3-venv &> /dev/null || python3 -m venv --help &> /dev/null; then
    echo "✅ venv module available"
else
    echo "❌ venv module not found"
fi

echo ""
echo "=== Node.js Info ==="
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
fi

echo ""
echo "=== System Info ==="
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Hostname: $(hostname)"

echo ""
echo "=== Available Shells ==="
if [ -f /etc/shells ]; then
    cat /etc/shells
fi

echo ""
echo "=== Systemd Status ==="
if command -v systemctl &> /dev/null; then
    echo "✅ systemd available"
    systemctl --version | head -n 1
else
    echo "❌ systemd not found (using alternative init system)"
fi

echo ""
echo "=== Docker Status ==="
if command -v docker &> /dev/null; then
    echo "✅ Docker available"
    docker --version
else
    echo "❌ Docker not found"
fi

echo ""
echo "=== Disk Space ==="
df -h | head -n 5

echo ""
echo "=== Memory Info ==="
free -h

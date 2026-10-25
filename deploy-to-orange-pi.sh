#!/bin/bash
# Deployment script for Orange Pi
# Usage: ./deploy-to-orange-pi.sh [orange-pi-ip]

ORANGE_PI_IP=${1:-"100.96.75.45"}
PROJECT_NAME="holamotor"
REMOTE_DIR="/opt/${PROJECT_NAME}"

echo "🚀 Deploying ${PROJECT_NAME} to Orange Pi at ${ORANGE_PI_IP}"

# 1. Create backup on remote
echo "📦 Creating backup..."
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && [ -d data ] && tar -czf data-backup-\$(date +%Y%m%d-%H%M%S).tar.gz data || true"

# 2. Stop existing container
echo "🛑 Stopping existing container..."
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && docker-compose down || true"

# 3. Copy project files
echo "📋 Copying project files..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude 'data' \
  --exclude '*.log' \
  ./ root@${ORANGE_PI_IP}:${REMOTE_DIR}/

# 4. Build and start on Orange Pi
echo "🔨 Building and starting on Orange Pi..."
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && docker-compose up -d --build"

# 5. Check status
echo "✅ Checking status..."
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && docker-compose ps"

echo "🎉 Deployment complete!"
echo "🌐 Access the app at: http://${ORANGE_PI_IP}"

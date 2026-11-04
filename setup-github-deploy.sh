#!/bin/bash
# Setup script for GitHub Actions auto-deployment to Orange Pi
# Run this on your local machine (Windows Git Bash or WSL)

set -e

ORANGE_PI_IP="192.168.1.134"
ORANGE_PI_USER="oem"
SSH_KEY_PATH="$HOME/.ssh/orange_pi_deploy"

echo "🚀 Setting up GitHub Actions auto-deployment to Orange Pi..."
echo ""

# Step 1: Generate SSH key pair
echo "📝 Step 1: Generating SSH key pair..."
if [ -f "$SSH_KEY_PATH" ]; then
  echo "⚠️  SSH key already exists at $SSH_KEY_PATH"
  read -p "Do you want to use existing key? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    ssh-keygen -t ed25519 -a 100 -f "$SSH_KEY_PATH" -C "github-actions-deploy" -N ""
    echo "✅ New SSH key generated"
  else
    echo "✅ Using existing SSH key"
  fi
else
  ssh-keygen -t ed25519 -a 100 -f "$SSH_KEY_PATH" -C "github-actions-deploy" -N ""
  echo "✅ SSH key generated"
fi

# Step 2: Copy public key to Orange Pi
echo ""
echo "📝 Step 2: Copying public key to Orange Pi..."
echo "You may need to enter the Orange Pi password (oem)"
if command -v ssh-copy-id &> /dev/null; then
  ssh-copy-id -i "$SSH_KEY_PATH.pub" "$ORANGE_PI_USER@$ORANGE_PI_IP"
else
  echo "ssh-copy-id not found. Manual method:"
  cat "$SSH_KEY_PATH.pub"
  echo ""
  echo "Please add the above key to Orange Pi's ~/.ssh/authorized_keys"
  read -p "Press Enter once you've added the key..."
fi

# Step 3: Test SSH connection
echo ""
echo "📝 Step 3: Testing SSH connection..."
if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$ORANGE_PI_USER@$ORANGE_PI_IP" "echo 'SSH connection successful'" 2>/dev/null; then
  echo "✅ SSH connection successful"
else
  echo "❌ SSH connection failed. Please check the key setup."
  exit 1
fi

# Step 4: Copy deployment script to Orange Pi
echo ""
echo "📝 Step 4: Copying deployment script to Orange Pi..."
if [ -f "deploy-orange-pi-local.sh" ]; then
  scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no deploy-orange-pi-local.sh "$ORANGE_PI_USER@$ORANGE_PI_IP":Desktop/holamotor-angular/
  ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$ORANGE_PI_USER@$ORANGE_PI_IP" "chmod +x Desktop/holamotor-angular/deploy-orange-pi-local.sh"
  echo "✅ Deployment script copied"
else
  echo "⚠️  deploy-orange-pi-local.sh not found. Skipping."
fi

# Step 5: Display private key for GitHub secret
echo ""
echo "📝 Step 5: Add this private key to GitHub Secrets:"
echo "======================================"
cat "$SSH_KEY_PATH"
echo "======================================"
echo ""
echo "Instructions:"
echo "1. Go to your GitHub repository"
echo "2. Settings → Secrets and variables → Actions"
echo "3. Add these secrets:"
echo "   - ORANGE_PI_SSH_KEY: (paste the entire key above, including BEGIN/END lines)"
echo "   - ORANGE_PI_IP: $ORANGE_PI_IP"
echo "   - ORANGE_PI_USER: $ORANGE_PI_USER"
echo "   - ORANGE_PI_DIR: Desktop/holamotor-angular"
echo ""

# Step 6: Check if git remote is set
echo "📝 Step 6: Checking git remote..."
if git remote get-url origin &> /dev/null; then
  echo "✅ Git remote configured: $(git remote get-url origin)"
else
  echo "⚠️  No git remote configured. Run:"
  echo "   git remote add origin <your-github-repo-url>"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the SSH key to GitHub Secrets (see above)"
echo "2. Commit and push the workflow files:"
echo "   git add .github/workflows/deploy-orange-pi.yml"
echo "   git add deploy-orange-pi-local.sh"
echo "   git add GITHUB-DEPLOYMENT.md"
echo "   git commit -m 'Add GitHub Actions auto-deployment'"
echo "   git push origin main"
echo ""
echo "3. Monitor the deployment in GitHub Actions tab"

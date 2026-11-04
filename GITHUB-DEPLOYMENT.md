# GitHub Auto-Deployment to Orange Pi

This guide sets up automatic deployment to your Orange Pi whenever you push code to GitHub.

## Overview

When you push to the `main` or `master` branch, GitHub Actions will:
1. Checkout your code
2. Deploy it to Orange Pi via SSH
3. Restart the service automatically
4. Verify the deployment

## Prerequisites

- Orange Pi accessible at `192.168.1.134`
- SSH access to Orange Pi
- GitHub repository for this project

## Step 1: Generate SSH Key Pair

Generate an SSH key pair on your local machine (Windows):

```bash
# In Git Bash or PowerShell
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/orange_pi_deploy -C "github-actions-deploy"
```

**Important:** Leave the passphrase empty (press Enter twice).

This creates:
- Private key: `~/.ssh/orange_pi_deploy`
- Public key: `~/.ssh/orange_pi_deploy.pub`

## Step 2: Add Public Key to Orange Pi

Copy the public key to Orange Pi:

```bash
# Copy public key to Orange Pi
ssh-copy-id -i ~/.ssh/orange_pi_deploy.pub oem@192.168.1.134
```

Or manually:

```bash
# View the public key
cat ~/.ssh/orange_pi_deploy.pub

# SSH into Orange Pi
ssh oem@192.168.1.134

# Add to authorized_keys
mkdir -p ~/.ssh
echo "<paste the public key here>" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## Step 3: Test SSH Connection

Test that the key works:

```bash
ssh -i ~/.ssh/orange_pi_deploy oem@192.168.1.134
```

You should be able to connect without entering a password.

## Step 4: Configure GitHub Secrets

Go to your GitHub repository and add the following secrets:

### Navigate to Secrets:
1. Open your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `ORANGE_PI_SSH_KEY` | Contents of `~/.ssh/orange_pi_deploy` | Private SSH key |
| `ORANGE_PI_IP` | `192.168.1.134` | Orange Pi IP address |
| `ORANGE_PI_USER` | `oem` | SSH username |
| `ORANGE_PI_DIR` | `Desktop/holamotor-angular` | Project directory on Orange Pi |

### How to add the SSH key secret:

```bash
# On Windows (Git Bash)
cat ~/.ssh/orange_pi_deploy

# Copy the entire output (including BEGIN/END lines)
# Paste it as the value for ORANGE_PI_SSH_KEY
```

**Important:** Include the full key including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
<key content>
-----END OPENSSH PRIVATE KEY-----
```

## Step 5: Push to GitHub

Commit and push the workflow file:

```bash
git add .github/workflows/deploy-orange-pi.yml
git add deploy-orange-pi-local.sh
git commit -m "Add GitHub Actions auto-deployment to Orange Pi"
git push origin main
```

## Step 6: Monitor Deployment

After pushing, go to GitHub:
1. Click on the **Actions** tab
2. You'll see the "Deploy to Orange Pi" workflow running
3. Click on it to view the deployment logs

## How It Works

### Workflow File: `.github/workflows/deploy-orange-pi.yml`

The workflow:
1. **Triggers:** On push to `main` or `master` branch
2. **Checks out** your code
3. **Sets up SSH** using the secret key
4. **Deploys files** using rsync (excludes: node_modules, dist, .git, data)
5. **Restarts service** by running `deploy-orange-pi-local.sh`
6. **Verifies** the deployment status

### Deployment Script: `deploy-orange-pi-local.sh`

This script runs on the Orange Pi:
1. Creates a backup of existing data
2. Stops the current service (Docker or systemd)
3. Rebuilds and starts the service
4. Shows the status

## Manual Deployment

You can also trigger deployment manually:

1. Go to GitHub → **Actions** tab
2. Select **Deploy to Orange Pi** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

## Troubleshooting

### SSH Connection Failed

**Problem:** GitHub Actions can't connect to Orange Pi

**Solutions:**
1. Verify Orange Pi is accessible: `ping 192.168.1.134`
2. Check SSH key is correctly added to `~/.ssh/authorized_keys` on Orange Pi
3. Ensure the private key in GitHub secrets includes the full key (BEGIN/END lines)
4. Check the Orange Pi user has permissions to restart services

### Permission Denied

**Problem:** Can't restart service on Orange Pi

**Solutions:**
1. Add the user to sudoers: `sudo visudo` and add:
   ```
   oem ALL=(ALL) NOPASSWD: /bin/systemctl start holamotor
   oem ALL=(ALL) NOPASSWD: /bin/systemctl stop holamotor
   oem ALL=(ALL) NOPASSWD: /bin/systemctl restart holamotor
   ```
2. Or use Docker which doesn't require sudo

### Docker Compose Not Found

**Problem:** Docker is not installed on Orange Pi

**Solution:** Install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker oem
```

### Workflow Not Triggering

**Problem:** Push doesn't trigger deployment

**Solutions:**
1. Check branch name matches (`main` or `master`)
2. Verify workflow file is in `.github/workflows/` directory
3. Check GitHub Actions is enabled in repository settings

## Security Best Practices

1. **Never commit** the private SSH key to the repository
2. **Use a dedicated key** for GitHub Actions (not your personal key)
3. **Limit permissions** - the key should only have access to the deployment directory
4. **Rotate keys** periodically if security is a concern
5. **Monitor workflow logs** to detect unauthorized access attempts

## Alternative: Using Docker Hub

If SSH deployment is problematic, consider using Docker Hub:

1. Build and push Docker image from GitHub Actions
2. Orange Pi pulls the new image automatically
3. No SSH keys required

Example workflow for Docker Hub:
```yaml
- name: Build and push Docker image
  run: |
    docker buildx build --platform linux/arm64 -t yourusername/holamotor:latest --push .
```

Then on Orange Pi:
```yaml
docker-compose pull
docker-compose up -d
```

## Rollback

If deployment fails, you can rollback:

```bash
# SSH into Orange Pi
ssh oem@192.168.1.134

# Restore from backup
cd ~/holamotor-backups
tar -xzf data-backup-YYYYMMDD.tar.gz -C ~/Desktop/holamotor-angular/

# Restart service
cd ~/Desktop/holamotor-angular
docker-compose up -d
```

## Support

For issues:
- Check GitHub Actions logs
- Review Orange Pi logs: `docker-compose logs -f` or `sudo journalctl -u holamotor -f`
- Verify network connectivity between GitHub and Orange Pi

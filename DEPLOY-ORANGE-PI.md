# Deploy to Orange Pi via Tailscale

## Prerequisites
- Orange Pi connected to Tailscale (IP: 100.96.75.45)
- Docker installed on Orange Pi
- SSH access to Orange Pi

## Quick Deployment (Recommended)

### Option 1: Manual SSH Deployment

1. **SSH into Orange Pi:**
   ```bash
   ssh root@100.96.75.45
   ```

2. **Create project directory:**
   ```bash
   mkdir -p /opt/holamotor
   cd /opt/holamotor
   ```

3. **Copy project files from Windows:**
   On Windows (in PowerShell):
   ```powershell
   # Copy all files (excluding node_modules, dist, .git, data)
   scp -r .\* root@100.96.75.45:/opt/holamotor/
   ```

   Or use WinSCP/FileZilla to transfer files to `/opt/holamotor/`

4. **On Orange Pi, build and start:**
   ```bash
   cd /opt/holamotor
   docker-compose up -d --build
   ```

5. **Access the app:**
   ```
   http://100.96.75.45
   ```

### Option 2: Git-based Deployment

1. **Push code to Git repository:**
   ```bash
   git add .
   git commit -m "Deploy to Orange Pi"
   git push origin main
   ```

2. **On Orange Pi:**
   ```bash
   ssh root@100.96.75.45
   mkdir -p /opt/holamotor
   cd /opt/holamotor
   git clone <your-repo-url> .
   docker-compose up -d --build
   ```

### Option 3: Using Docker Hub (Best for continuous deployment)

1. **Build and push Docker image:**
   ```bash
   docker buildx build --platform linux/arm64 -t your-username/holamotor:latest --push .
   ```

2. **On Orange Pi:**
   ```bash
   ssh root@100.96.75.45
   mkdir -p /opt/holamotor
   cd /opt/holamotor

   # Create docker-compose.yml
   cat > docker-compose.yml <<EOF
   services:
     holamotor:
       image: your-username/holamotor:latest
       container_name: holamotor
       restart: unless-stopped
       ports:
         - "80:8080"
       volumes:
         - ./data:/data
       environment:
         - TZ=Europe/Madrid
   EOF

   docker-compose up -d
   ```

## Verify Deployment

Check if the container is running:
```bash
ssh root@100.96.75.45 "cd /opt/holamotor && docker-compose ps"
```

View logs:
```bash
ssh root@100.96.75.45 "cd /opt/holamotor && docker-compose logs -f"
```

## Access from Anywhere

Once deployed, access the app from any device on your Tailscale network:
- **HTTP:** http://100.96.75.45
- **HTTPS:** https://orange-os.tail72b52c.ts.net (if HTTPS is configured)

## Troubleshooting

### Container won't start
```bash
ssh root@100.96.75.45 "cd /opt/holamotor && docker-compose logs"
```

### Port already in use
```bash
ssh root@100.96.75.45 "lsof -i :80"
```

### Rebuild container
```bash
ssh root@100.96.75.45 "cd /opt/holamotor && docker-compose down && docker-compose up -d --build"
```

### Update the app
```bash
# From Windows
scp -r .\* root@100.96.75.45:/opt/holamotor/

# On Orange Pi
ssh root@100.96.75.45 "cd /opt/holamotor && docker-compose up -d --build"
```

## Data Persistence

The app stores data in the `./data` directory on the Orange Pi. This directory is mounted as a volume and will persist across container updates.

## Security Notes

- The app is only accessible via Tailscale network
- No external port exposure (only accessible through Tailscale VPN)
- Consider adding authentication if needed in the future

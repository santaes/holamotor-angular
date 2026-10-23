# HolaMotor en Orange Pi

The app runs as a single Node.js process (`server/index.js`, no npm dependencies) that:

- serves the built Angular app, and
- stores all data (customers, orders, inventory, invoices, appointments) as JSON files in a data folder, so every device on the network shares the same data.

API: `GET /api/health`, `GET /api/data`, `GET|PUT|DELETE /api/data/:key`.

## Option A: Docker (recommended)

On the Orange Pi (Armbian / Ubuntu / Debian, arm64 or armv7):

```bash
curl -fsSL https://get.docker.com | sudo sh
git clone <your-repo> holamotor && cd holamotor   # or copy the folder with scp
sudo docker compose up -d --build
```

Open `http://<ip-of-the-pi>/`. Data is kept in `./data` next to `docker-compose.yml`.

Update: `git pull && sudo docker compose up -d --build`

## Option B: systemd (no Docker)

```bash
cd holamotor
chmod +x deploy/install.sh
sudo ./deploy/install.sh
```

The script installs Node.js 20 if needed, builds the app (skipped if `dist/` already exists),
copies it to `/opt/holamotor` and starts the `holamotor` service on port 8080.

- Open: `http://<ip-of-the-pi>:8080/`
- Logs: `journalctl -u holamotor -f`
- Data: `/var/lib/holamotor`

Tip: building Angular on a small Pi is slow. You can run `npm run build` on your PC and copy the
whole folder (including `dist/`) to the Pi; the installer will then skip the build.

## Backups

All data is in the data folder (one `.json` file per collection, plus a `.bak` of the previous
version). Copy that folder to back up, e.g. a daily cron job:

```bash
0 3 * * * tar czf /home/orangepi/holamotor-$(date +\%F).tgz -C /var/lib holamotor
```

## Local development

```bash
npm run server   # API + built app on http://localhost:8080
npm start        # ng serve on :4200, proxies /api to :8080
```

If the server is not running, the app falls back to browser localStorage. The first time the
app connects to an empty server, it uploads the data that browser already had.

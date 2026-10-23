# HolaMotor en Orange Pi

The app runs as a single Node.js process (`server/index.js`, no npm dependencies) that:

- serves the built Angular app,
- stores all data (customers, orders, inventory, invoices, appointments, settings) as JSON files in a data folder, and
- pushes every change live to all open browsers (Server-Sent Events), so every device on the network sees the same data without reloading.

API: `GET /api/health`, `GET /api/data`, `GET|PUT|DELETE /api/data/:key`, `GET /api/events` (live changes).

## Languages

The app is available in Spanish, Russian and Ukrainian (language menu in the top bar or in Configuración; saved per browser).
Server messages follow the app language (`X-Lang` header) or the browser `Accept-Language`; logs use `HOLAMOTOR_LANG` (`es` | `ru` | `uk`, default `es`):

```bash
HOLAMOTOR_LANG=uk node server/index.js
```

For systemd add `Environment=HOLAMOTOR_LANG=uk` to `deploy/holamotor.service`; for Docker add `- HOLAMOTOR_LANG=uk` under `environment:` in `docker-compose.yml`.

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

Configuración → "Exportar copia" downloads a JSON backup and "Importar copia" restores it.
On the Pi all data is also in the data folder (one `.json` file per collection, plus a `.bak` of
the previous version). Example daily cron job:

```bash
0 3 * * * tar czf /home/orangepi/holamotor-$(date +\%F).tgz -C /var/lib holamotor
```

## Local development

```bash
npm run build && npm run server   # app + API on http://localhost:8080 (recommended for testing sync)
npm start                         # ng serve on :4200, proxies /api to :8080
```

If the server is not running, the app falls back to browser localStorage. The first time the
app connects to an empty server, it uploads the data that browser already had.

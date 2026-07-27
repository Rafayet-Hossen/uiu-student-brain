# Setup guide: Windows and Linux

This is a side-by-side setup guide for teammates on **Windows** or
**Linux**. If you're on macOS, follow the Linux column — the commands are
the same. It assumes you've never used Django, uv, or Docker before.

For day-to-day commands once you're set up (testing, troubleshooting, what
a working page looks like), see [RUNNING.md](RUNNING.md) — this file only
covers first-time setup, with both operating systems shown explicitly.

---

## 1. Install these tools first

Install each one, then run its `--version` command to confirm it worked.

### Git

| OS | Install | Verify |
|---|---|---|
| Windows | Download and run the installer: https://git-scm.com/downloads — this also installs **Git Bash**, a terminal that understands Linux-style commands, which is what the commands below assume. | `git --version` |
| Linux | `sudo pacman -S git` (Arch) or `sudo apt install git` (Debian/Ubuntu), or download from https://git-scm.com/downloads | `git --version` |

### uv (manages the backend's Python and packages)

| OS | Install | Verify |
|---|---|---|
| Windows | In PowerShell: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 \| iex"` | `uv --version` |
| Linux | `curl -LsSf https://astral.sh/uv/install.sh \| sh` | `uv --version` |

You do **not** need to install Python yourself — `uv` downloads and manages
the right version for you (this project needs Python 3.14+).

### Node.js 20+ (runs the frontend)

| OS | Install | Verify |
|---|---|---|
| Windows | Download the LTS installer from https://nodejs.org/ and run it. | `node --version` |
| Linux | Download the LTS installer from https://nodejs.org/, or use your package manager (e.g. `sudo pacman -S nodejs npm`). | `node --version` |

### Docker Desktop (runs PostgreSQL in a container)

| OS | Install | Verify |
|---|---|---|
| Windows | Download Docker Desktop from https://www.docker.com/products/docker-desktop/. It requires **WSL2** — the installer will prompt you to enable it if it isn't already; follow its instructions and restart when asked. | `docker --version` and `docker compose version` |
| Linux | Download Docker Desktop from the same link, or install the Docker Engine + Compose plugin via your package manager (e.g. on Arch: `sudo pacman -S docker docker-compose`, then `sudo systemctl enable --now docker`). | `docker --version` and `docker compose version` |

**Linux only — one extra step:** add yourself to the `docker` group so you
don't need `sudo` for every Docker command:
```bash
sudo usermod -aG docker $USER
```
Then fully log out and back in (or run `newgrp docker` in your current
terminal) for it to take effect.

---

## 2. Clone the repo

Windows: open **Git Bash** (not Command Prompt or PowerShell, so the rest
of these commands work as written). Linux: open your terminal.

```bash
git clone https://github.com/Rafayet-Hossen/student-brain.git
cd student-brain
```
This downloads the project and moves you into its folder. Run every
command below from here unless told otherwise.

---

## 3. Create your `.env` file

```bash
cp .env.example .env
```
This works in Git Bash on Windows and in any Linux terminal, since `cp` is
a Git Bash command too. (If you're using Windows' plain Command Prompt
instead of Git Bash, use `copy .env.example .env`; in PowerShell, use
`Copy-Item .env.example .env`.)

Open `.env` in your editor. The backend reads this file on startup (via
`django-environ`) and connects to Postgres using these values, so make sure
the file exists before running any backend commands later.

| Variable | What to put |
|---|---|
| `DJANGO_SECRET_KEY` | Leave as `changeme` for local development. |
| `DJANGO_DEBUG` | Leave as `True` locally. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Leave as-is — these match `docker-compose.yml`. |
| `POSTGRES_HOST` / `POSTGRES_PORT` | Leave as `localhost` / `5432`. |
| `GEMINI_API_KEY` | Leave blank unless a teammate gives you one. |

---

## 4. Start the database

Same command on both operating systems, run from the project root:
```bash
docker compose up -d db
docker compose ps
```
You should see a `db` container with status `Up` and a `PORTS` column
showing `0.0.0.0:5432->5432/tcp`. If `PORTS` is blank despite `Up`, run
`docker compose up -d --force-recreate db`.

**Windows note:** make sure Docker Desktop is actually running (check the
whale icon in your system tray) before this command — unlike Linux, there's
no background daemon started automatically at login.

---

## 5. Set up and run the backend

Same commands on both operating systems, from `backend/`:
```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```
- `uv sync` installs the exact Python packages this project needs into an
  isolated environment.
- `migrate` creates the database tables in Postgres.
- `createsuperuser` creates your admin login (username, email, password).
- `runserver` starts the backend at http://127.0.0.1:8000/. Leave this
  terminal open.

---

## 6. Set up and run the frontend

Open a **second terminal** (Git Bash on Windows, your normal terminal on
Linux) — leave the backend terminal running. Same commands on both:
```bash
cd frontend
npm install
npm run dev
```
This starts the frontend at http://localhost:5173/. Leave this terminal
open too.

---

## 7. Confirm it worked

| What | URL | Expect |
|---|---|---|
| Frontend | http://localhost:5173/ | The React/Vite starter page. |
| Backend admin | http://127.0.0.1:8000/admin/ | A login page — sign in with the superuser from Section 5. |

For deeper testing (running the test suite, the frontend build, and a full
troubleshooting table), see [RUNNING.md](RUNNING.md).

---

## Windows-specific gotchas

| Problem | Fix |
|---|---|
| `uv`, `node`, `git`, or `docker` "not recognized" after installing | Close and fully reopen your terminal — installers update your `PATH`, but already-open terminals don't see the change. |
| PowerShell blocks the `uv` install script | You're likely running the plain PowerShell command in a restricted policy. Use the exact command in Section 1 (it sets the bypass for that one command only). |
| Docker Desktop won't start / asks about WSL2 | Open PowerShell **as Administrator** and run `wsl --install`, restart your computer, then reopen Docker Desktop. |
| Commands like `cp` or `&&` don't work | You're in Command Prompt or PowerShell instead of **Git Bash**. Reopen the terminal as Git Bash (installed alongside Git in Section 1). |

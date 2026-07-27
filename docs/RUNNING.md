# Run the project on your own device

The project has two halves that run separately:
- **backend/** — a Django + Django REST Framework API, managed with a tool called `uv`.
- **frontend/** — a React app powered by Vite.

There's also a `docker-compose.yml` at the project root that can start a
PostgreSQL database in a container.

---

## 1. Install these tools first

Install each tool below, then run its `--version` command in a terminal to
confirm it worked (you should see a version number, not an error).

| Tool | What it's for | Install link | Verify with |
|---|---|---|---|
| Git | Downloads (clones) the project code and tracks changes | https://git-scm.com/downloads | `git --version` |
| uv | Installs Python and manages the backend's Python packages | https://docs.astral.sh/uv/getting-started/installation/ | `uv --version` |
| Node.js 20+ | Runs the frontend's build tools (npm, Vite) | https://nodejs.org/ (download the LTS version) | `node --version` |
| Docker Desktop | Runs the PostgreSQL database in a container, so you don't have to install Postgres by hand | https://www.docker.com/products/docker-desktop/ | `docker --version` and `docker compose version` |

> You do **not** need to install Python yourself — `uv` will download and
> manage the right Python version for you (this project needs Python 3.14+).

---

## 2. Clone the repo

Open a terminal, go to the folder where you keep your projects, and run:

```bash
git clone https://github.com/Rafayet-Hossen/student-brain.git
```
This downloads a full copy of the project to a new `student-brain` folder.

```bash
cd student-brain
```
This moves your terminal into that new folder — run every command below from here unless told otherwise.

---

## 3. Create your `.env` file

The project ships with `.env.example`, a template listing every setting the
app needs. Copy it to a real `.env` file:

```bash
cp .env.example .env
```
This creates your own `.env` file so you can change values without affecting the template (Windows users: use `copy .env.example .env` instead).

Open `.env` and check these values:

| Variable | What to put |
|---|---|
| `DJANGO_SECRET_KEY` | Leave as `changeme` for local development — it's fine, this is only used in production. |
| `DJANGO_DEBUG` | Leave as `True` locally so Django shows helpful error pages. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Leave as-is — these must match `docker-compose.yml`, which already uses these exact values. |
| `POSTGRES_HOST` / `POSTGRES_PORT` | Leave as `localhost` / `5432` — that's where Docker exposes the database. |
| `GEMINI_API_KEY` | Leave blank unless a teammate gives you one for AI-related features. |

> The backend reads this `.env` file on startup (via `django-environ`) and
> connects to the `POSTGRES_*` values in it, so make sure you create it
> before running any `manage.py` command in Section 5 — without it, Django
> will fail to start.

---

## 4. Start the database

From the project root (`student-brain/`), run:

```bash
docker compose up -d db
```
This tells Docker to start just the `db` service (PostgreSQL) defined in `docker-compose.yml`, in the background (`-d`), so your terminal stays free.

Check it's running with:
```bash
docker compose ps
```
You should see a `db` container with a status of `Up`, and a `PORTS` column
showing `0.0.0.0:5432->5432/tcp`. If `PORTS` is blank even though the status
says `Up`, the container didn't actually bind the port — run
`docker compose up -d --force-recreate db` to fix it.

---

## 5. Set up and run the backend

Open a terminal in `backend/`:
```bash
cd backend
```

```bash
uv sync
```
This reads `pyproject.toml` and `uv.lock` and installs the exact versions of Django and Django REST Framework the project needs, into an isolated environment just for this project.

```bash
uv run python manage.py migrate
```
This creates all the database tables Django needs to work (accounts, sessions, admin, etc.).

```bash
uv run python manage.py createsuperuser
```
This creates your own admin login (you'll be asked for a username, email, and password) so you can log into the Django admin site.

```bash
uv run python manage.py runserver
```
This starts the backend server. Leave this terminal running — you should see `Starting development server at http://127.0.0.1:8000/`.

---

## 6. Set up and run the frontend

Open a **new** terminal (leave the backend one running) in `frontend/`:
```bash
cd frontend
```

```bash
npm install
```
This downloads all the JavaScript packages (React, Vite, etc.) listed in `package.json`.

```bash
npm run dev
```
This starts the Vite dev server. Leave this terminal running too — you should see a `Local:` URL, usually `http://localhost:5173/`.

---

## 7. Open it in your browser

With both servers running, open these in your browser:

| What | URL | What you should see |
|---|---|---|
| Frontend app | http://localhost:5173/ | The React + Vite starter page with a "Get started" heading and a counter button. |
| Backend root | http://127.0.0.1:8000/ | Django's "Page not found" debug page listing available URLs — this is expected, there's no homepage yet, and it confirms the server is running. |
| Django admin | http://127.0.0.1:8000/admin/ | A login page — sign in with the superuser you created in step 5. |
| API docs | *(not set up yet)* | There's no Swagger/API-docs page in the project yet — this will be added later. |

---

## 8. Test that everything actually works

**Frontend looks right if:** http://localhost:5173/ shows the "Get started"
page with the React and Vite logos, and clicking the "Count is 0" button
increases the number.

**Backend looks right if:** http://127.0.0.1:8000/admin/ shows a login form,
and logging in with your superuser account shows the Django admin dashboard.

Run the automated checks too:

```bash
cd backend
uv run python manage.py test
```
This runs the backend's test suite. With no tests written yet, it should finish quickly and report `OK`.

```bash
cd frontend
npm run build
```
This builds the frontend for production, checking that the code compiles with no errors. It should finish with a `dist/` folder created and no red error text.

---

## 9. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `django.db.utils.OperationalError: connection refused` | The Postgres container isn't running, or its port isn't actually published | Run `docker compose up -d db` from the project root and check `docker compose ps` shows `Up` with a non-blank `PORTS` column (see Section 4). |
| `django.db.utils.OperationalError: connection refused` even though `docker compose ps` looks fine | Another Postgres (a native install, or a system service) is already using port 5432 on your machine | Run `sudo ss -ltnp \| grep 5432` to see what's listening. If it's a local Postgres service, stop it with `sudo systemctl stop postgresql` and re-run `docker compose up -d db`. |
| CORS error in the browser console (frontend can't reach the backend) | The frontend isn't running on `http://localhost:5173`, so its origin doesn't match `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py` | Make sure you're opening the frontend at `localhost:5173`, not `127.0.0.1:5173` — those count as different origins to the browser. |
| `ModuleNotFoundError: No module named 'django'` (or similar) | Commands run with plain `python` instead of `uv run python`, so it's not using the project's virtual environment | Always prefix backend commands with `uv run`, e.g. `uv run python manage.py runserver`. |
| `uv: command not found` or `node: command not found` | The tool isn't installed, or your terminal was open before you installed it | Reinstall using the links in Section 1, then close and reopen your terminal. |
| `docker: unknown shorthand flag: 'd'` (or `docker compose` not recognized) | The Docker Compose CLI plugin isn't installed | On Arch: `sudo pacman -S docker-compose`. On other systems, see https://docs.docker.com/compose/install/. |
| `permission denied while trying to connect to the docker API` | Your user isn't in the `docker` group | Run `sudo usermod -aG docker $USER`, then fully log out and back in (or run `newgrp docker` in your current terminal). |

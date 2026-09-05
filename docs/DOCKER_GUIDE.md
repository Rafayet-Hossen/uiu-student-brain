# 🐳 Docker Setup & Team Workflow Guide

Welcome to **StudentBrain**! This project is completely containerized with Docker so you and your teammates can collaborate seamlessly without environment or dependency discrepancies.

---

## ⚡ Quick Start (1 Command)

### Step 1: Clone the repository & enter directory

```bash
git clone https://github.com/Rafayet-Hossen/student-brain.git
cd student-brain
```

### Step 2: Configure environment variables

Copy the template `.env.example` into `.env`:

```bash
cp .env.example .env
```

_(Optionally add your `GEMINI_API_KEY` in `.env` if you want to test AI features)_

### Step 3: Start all containers

```bash
docker compose up --build
```

_(To run in background mode, add `-d`: `docker compose up --build -d`)_

---

## 🌐 Application URLs

Once the containers finish booting, visit:

| Service                 | URL                                                          | Description                            |
| :---------------------- | :----------------------------------------------------------- | :------------------------------------- |
| **Frontend Web App**    | [http://localhost:5173](http://localhost:5173)               | Vite + React with hot module reloading |
| **Backend REST API**    | [http://localhost:8000/api/](http://localhost:8000/api/)     | Django REST Framework API              |
| **Django Admin Panel**  | [http://localhost:8000/admin/](http://localhost:8000/admin/) | Django Superuser Admin portal          |
| **PostgreSQL Database** | `localhost:5432`                                             | PostgreSQL 16 database                 |

---

## 🔑 Demo Scholar Logins

The database is automatically migrated and seeded with authentic Bangladeshi demo accounts on first boot:

| Scholar Name               | Email Login                    | Password       | Specialization                               |
| :------------------------- | :----------------------------- | :------------- | :------------------------------------------- |
| **Baitun Nahar Bithy**     | `baitun.bithy@example.com`     | `Password123!` | Rank #1 / Biochemistry & Enzyme Kinetics     |
| **Jamil Hossain**          | `jamil.hossain@example.com`    | `Password123!` | Rank #2 / CSE & DSA (includes AI Tutor Chat) |
| **Saptarshi Biswas Supty** | `saptarshi.supty@example.com`  | `Password123!` | Rank #3 / Mathematics & Calculus             |
| **Shourav Shah**           | `shourav.shah@example.com`     | `Password123!` | Software Engineering & Cloud                 |
| **Rayhan Chowdhury**       | `rayhan.chowdhury@example.com` | `Password123!` | Mechanical & Robotics                        |
| **Rafiq Al Mustafa**       | `rafiq.mustafa@example.com`    | `Password123!` | EEE & Circuit Signals                        |
| **Shofiqur Rahaman**       | `shofiqur.rahaman@example.com` | `Password123!` | Economics & Quantitative Finance             |

---

## 🛠️ Common Team Commands

### 1. View live logs

```bash
docker compose logs -f
# Or logs for a specific service:
docker compose logs -f backend
docker compose logs -f frontend
```

### 2. Run backend tests inside container

```bash
docker compose exec backend python manage.py test
```

### 3. Make and run new migrations

When you modify models in `backend/`:

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### 4. Create a superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

### 5. Re-seed demo database

```bash
docker compose exec backend python seed_dummy_data.py
```

### 6. Reset database completely

```bash
docker compose down -v
docker compose up --build
```

### 7. Stop containers

```bash
docker compose down
```

---

## 💡 Troubleshooting

- **Port already in use**: If port `5432`, `8000`, or `5173` is in use by another local process, terminate that process or adjust the port mapping in `docker-compose.yml`.
- **Changes not reflecting**: Backend and frontend folders are mounted with live volume sync. If you add a new Python or Node dependency, re-run `docker compose up --build`.

# How we build a feature

This walks through building **one feature, start to finish**, so you can see
how the backend and frontend fit together. We'll use a made-up example
feature called **"grades"** the whole way through — you can copy this pattern
for any new feature.

Assumed background: you've read [RUNNING.md](RUNNING.md) and have the
project running locally (Postgres via Docker, backend on port 8000,
frontend on port 5173).

The big idea: the **backend** (Django) exposes data over HTTP as JSON. The
**frontend** (React) calls that HTTP API and renders the result. They are
two separate programs — the frontend never touches the database directly.

---

## PART A — Backend: create a Django app

In Django, related models/views/logic live together in an "app" (a
sub-folder of `backend/`). Our project already has one app, `accounts`.
We're adding a new one, `grades`.

### A1. Create the app

From `backend/`:
```bash
uv run python manage.py startapp grades
```
This generates a `backend/grades/` folder with the standard Django app
files (`models.py`, `views.py`, `admin.py`, etc.).

### A2. Register it in `INSTALLED_APPS`

Open `backend/config/settings.py` and add `'grades'` to the list, the same
way `'accounts'` is already registered:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'accounts',
    'grades',          # <-- add this line
    'corsheaders',
]
```
Django won't know the app exists — won't pick up its models, admin, etc. —
until it's listed here.

### A3. What each file in the app is for

`startapp` only creates a few files. We add two more (`serializers.py`,
`services.py`) ourselves, because Django doesn't generate them by default.
Here's the role of each:

| File | Purpose |
|---|---|
| `models.py` | Defines the shape of the data and how it's stored in PostgreSQL. |
| `serializers.py` | Converts model objects to/from JSON for the API. |
| `services.py` | **All business logic goes here** — database queries, calculations, rules. Keeps that logic testable and separate from HTTP concerns. |
| `views.py` | Stays **thin** — reads the request, calls a function in `services.py`, and returns a response. No business logic here. |
| `urls.py` | Maps URL paths (like `/api/grades/`) to views. `startapp` doesn't create this file — you add it yourself. |
| `admin.py` | Registers models so they show up in the Django admin site at `/admin/`. |

### A4. A minimal end-to-end example

**`backend/grades/models.py`** — the data shape:
```python
from django.db import models


class Grade(models.Model):
    student_name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name} - {self.subject}: {self.score}"
```

**`backend/grades/serializers.py`** — turns `Grade` objects into JSON:
```python
from rest_framework import serializers

from .models import Grade


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ["id", "student_name", "subject", "score", "created_at"]
```

**`backend/grades/services.py`** — the actual logic, kept out of the view:
```python
from .models import Grade


def list_grades():
    return Grade.objects.all().order_by("-created_at")
```

**`backend/grades/views.py`** — thin, just wires the request to the service:
```python
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import GradeSerializer


class GradeListView(APIView):
    def get(self, request):
        grades = services.list_grades()
        serializer = GradeSerializer(grades, many=True)
        return Response(serializer.data)
```

**`backend/grades/urls.py`** — new file, maps a path to the view above:
```python
from django.urls import path

from .views import GradeListView

urlpatterns = [
    path("", GradeListView.as_view(), name="grade-list"),
]
```

**`backend/grades/admin.py`** — so grades show up at `/admin/`:
```python
from django.contrib import admin

from .models import Grade

admin.site.register(Grade)
```

### A5. Wire it into the project's URLs

`backend/config/urls.py` currently only routes `/admin/` — there's no
`/api/` prefix yet, so we're adding that pattern here for the first time.
Every future app follows this same shape: `path('api/<app-name>/', include('<app-name>.urls'))`.

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/grades/', include('grades.urls')),
]
```
Note the added `include` import — `config/urls.py` didn't need it before
since there was nothing to include.

### A6. Apply it and check it works

From `backend/`:
```bash
uv run python manage.py makemigrations
```
This looks at your models and writes a migration file describing the
database changes needed (a new `grades` table, in this case).

```bash
uv run python manage.py migrate
```
This actually applies that migration to PostgreSQL, creating the table.

```bash
uv run python manage.py runserver
```
Starts the backend.

**There's no Swagger/API-docs page in this project yet** — instead, open
http://localhost:8000/api/grades/ directly in your browser. Django REST
Framework's built-in "browsable API" will render the JSON as a readable
HTML page — that's how you confirm the endpoint works before writing any
frontend code.

---

## PART B — Frontend: build the screen for that app

### B1. The mirror rule

Every backend app gets a matching frontend folder with the **same name**,
under `frontend/src/features/`:

```
backend/grades/          ->  frontend/src/features/grades/
```

This makes it easy to find the frontend code for any backend feature, and
vice versa.

### B2. Files to create

Inside `frontend/src/features/grades/`, create:

| File | Purpose |
|---|---|
| `api.js` | Functions that call the backend, using the shared client — never a hardcoded URL. |
| `hooks.js` | A React hook that calls `api.js` and manages loading/error/data state. |
| `pages/GradesPage.jsx` | The actual screen, using the hook. |

### B3. A minimal working example

**`frontend/src/features/grades/api.js`** — calls the backend through the
shared axios client at `frontend/src/lib/api.js` (whose `baseURL` is
already `http://localhost:8000/api`, so we only add the path after that):
```javascript
import api from "../../lib/api";

export function getGrades() {
  return api.get("/grades/").then((response) => response.data);
}
```

**`frontend/src/features/grades/hooks.js`** — fetches on mount, tracks state:
```javascript
import { useEffect, useState } from "react";

import { getGrades } from "./api";

export function useGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGrades()
      .then(setGrades)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { grades, loading, error };
}
```

**`frontend/src/features/grades/pages/GradesPage.jsx`** — the screen, with
loading, error, and empty states:
```jsx
import { useGrades } from "../hooks";

export default function GradesPage() {
  const { grades, loading, error } = useGrades();

  if (loading) return <p>Loading grades...</p>;
  if (error) return <p>Something went wrong loading grades.</p>;
  if (grades.length === 0) return <p>No grades yet.</p>;

  return (
    <ul>
      {grades.map((grade) => (
        <li key={grade.id}>
          {grade.student_name} — {grade.subject}: {grade.score}
        </li>
      ))}
    </ul>
  );
}
```

---

## PART C — Routes: make the page reachable

A React "route" maps a URL in the browser's address bar (like
`/grades`) to a page component (like `GradesPage`). Without a route, the
component exists in code but nothing tells React to render it for any
particular URL.

**`react-router-dom` isn't installed in this project yet**, so add it first.
From `frontend/`:
```bash
npm install react-router-dom
```

Then set up the router in `frontend/src/main.jsx` (currently it just
renders `<App />` directly with no routing at all):
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import GradesPage from './features/grades/pages/GradesPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/grades" element={<GradesPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
```
Now visiting http://localhost:5173/grades in the browser renders
`GradesPage`. Add one `<Route>` line per new feature page.

---

## PART D — How they communicate (the big picture)

One full request, start to finish:

```
user opens /grades in the browser
        |
        v
GradesPage (React component)
        |
        v
features/grades/api.js  --calls-->  lib/api.js (shared axios client)
        |
        v
HTTP GET http://localhost:8000/api/grades/
        |
        v
config/urls.py    (matches "api/grades/", hands off to grades app)
        |
        v
grades/urls.py    (matches "", hands off to the view)
        |
        v
grades/views.py   (thin — just calls the service)
        |
        v
grades/services.py  (the actual logic — queries the database)
        |
        v
grades/models.py  -->  PostgreSQL
        |
        v
JSON response travels back up through services -> serializer -> view -> HTTP
        |
        v
features/grades/hooks.js updates its state
        |
        v
GradesPage re-renders with the data
```

**The frontend never touches the database.** It only ever calls
`http://localhost:8000/api/...` over HTTP. The two halves run as
completely separate programs — frontend on port `5173`, backend on port
`8000` — talking only through that API (which is exactly why CORS had to
be configured between them).

---

## Checklist: adding any new feature

1. **Backend app** — `uv run python manage.py startapp <name>`, register it
   in `INSTALLED_APPS`, write `models.py` / `serializers.py` / `services.py`
   / `views.py` / `urls.py` / `admin.py`.
2. **Wire the URL** — add `path('api/<name>/', include('<name>.urls'))` to
   `backend/config/urls.py`.
3. **Migrate** — `uv run python manage.py makemigrations` then `migrate`.
4. **Check it in the browser** — open `http://localhost:8000/api/<name>/`
   and confirm you see JSON (via the browsable API).
5. **Frontend folder** — create `frontend/src/features/<name>/` with
   `api.js`, `hooks.js`, and `pages/<Name>Page.jsx`, matching the backend
   app's name.
6. **Route** — add a `<Route>` for the new page in `frontend/src/main.jsx`.
7. **Test it end to end** — load the page in the browser and confirm real
   data shows up, not just that it compiles.

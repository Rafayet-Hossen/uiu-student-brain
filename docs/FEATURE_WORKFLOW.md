# Feature workflow

This is the loop we repeat for every feature. It's the same 8 steps every
time, whether it's your first feature or your tenth.

Read [FEATURE_TRACKER.md](FEATURE_TRACKER.md) for what to build and in what
order, and [GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md) for the branch/PR
mechanics referenced below.

---

## The one rule: stay in your feature's folders

**One feature = one backend app + one frontend folder, with the same
name.** While working on a feature, you should only be touching:

- `backend/<name>/`
- `frontend/src/features/<name>/`

If you find yourself editing files outside those two folders, stop and
check whether you're actually supposed to be — it usually means the
feature isn't as isolated as it should be.

---

## The 8-step loop

### 1. Pick + branch
Mark the feature 🟡 in `FEATURE_TRACKER.md`. Create your branch:
```bash
git checkout -b feat/<name>
```

### 2. Contract first
Before writing any code, write down the endpoints you'll need and their
request/response JSON shapes. This forces you to think through the API
before you're deep in implementation details.

### 3. Backend
Build it in this order:
```
startapp <name>
  -> register in INSTALLED_APPS
  -> models.py
  -> makemigrations / migrate
  -> serializers.py
  -> services.py   (ALL business logic goes here)
  -> views.py       (thin — calls services.py)
  -> urls.py
  -> include under /api/<name>/ in config/urls.py
```

### 4. Test backend alone
Before touching the frontend, check your endpoints work. There's no
Swagger/API-docs page in this project — instead, open
`http://localhost:8000/api/<name>/` directly in your browser. Django REST
Framework's built-in "browsable API" renders the JSON as a readable page.
Confirm the response shape matches your contract from step 2.

### 5. Frontend
```
frontend/src/features/<name>/
  -> api.js     (use the shared lib/api.js client — never a hardcoded URL)
  -> hooks.js
  -> pages/
  -> add a route
```

### 6. Test the full slice
Click through the real screen in your browser. Confirm loading, error, and
empty states all work — not just the happy path.

### 7. Only if it works perfectly
Mark the feature ✅ in `FEATURE_TRACKER.md`, commit, push, open a PR, get 1
approval, and merge to `main`.

### 8. Next feature
Pull `main`, and repeat from step 1.

---

Never push directly to `main` — always branch → PR → review → merge.

# How we use GitHub as a team
---

## 1. The golden rule

**Never push directly to `main`.** All work happens on a separate branch,
then gets merged into `main` through a Pull Request (PR) that a teammate
reviews and approves. This keeps `main` always in a working state and gives
everyone a chance to catch mistakes before they land.

---

## 2. Daily flow

### Step 1 — make sure your `main` is up to date
```bash
git checkout main
```
This switches your local copy to the `main` branch.

```bash
git pull origin main
```
This downloads the latest commits from GitHub and updates your local `main` to match.

### Step 2 — create a branch for your work
```bash
git checkout -b feat/short-description
```
This creates a new branch off of `main` and switches to it, so your changes are isolated from everyone else's.

Branch name prefixes we use:
- `feat/...` — a new feature (e.g. `feat/student-login`)
- `fix/...` — a bug fix (e.g. `fix/quiz-score-bug`)
- `chore/...` — anything else (config, docs, dependencies)

### Step 3 — make your changes and commit
```bash
git add .
```
This stages all your changed files, marking them as "ready to be committed."

```bash
git commit -m "Add student login form"
```
This saves a snapshot of your staged changes with a message describing what you did (see Section 4 for what makes a good message).

Commit as often as makes sense — small, focused commits are easier for
teammates to review than one giant commit.

### Step 4 — push your branch to GitHub
```bash
git push -u origin feat/short-description
```
This uploads your branch to GitHub. The `-u` flag remembers this branch's remote, so next time you can just run `git push`.

### Step 5 — open a Pull Request
Go to the repo on GitHub — it will usually show a banner offering to
"Compare & pull request" for the branch you just pushed. Click it, fill in
a title and description, and click "Create pull request." This asks the
team to review your changes before they're merged into `main`.

---

## 3. Keeping your branch up to date / resolving conflicts

If `main` has moved on while you were working, bring those changes into
your branch before you finish:

```bash
git checkout main
git pull origin main
```
This updates your local `main` with the latest changes from GitHub.

```bash
git checkout feat/short-description
git merge main
```
This brings `main`'s latest changes into your branch.

**If there's no conflict**, Git merges automatically and you're done —
just push again with `git push`.

**If there's a conflict**, Git will pause the merge and mark the affected
file(s) like this:

```
<<<<<<< HEAD
your version of the line
=======
the version from main
>>>>>>> main
```

To resolve it:
1. Open the file and decide what the final code should look like — keep
   one version, the other, or a combination of both.
2. Delete the `<<<<<<<`, `=======`, and `>>>>>>>` marker lines entirely.
3. Save the file, then run:
   ```bash
   git add <filename>
   ```
   This tells Git you've resolved the conflict in that file.
4. Once every conflicted file is fixed and staged, run:
   ```bash
   git commit
   ```
   This finishes the merge with a default "Merge branch 'main'..." message.
5. Push your branch: `git push`.

---

## 4. What a good commit message looks like

- Start with a verb in the present tense: "Add," "Fix," "Update," not "Added" or "Adding."
- Keep the first line under ~72 characters — it should summarize the change, not describe every detail.
- Say *what* changed and, if it's not obvious, *why*.

**Good examples:**
```
Fix crash when submitting an empty quiz answer
```
```
Add pagination to the study-notes API endpoint
```

**Avoid vague messages like:**
```
fix stuff
```
```
updates
```

---

## 5. PR checklist before requesting review

Before you ask a teammate to review your PR, check that:

- [ ] Your branch is up to date with `main` (see Section 3) and has no conflicts.
- [ ] The backend runs: `uv run python manage.py test` passes (from `backend/`).
- [ ] The frontend builds: `npm run build` succeeds with no errors (from `frontend/`).
- [ ] You've tested the feature yourself in the browser.
- [ ] The PR title and description explain *what* changed and *why*.
- [ ] You haven't committed `.env`, secrets, or unrelated files (check with `git status`).

---

## 6. Reviewing and approving a teammate's PR

Every PR needs **at least 1 approval** from a teammate before it can be
merged into `main`.

To review a PR on GitHub:
1. Open the PR and click the **"Files changed"** tab to see the diff.
2. Read through the changes — check the logic makes sense, matches the PR's
   description, and doesn't obviously break anything.
3. Leave comments on specific lines if you have questions or suggestions
   (click the `+` that appears when you hover over a line).
4. When you're happy with it, click **"Review changes"** (top right of the
   Files changed tab), select **"Approve"**, and submit.
5. If something needs fixing first, select **"Request changes"** instead
   and explain what's needed — the author can push new commits to the same
   branch and the PR updates automatically.

Once a PR has 1 approval and no unresolved conversations, the author (or
the approver) can click **"Merge pull request"** to bring it into `main`.

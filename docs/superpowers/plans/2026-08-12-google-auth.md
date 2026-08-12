# Google Auth Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Google OAuth login with per-user `saju_readings` RLS.

**Architecture:** Hard login gate in `App.jsx`; Supabase Google OAuth redirect; `user_id` column + owner-only RLS.

**Tech Stack:** Vite, React 19, `@supabase/supabase-js`, Supabase Auth/Postgres.

## Global Constraints

- Surgical changes only in `App.jsx` / `App.css` (+ docs).
- No new auth libraries.
- Do not commit secrets.

---

### Task 1: DB migration

- [ ] Delete all `saju_readings` rows
- [ ] Add `user_id` + owner RLS; drop anon policies
- [ ] Verify columns/policies via SQL

### Task 2: App auth UI + data scoping

- [ ] Session state + login gate + logout
- [ ] `signInWithOAuth` / `signOut`
- [ ] Include `user_id` on insert; load only when logged in
- [ ] CSS for login/account bar matching existing style

### Task 3: Verify

- [ ] `get_advisors` security
- [ ] Manual: login → create reading → logout → login sees own data

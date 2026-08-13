# User Profile Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Split personal inputs into `profiles` and keep `saju_readings` as result history.

**Architecture:** 1:1 `profiles` keyed by `auth.users.id`. Hard onboarding modal, edit from sidebar, main screen uses profile for Gemini and stores only `result`.

**Tech Stack:** Vite, React 19, supabase-js, Supabase Postgres/RLS.

## Global Constraints

- Table name is `profiles`, not `user`.
- One account = one person.
- Analyze inserts a new reading; do not overwrite history.
- Match existing gray/serif UI.

---

### Task 1: Database

- [ ] Create `profiles` + RLS
- [ ] Drop personal columns from `saju_readings`
- [ ] Verify columns/policies

### Task 2: App

- [ ] `ProfileModal.jsx` for onboarding + edit
- [ ] Load profile on auth; block until complete
- [ ] Main summary + history-by-date sidebar
- [ ] Analyze from profile; insert `{ user_id, result }`

### Task 3: Verify

- [ ] Security advisors
- [ ] `npm run lint`

# Google Auth + per-user readings

## Goal

Sign in with Google via Supabase OAuth. Each user only sees and manages their own `saju_readings`.

## Auth flow

1. App loads session via `getSession` + `onAuthStateChange`.
2. No session → login gate with “Google로 로그인”.
3. `signInWithOAuth({ provider: 'google', options: { redirectTo: origin } })`.
4. Session present → existing saju UI + logout.
5. Hard gate: unauthenticated users cannot use the app.

## Database

- Delete existing test rows.
- Add `user_id uuid not null references auth.users(id) on delete cascade` (default `auth.uid()`).
- Replace anon-open RLS with authenticated policies: `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE.

## App

- Track `session` / `user`.
- Insert/update payloads include `user_id`.
- Load readings only when authenticated.
- Minimal login / account UI matching existing gray/serif look.

## Out of scope

- One Tap / GIS
- Soft preview without login
- Migrating orphan rows to a user

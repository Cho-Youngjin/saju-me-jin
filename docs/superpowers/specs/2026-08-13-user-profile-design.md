# User profile vs readings

## Goal

Store personal saju inputs once per account. Readings store only analysis results, linked to that profile.

## Data

**`profiles`** (1:1 with `auth.users`)
- `id` PK = `auth.users.id`
- `name`, `birth_date`, `birth_time`, `gender`, `calendar_type` all NOT NULL
- Owner-only RLS (select/insert/update)

**`saju_readings`**
- Drop `name`, `birth_date`, `birth_time`, `gender`, `calendar_type`
- Keep `id`, `user_id` (same uuid as `profiles.id`), `result`, `created_at`
- Owner-only RLS unchanged

One account = one person. Readings are a history of analyses for that person.

## UX

- No profile row → blocking onboarding modal (all fields required)
- Main: read-only profile summary + analyze
- Sidebar: profile edit, result history by date, delete, logout
- Analyze always inserts a new reading (does not overwrite history)
- Profile edits apply to future analyses only

# Guest access + result login gate

## Goal

Let unauthenticated visitors analyze saju. Show about half the result, then require Google login to see the rest. After login, save the guest profile and reading to the account and show the full result.

## Guest

- No login wall. No sidebar.
- Main page form: name, birth date, time, gender, calendar type + analyze.
- Small Google login control in the header for returning users.
- Gemini call is client-side. Do not write to `profiles` or `saju_readings`.
- After a successful analysis, persist `{ profile, result }` in `localStorage` so refresh and OAuth redirect keep the reading.

## Result gate

- Render the full markdown.
- Clip the result (`max-height` + `overflow: hidden`) and fade the bottom half.
- Overlay CTA: Google login to see the rest.
- Logged-in users see the full result with no gate.

## After Google login

- If pending guest data exists:
  - No profile yet → insert guest profile.
  - Profile already exists → do not overwrite.
  - Always insert the pending result as a new reading.
  - Show that reading in full, then clear pending storage.
- Logged-in UI is unchanged: sidebar, profile summary, history, onboarding modal if they logged in with no profile and no pending data.

## Out of scope

- Server-side truncation of the model output.
- Schema / RLS changes.

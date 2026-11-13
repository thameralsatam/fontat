# Supabase (project `njbgonhxwbofxujvjycn`)

This folder is the source of truth for the backend, so the project can be rebuilt from the repo.

```
supabase/
  schema/       Snapshot of the LIVE database (exported 2026-11-13). Reference only – do not edit by hand.
  migrations/   Changes. A migration is applied to the live project only after review.
```

## Model in one paragraph
Clients never write to tables directly: every table has SELECT policies only, and all writes go through
`SECURITY DEFINER` functions (RPCs) that check `auth.uid()` / `is_admin()` themselves.
`is_admin()` reads `app_metadata.role = 'admin'` from the JWT (not editable by users).
A *public font* is a font row with `group_id IS NULL` (only the admin creates those); private fonts live in a user's group.
Font files live in the `fonts` storage bucket under `<sha256>.<ext>`; `font_assets` maps a hash to its file (one file per unique font, shared by all font rows that reference it).

## Applying a migration
Review the file → apply with the Supabase MCP / dashboard SQL editor → run the checks listed at the bottom of the migration.
Migrations are written to be idempotent where possible.

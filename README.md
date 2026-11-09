# Fontat · فونتات

An Arabic-first web platform for exploring, testing, and managing fonts: a searchable font library, a personal workspace for saved fonts, and tools for inspecting font features (OpenType features, variable font axes).

**Live:** https://fontat.pages.dev

## Features

- Font library with search, filtering, and live preview
- Personal account to save and organize fonts
- Upload your own font files (deduplicated by SHA-256 hash)
- Lab tools for variable font analysis and conversion
- Full Arabic/English UI with RTL/LTR support

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS
- **Data backend:** Supabase (PostgreSQL, Auth, Storage)
- **Font processing:** a small FastAPI service deployed separately (see below)

## Setup

1. **Supabase:** create a project, enable Auth, create the tables used by `src/services/`, and create a public storage bucket named `fonts`.
2. **Environment variables** (see `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Font processing API:** the Lab page (analysis / variable-font conversion) calls a separately deployed FastAPI + fonttools service. The endpoints are configured in `src/components/font/useFontAnalyzer.ts` and `src/pages/Lab.tsx`.

## How uploads work

- Uploading checks the `fonts` table by file hash: an already-stored file is linked instead of re-uploaded.
- Deleting a font from a group only removes the link (`group_fonts`); the font record and file stay available to other groups.

## Development

```bash
npm install
npm run dev
```

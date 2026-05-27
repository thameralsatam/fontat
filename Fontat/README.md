# Font Manager

A robust, scalable font management system built with React, Supabase, and Tailwind CSS.

## Features

- **Smart Uploads**: Deduplicates files using SHA-256 hashing. If a file already exists, it links to it instead of re-uploading.
- **Group Management**: Organize fonts into groups.
- **Localization**: Full Arabic and English support (RTL/LTR).
- **Clean UI**: Modern, responsive interface using Tailwind CSS.

## Setup

1. **Database**: Run the contents of `database.sql` in your Supabase SQL Editor.
2. **Storage**: Create a public storage bucket named `fonts`.
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`: Your Supabase URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS.
- **Backend**: Supabase (PostgreSQL + Storage + Auth).
- **State**: React Context for Auth and Language.
- **Routing**: React Router DOM.

## Key Logic

- **Upload**: 
  1. Calculate file hash.
  2. Check `fonts` table for hash.
  3. If found -> Link to group.
  4. If not found -> Upload to Storage -> Insert to `fonts` -> Link to group.
- **Delete**:
  - Deleting a font from a group only removes the link (`group_fonts` table).
  - The actual font record and file remain for other groups to use.

## Development

```bash
npm install
npm run dev
```

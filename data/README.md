# Project seed data

## `project-coordinates.csv`

The backfill source for the India map. One row per temple, generated from the
live `temples` table so the ids and names match exactly — **do not renumber the
`id` column**, it is what the importer matches on.

Fill in what you know and leave the rest blank. A blank cell is never written,
so a partly-filled file is fine and can be imported repeatedly as you learn
more. Nothing is ever deleted by an import.

### Columns

| Column | Fill with |
|---|---|
| `id` | Already correct. Do not change. |
| `name` | Already correct. Present so you can see which row you are editing; not imported. |
| `city` | Town or city. Five rows already have one. |
| `state` | Full state name, e.g. `Gujarat`, `Karnataka`. |
| `latitude` | Decimal degrees, e.g. `21.5222`. North is positive. |
| `longitude` | Decimal degrees, e.g. `71.8219`. East is positive. |
| `category` | `mountain` for an artificially built mountain with the temple inside (Vaishno Devi Ahmedabad, Vaishno Devi Gulbarga), or `stone` for a regular stone temple. |
| `stone_type` | The stone the temple was built from, in plain words. |
| `status` | `completed`, `in_progress` or `planned`. Pre-filled as `completed`. |

### Getting coordinates

Open the place in Google Maps, right-click the exact spot, and the first menu
entry is `latitude, longitude` — click it to copy. Paste latitude into the
`latitude` column and longitude into `longitude`. Four decimal places is about
11 metres, which is far more than a map of India needs.

A temple with no coordinates is simply absent from the map. It keeps its
gallery card and still counts towards the project total, so leaving a row blank
is a valid answer, not an unfinished one.

### Importing

Dry run first — this only prints what it would change and touches nothing:

```bash
backend/venv/Scripts/python.exe tools/import_project_data.py
```

Then, once the output looks right:

```bash
backend/venv/Scripts/python.exe tools/import_project_data.py --apply
```

It needs `DATABASE_URL` in `backend/.env`, which is already there for local
work. The columns it writes to only exist once the backend has been deployed
with the migration in `ensure_schema()`.

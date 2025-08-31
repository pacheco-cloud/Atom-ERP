# Atom ERP: Copilot Instructions for AI Coding Agents

## Big Picture Architecture
- **Monorepo** with `backend` (Django REST, PostgreSQL) and `frontend` (React, Node).
- **Backend**: Modular Django apps (`core`, `users`, `catalog`, `customers`, `sales`, `agents`).
  - `core/settings.py` configures environment via `.env` and Docker Compose variables.
  - Database host is always `db` (see Docker Compose).
- **Frontend**: React app in `frontend/src`, but `package.json` must define a `start` script (see troubleshooting below).
- **Docker Compose** orchestrates all services. Remove `version:` from the top of `docker-compose.yml`.

## Developer Workflows
- **Build/Run**: Use `docker-compose up --build` to start all services and see logs. For debugging, run without `-d` to view errors live.
- **Migrations**: Run with `docker-compose exec backend python manage.py migrate`.
- **Custom Imports**: Use Django management commands for CSV import:
  - Customers: `docker-compose exec backend python manage.py import_customers <csv_path>`
  - Products: `docker-compose exec backend python manage.py import_products <csv_path>`
- **Testing**: Backend tests are in each app's `tests.py`. Run with `docker-compose exec backend python manage.py test`.

## Project-Specific Patterns
- **Environment Variables**: All sensitive config (DB, SECRET_KEY, DEBUG) is read from `.env` and injected via Docker Compose.
- **Django Models**: Use `update_or_create` for idempotent imports (see `import_customers.py`).
- **CSV Import**: Management commands expect semicolon-delimited CSVs with specific headers (see `import_customers.py` for mapping logic).
- **Admin Customization**: Use `@admin.register(Model)` and customize `list_display`, `search_fields`, `list_filter`.
- **REST API**: Uses Django REST Framework, JWT auth (`djangorestframework-simplejwt`), and CORS headers.

## Integration Points
- **Database**: PostgreSQL, always accessed via service name `db`.
- **Frontend/Backend**: Communicate via REST endpoints; CORS is enabled.
- **Agents**: Place AI agent code in `backend/agents/`.

## Troubleshooting
- **Backend container exits immediately**: Check the command in `Dockerfile`/`docker-compose.yml` (should runserver, not just migrate).
- **Frontend fails to start**: Add a `start` script to `frontend/package.json` (e.g., `"start": "react-scripts start"`).
- **Obsolete Docker Compose version warning**: Remove `version:` from `docker-compose.yml`.

## Key Files & Directories
- `backend/core/settings.py`: Environment, DB, and app config
- `backend/requirements.txt`: Python dependencies
- `backend/*/management/commands/`: Custom importers
- `frontend/package.json`: Scripts and dependencies
- `docker-compose.yml`: Service orchestration

---
For unclear workflows or missing conventions, ask the user for clarification or examples from their team.

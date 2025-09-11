# Patient Project

This project provides a backend API for Add,List, Delete, patient processing (weight/height → concentration/duration) and a React/Next.js frontend for visualizing the results.

---

## Project Structure

```
patient/
├─ backend/     # Django backend
├─ frontend/    # Next.js frontend
└─ docker-compose.yml
```

---

## Requirements
<!--  -->
- Docker & Docker Compose (optional, recommended)
- Python 3.13+ (for non-Docker)
- Node.js 18+ & npm/yarn

---

## Running the Project

### Using Docker (Recommended)

1. Unzip the project and open terminal in the project directory.
2. Run:

```bash
docker compose up
```

This will spin up the backend, frontend, and database.

---

### Without Docker

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd patient/backend
```

2. Activate a virtual environment:

```bash
python -m venv a
# Windows Command Prompt
a\Scripts\activate
# Linux / Mac
source a/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```
4. Run migrations

Before running migrations, open `config/settings.py` and find the `DOCKER_MODE` variable at the top. Set it to `False` for local development:

DOCKER_MODE = False

Then, in your terminal, run:
```bash
python manage.py makemigrations
python manage.py migrate
```
This ensures your local environment uses SQLite instead of PostgreSQL.

5. Start the backend server:

```bash
python manage.py runserver
```

Backend will run at `127.0.0.1:8000` by default.

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd patient/frontend
```

2. Install dependencies:

```bash
npm install
```
3. Start the frontend development server

Before starting the frontend, open `.env.local` in the frontend directory and uncomment the following line:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

Then, in your terminal, run:

```bash
npm run dev
```

Frontend will run at `http://localhost:3000`.

## Environment Variables
<!--  -->
- `DEBUG` – set to `1` for development
- `PATIENT_PROCESS_THROTTLE` – rate limit for patient process endpoint (e.g., `2/min`)
- `DATABASE_URL` – PostgreSQL connection string, e.g., `postgres://postgres:postgres@postgres:5432/patient`

<!--  -->
Example in `docker-compose.yml`:
<!--  -->
```yaml
env
  - PATIENT_PROCESS_THROTTLE=5/min
  - DATABASE_URL=postgres://postgres:postgres@postgres:5432/patient

```
<!--  -->
---
<!--  -->
## API DOCUMENTATION

Kindly see the apidocs.md

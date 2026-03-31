# Faculty Student Portal (Node.js + React + MongoDB)

A role-based portal that now supports a broader project lifecycle:
- Faculty can post discoverable projects with optional attachments
- Projects are auto-classified into baskets and types
- Students and alumni can build rich profiles with resume, GitHub, LinkedIn, skills, interests, achievements, private work, and course history
- Students receive recommendation signals without hiding the full project catalog
- Students can apply with a pitch that explains them beyond LinkedIn
- Faculty can review applications, accept contributors, and store permanent evaluations
- Archived projects preserve institutional memory for future professors
- Students can follow professors and receive targeted notifications instead of mass spam
- Project discussion lowers the barrier for student-faculty interaction

The original update feed routes still exist, but the app now centers around unified project discovery, mentoring, evaluation, and archiving.

Detailed project guide:
- [Working And Running Guide](./docs/WORKING_AND_RUNNING.md)

## Project structure

- `backend`: Express + MongoDB API
- `frontend`: React (Vite) client

## 1) Backend setup

```bash
cd backend
```

Update `.env`:

- `MONGODB_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: any long random secret
- `PORT`: optional (default `5001`)

Install and run:

```bash
npm install
npm run dev
```

API base URL: `http://localhost:5001/api`

## 2) Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App URL (default): `http://localhost:5173`

## Auth and roles

- Register with role `faculty`, `student`, or `alumni`
- Faculty can post projects, review applications, archive work, and submit evaluations
- Students and alumni can discover projects, ask questions, follow professors, and apply with a project pitch

## New API surface

- `GET /api/profiles/me`
- `PUT /api/profiles/me`
- `POST /api/profiles/me/resume`
- `GET /api/profiles/faculty`
- `POST /api/profiles/faculty/:facultyId/follow`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `POST /api/projects`
- `POST /api/projects/:projectId/apply`
- `POST /api/projects/:projectId/discussions`
- `POST /api/projects/:projectId/applications/:applicationId/review`
- `POST /api/projects/:projectId/archive`
- `GET /api/evaluations/me`
- `POST /api/evaluations`

## Important security note

Do not hardcode MongoDB credentials in code. Keep credentials only in `.env` files and rotate exposed credentials immediately.

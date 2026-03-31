# Working And Running Guide

## 1) What this app does

This app is a role-based campus portal:

- `faculty` and `student` users can register/login
- Faculty can create posts (with optional image)
- Faculty can delete their own post image
- Faculty can delete their own post
- Any logged-in user can comment on posts

## 2) Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Auth: JWT (`Authorization: Bearer <token>`)
- Uploads: `multer` (stored in backend `uploads/` folder)

## 3) Project structure

```text
faculty-student-portal/
  backend/
    src/
      config/        # DB config
      controllers/   # API logic
      middleware/    # auth/error/upload middleware
      models/        # Mongoose models
      routes/        # route definitions
      server.js      # app entry
    uploads/         # uploaded post images
  frontend/
    src/
      App.jsx        # main app UI and API calls
```

## 4) Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm
- MongoDB Atlas cluster + DB user
- Atlas Network Access configured to allow your current public IP

## 5) Environment setup

### Backend

```bash
cd /Users/fci/Documents/faculty-student-portal/backend
cp .env.example .env
```

Set values in `.env`:

```env
PORT=5001
MONGODB_URI=mongodb+srv://<user>:<url-encoded-password>@<cluster-host>/<db>?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
```

### Frontend

```bash
cd /Users/fci/Documents/faculty-student-portal/frontend
cp .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

## 6) How to run

Open two terminals.

### Terminal 1: backend

```bash
cd /Users/fci/Documents/faculty-student-portal/backend
npm install
npm run dev
```

Expected logs:

- `Server running on port 5001`
- `MongoDB connected`

### Terminal 2: frontend

```bash
cd /Users/fci/Documents/faculty-student-portal/frontend
npm install
npm run dev
```

Open:

- `http://localhost:5173`

## 7) How app flow works

### Auth flow

1. User registers or logs in from frontend.
2. Backend validates credentials and returns JWT + user data.
3. Frontend stores token in `localStorage` (`portal_token`).
4. Frontend sends token in `Authorization` header for protected routes.
5. Backend middleware verifies token and loads current user.

### Post flow

1. Faculty submits title/content (and optional image).
2. Frontend sends `multipart/form-data` for post creation.
3. Backend stores image file in `backend/uploads/`.
4. Backend stores post in MongoDB with `imagePath`.
5. Post list response includes `imageUrl` for UI display.

### Delete flow

Delete image:
1. Faculty calls `DELETE /api/posts/:postId/image`.
2. Backend clears `imagePath` from post and removes file from disk.

Delete post:
1. Faculty calls `DELETE /api/posts/:postId`.
2. Backend deletes post comments, image file (if any), and post document.

### Comment flow

1. User sends comment to `POST /api/posts/:postId/comments`.
2. Backend creates comment linked to post and author.
3. Frontend updates comment list.

## 8) API endpoints summary

Base URL: `http://localhost:5001/api`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (protected)

### Posts

- `GET /posts` (protected)
- `POST /posts` (protected, faculty, multipart field name: `image`)
- `DELETE /posts/:postId` (protected, faculty, own posts only)
- `DELETE /posts/:postId/image` (protected, faculty, own posts only)

### Comments

- `POST /posts/:postId/comments` (protected)

## 9) Common issues and fixes

### `querySrv EBADNAME _mongodb._tcp.<cluster>`

Cause: placeholder URI still in `.env`.
Fix: replace `<cluster>` and other placeholders with real Atlas values.

### Atlas connection error / whitelist issue

Cause: your public IP is not allowed in Atlas Network Access.
Fix: add your IP in Atlas `Security -> Network Access`.

### 401 unauthorized

Cause: missing/expired token.
Fix: log out and log in again.

### 403 forbidden while deleting post/image

Cause: only faculty can delete, and only their own posts can be deleted.

### Upload rejected

Cause: non-image file or size > 5MB.
Fix: upload an image file under 5MB.

## 10) Security notes

- Never commit `.env` with real credentials
- Rotate exposed MongoDB passwords immediately
- Use a strong random `JWT_SECRET`
- Restrict Atlas IP allowlist in production

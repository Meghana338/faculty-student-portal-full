# Deployment Guide (Best for future changes)

This setup gives you the simplest long-term workflow:

- Backend API: **Render**
- Frontend app: **Vercel**
- Database: **MongoDB Atlas**

Every future change is just:
1. push code to GitHub
2. Render + Vercel redeploy automatically

---

## 1) Deploy backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** -> **Blueprint**
3. Select your GitHub repo: `Meghana338/Portfolio`
4. Render detects `render.yaml` and creates `faculty-student-portal-api`
5. Set required env vars in Render:
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `JWT_SECRET` = any long random secret
   - `OPENAI_API_KEY` = optional (only if you want live AI responses)
6. Deploy
7. Copy your backend URL, for example:
   - `https://faculty-student-portal-api.onrender.com`

Health check URL:
- `https://<your-render-domain>/api/health`

---

## 2) Deploy frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** -> **Project**
3. Import the same GitHub repo
4. In Vercel project settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - `VITE_API_BASE_URL` = `https://<your-render-domain>/api`
6. Deploy

---

## 3) Future updates (very easy)

For every change:

```bash
git add .
git commit -m "your change"
git push
```

Then:
- Render auto-deploys backend
- Vercel auto-deploys frontend

No manual redeploy needed.

---

## 4) If frontend cannot reach backend

Check:
- Render service is healthy at `/api/health`
- Vercel env var `VITE_API_BASE_URL` is exactly:
  - `https://<render-domain>/api`
- You redeployed frontend after updating env vars

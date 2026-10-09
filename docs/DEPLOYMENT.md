# AiRus Deployment Guide (Render Blueprint)

This guide walks you through deploying AiRus to **Render** using the included `render.yaml` Blueprint specification.

---

## 1. Prerequisites

1. A [GitHub](https://github.com) account with this repository pushed: `https://github.com/nsuryachandra/AiRus_Agent.git`.
2. A free [Render](https://render.com) account.
3. Your **NVIDIA API Key** (from [build.nvidia.com](https://build.nvidia.com) or NVIDIA NGC).

---

## 2. Deploying via Render Blueprint (Recommended)

1. **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** at the top right, then select **Blueprint**.
3. **Connect Repository**:
   - Choose `nsuryachandra/AiRus_Agent` (or paste `https://github.com/nsuryachandra/AiRus_Agent.git`).
4. **Render Blueprint Inspection**:
   - Render will parse `render.yaml` and discover three resources:
     1. `airus-backend` (Node.js Web Service)
     2. `airus-frontend` (Static Site)
     3. `airus-postgres` (PostgreSQL Database)
5. **Configure Secrets**:
   - Under `airus-backend`, locate the `NVIDIA_API_KEY` field marked as manual input.
   - Paste your actual NVIDIA API key (`nvapi-...`).
   - The `JWT_SECRET` and `DATABASE_URL` will be auto-generated and linked by Render Blueprint.
6. Click **Apply**.

---

## 3. Alternative: Manual Service Deployment

If you prefer deploying services manually without Blueprint:

### Step A: Deploy PostgreSQL
1. Click **New +** -> **PostgreSQL**.
2. Name: `airus-postgres`. Database: `airus_db`. User: `airus_user`.
3. Plan: Free.
4. Copy the **Internal Database URL**.

### Step B: Deploy Backend Web Service
1. Click **New +** -> **Web Service**.
2. Connect `https://github.com/nsuryachandra/AiRus_Agent.git`.
3. Name: `airus-backend`.
4. Runtime: `Node`.
5. Build Command: `npm install && npm install --prefix server`
6. Start Command: `npm start --prefix server`
7. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: *(Paste PostgreSQL Internal Database URL)*
   - `JWT_SECRET`: *(Generate a 32+ character random string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `NVIDIA_API_KEY`: *(Your NVIDIA API Key)*
   - `NVIDIA_BASE_URL`: `https://integrate.api.nvidia.com/v1`
   - `NVIDIA_MODEL`: `meta/llama-3.1-70b-instruct`
   - `FRONTEND_URL`: `https://airus-frontend.onrender.com`

### Step C: Deploy Frontend Static Site
1. Click **New +** -> **Static Site**.
2. Connect the same repository.
3. Name: `airus-frontend`.
4. Build Command: `npm install && npm run build --prefix client`
5. Publish Directory: `client/dist`
6. Environment Variables:
   - `VITE_API_BASE_URL`: `https://airus-backend.onrender.com`
7. Under **Redirects/Rewrites**:
   - Add Rewrite: `/*` -> `/index.html` (Status: `Rewrite`)

---

## 4. Post-Deployment Verification Checklist

- [ ] Check backend health: `https://airus-backend.onrender.com/api/health` returns `{"status":"healthy"}`.
- [ ] Open frontend: `https://airus-frontend.onrender.com`.
- [ ] Register new account (e.g. `surya.boss@airus.ai`).
- [ ] Send text or voice prompt: verify AiRus responds via NVIDIA endpoint.
- [ ] Test voice output (speech synthesis) and verify stop/replay buttons.
- [ ] Refresh page: verify conversation history persists from PostgreSQL.
- [ ] On Android Chrome: test **Install App** / **Add to Home screen** from browser menu.

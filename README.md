# AiRus — Personal Voice AI Assistant (Phase 1)

> **AiRus** is a production-engineered, voice-first, multilingual personal AI assistant designed to run on desktop and mobile browsers, installable as a Progressive Web App (PWA), powered by NVIDIA's cloud AI model endpoints, and deployed seamlessly to Render.

---

## 🌟 Key Features

- **Voice-First Interaction**: Hands-free conversation using browser speech recognition and speech synthesis.
- **Multilingual Support**: Conversational intelligence in English, Telugu (తెలుగు), Tenglish (Telugu in Latin script), Hindi, and more.
- **Central Animated AI Orb**: Organic, reactive centerpiece visually responding to real assistant states (`idle`, `listening`, `transcribing`, `thinking`, `speaking`, `error`).
- **NVIDIA AI Cloud Integration**: Scalable LLM inference via NVIDIA's OpenAI-compatible API (`meta/llama-3.1-70b-instruct`).
- **Full Persistent History**: PostgreSQL durable conversation storage with per-user data isolation.
- **Secure Authentication**: Password hashing with bcrypt, JWT token authentication, rate limiting, and HTTP security headers with Helmet.
- **Android PWA Ready**: Installable on Android Chrome ("Add to Home screen" / "Install App") with offline application shell caching.
- **Production Render Blueprint**: One-click multi-service deployment defined in `render.yaml`.

---

## 🛠️ Architecture & Tech Stack

```
AiRus/
├── client/                     # Frontend SPA & PWA (React + Vite + Tailwind CSS + Framer Motion)
│   ├── public/                 # PWA manifest, service worker, icons
│   ├── src/
│   │   ├── components/         # AiOrb, Navbar, MessageList, MessageInput, Modals
│   │   ├── context/            # AuthContext, VoiceContext
│   │   └── services/           # api.js client
│   └── test/                   # Frontend Vitest test suite
├── server/                     # Backend API (Node.js 20 + Express)
│   ├── src/
│   │   ├── config/             # Environment validation
│   │   ├── controllers/        # Auth & conversation controllers
│   │   ├── database/           # PostgreSQL pool & migrations
│   │   ├── middleware/         # Auth, rateLimiter, errorHandler
│   │   ├── routes/             # Health, auth, conversation routes
│   │   └── services/           # nvidiaService.js
│   └── test/                   # Backend Vitest test suite
├── database/
│   └── schema.sql              # Idempotent PostgreSQL schema
├── docs/
│   └── DEPLOYMENT.md           # Render deployment instructions
├── .env.example                # Environment configuration template
├── render.yaml                 # Render Blueprint configuration
└── package.json                # Monorepo coordinator scripts
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **NVIDIA API Key**: (Get one free at [build.nvidia.com](https://build.nvidia.com))
- **PostgreSQL**: (Optional for local dev; built-in development fallback store is active if no database is configured)

### 2. Installation
```bash
git clone https://github.com/nsuryachandra/AiRus_Agent.git
cd AiRus_Agent
npm run setup
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your:
- `NVIDIA_API_KEY=nvapi-...`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/airus` (or leave empty to use dev fallback store)

### 4. Run Development Servers
Start both the Express backend and Vite frontend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Running Automated Tests

Run the full automated test suites across backend and frontend:
```bash
# Run both backend and frontend tests
npm test

# Run backend tests only
npm run test:server

# Run frontend tests only
npm run test:client
```

---

## 📱 Installing AiRus as a PWA on Android

1. Open the hosted HTTPS URL (e.g., `https://airus-frontend.onrender.com`) in **Android Chrome**.
2. Tap the in-app **"Install App"** button or open the Chrome menu (`⋮`) and select **"Add to Home screen"** or **"Install app"**.
3. AiRus installs directly to your home screen with a standalone app window and icon.

---

## 🌐 Deploying to Render

AiRus includes a first-class `render.yaml` Blueprint specification.

1. Push your code to GitHub:
   ```bash
   git push origin main
   ```
2. In [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Select your repository `nsuryachandra/AiRus_Agent`.
4. Provide your `NVIDIA_API_KEY` when prompted and click **Apply**.
5. Render automatically provisions the PostgreSQL database, backend Node.js API, and static frontend SPA.

For detailed instructions, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 🔒 Security & Best Practices

- **Zero Client Secrets**: NVIDIA API keys and database credentials reside exclusively in server-side environment variables.
- **Password Protection**: Passwords are cryptographically salted and hashed using `bcrypt`.
- **Per-User Isolation**: Every database query verifies conversation ownership (`user_id = $1`).
- **Abuse Prevention**: Express rate-limiting protects authentication and model inference endpoints.
- **Safe Service Worker**: PWA service worker caches only static application assets; all `/api/*` requests bypass the cache completely.

---

## 📄 License

MIT © 2026 Surya Chandra.

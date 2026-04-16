# AI Social Media Content Studio

Full-stack rebuild from scratch using **React + Tailwind (frontend)** and **Node.js + Express + MongoDB (backend)** with **free AI providers** (Hugging Face or OpenRouter free models).

## 1) Folder Structure

```text
studio/
  frontend/
    .env.example
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
    src/
      App.jsx
      index.css
      main.jsx
      components/
        common/
          StatCard.jsx
        layout/
          AppLayout.jsx
          Sidebar.jsx
          Topbar.jsx
      data/
        mockData.js
      pages/
        ChatbotPage.jsx
        ContentGeneratorPage.jsx
        DashboardPage.jsx
        ImageGeneratorPage.jsx
        SchedulerPage.jsx
      services/
        api.js
  backend/
    .env.example
    package.json
    src/
      app.js
      server.js
      config/
        db.js
        env.js
      controllers/
        ai.controller.js
        analytics.controller.js
        schedule.controller.js
      models/
        GeneratedContent.js
        ScheduledPost.js
      routes/
        ai.routes.js
        analytics.routes.js
        index.js
        schedule.routes.js
      services/
        ai.service.js
        analytics.service.js
        image.service.js
        schedule.service.js
      utils/
        asyncHandler.js
        errorMiddleware.js
```

## 2) Backend APIs (MVC + Free AI)

Base URL: `http://localhost:5000/api`

### `POST /generate-content`
Request:

```json
{
  "topic": "Launching our minimalist AI planner app",
  "platform": "Instagram",
  "tone": "Professional",
  "optimize": true
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "id": "671f3b9f2f3a4a1cbfce9911",
    "caption": "Your generated caption text...",
    "hashtags": ["#AIContent", "#SocialMedia", "#Growth"]
  }
}
```

### `POST /generate-image`
Request:

```json
{
  "prompt": "A futuristic lounge in clouds, violet ambient lighting",
  "aspectRatio": "16:9",
  "style": "Photorealistic",
  "lighting": "Golden Hour"
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "imageUrl": "data:image/png;base64,iVBORw0KGgo...",
    "prompt": "A futuristic lounge in clouds, violet ambient lighting"
  }
}
```

### `POST /chat`
Request:

```json
{
  "message": "Suggest 5 hooks for a productivity reel",
  "context": "Social media strategy assistant"
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "reply": "Here are 5 high-performing hook ideas..."
  }
}
```

### `POST /schedule-post`
Request:

```json
{
  "title": "Weekly AI Digest",
  "platform": "LinkedIn",
  "scheduledAt": "2026-04-20T09:00:00.000Z"
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "id": "671f3d112f3a4a1cbfce9919",
    "title": "Weekly AI Digest",
    "platform": "LinkedIn",
    "scheduledAt": "2026-04-20T09:00:00.000Z",
    "status": "scheduled"
  }
}
```

### `GET /analytics`
Sample response:

```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalPosts": 142,
      "scheduledPosts": 18,
      "engagementRate": 8.2,
      "followers": 42.8
    },
    "topPlatform": "Instagram",
    "bestPostingWindow": "Tuesday 6:00 PM - 9:00 PM"
  }
}
```

## 3) AI Provider Configuration (Free)

Backend `.env` (copy from `backend/.env.example`):

- `AI_PROVIDER=huggingface` uses Hugging Face Inference API.
- `AI_PROVIDER=openrouter` uses OpenRouter with a free model.

### Hugging Face (text + image)
- `HUGGINGFACE_API_KEY`
- `HUGGINGFACE_TEXT_MODEL` (default: `HuggingFaceTB/SmolLM3-3B`)
- `HUGGINGFACE_IMAGE_MODEL` (default: `black-forest-labs/FLUX.1-dev`)

### OpenRouter (text)
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (example free: `mistralai/mistral-7b-instruct:free`)

## 4) Frontend Setup (React + Tailwind)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## 5) Backend Setup (Express + MongoDB)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

## 6) MongoDB Setup

Use one of these free options:

1. Local MongoDB Community server:
   - Keep `MONGODB_URI=mongodb://127.0.0.1:27017/ai-content-studio`
2. MongoDB Atlas free tier:
   - Replace `MONGODB_URI` with your Atlas connection string.

## 7) Frontend Pages Implemented

- Dashboard
- Content Generator
- Image Generator
- Scheduler
- Chatbot panel

All pages are componentized, responsive, and API-ready. Dummy/mock data is still used where useful for design fidelity, but generation/chat/schedule/analytics are wired to backend calls.

## 8) Easy Swap Design

- Text generation logic is isolated in `backend/src/services/ai.service.js`.
- Image generation logic is isolated in `backend/src/services/image.service.js`.
- Controllers are thin and can remain unchanged when providers are swapped.


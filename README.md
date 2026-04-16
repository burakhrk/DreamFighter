# DreamFighter

Prompt-driven 2D combat sandbox prototype.

## Current prototype

The first vertical slice lives in `web/` and focuses on:

- character prompt -> constrained fighter build
- attack prompt -> constrained primary attack build
- stylized 2D sandbox against a moving dummy
- arcade movement, jump, mouse aim, and hit feedback

## Run locally

```bash
cd web
npm install
npm run dev
```

## Notes

- Create `web/.env` from `web/.env.example` before running the app.
- Put your OpenAI key in `web/.env` as `OPENAI_API_KEY=...`.
- The frontend talks to a local Express server over `/api`, so the key never goes to the browser.
- Generation now uses OpenAI on the server and clamps the result into game-safe stats and attack values.
- Production deploys can use Vercel Functions from `web/api`.
- The repo root also includes `vercel.json` and root `api/` wrappers so Vercel can deploy correctly even if the dashboard keeps the project rooted at the repository root.

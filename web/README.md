# DreamFighter Web

Web prototype for the prompt-driven 2D combat sandbox.

## Local development

```bash
npm install
npm run dev
```

Create a `web/.env` file from `web/.env.example` before starting local development.

## Deployment

- Vercel Root Directory: `web`
- Framework Preset: `Vite` or `Other` with manual build settings
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variables:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.4
```

The `api/` directory is Vercel-compatible and serves the OpenAI-backed generation endpoints in production.

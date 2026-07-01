# Capsule

Capsule is an Object Continuity System for preserving ordinary objects as future artifacts. It is not a journal, scrapbook, photo album, or nostalgia app.

The current MVP supports a local-first preservation loop:

- Capture Point image intake with object context prompts
- Preservation Chamber session state and staged scan ritual
- Local backend artifact generation endpoint
- OpenAI vision generation when `OPENAI_API_KEY` is available
- Premium fallback generation when no API key is configured or the model fails
- LocalStorage artifact repository
- Artifact View with Seal Fossil, observations, timeline, and generated metadata
- Archive and Rediscover screens backed by saved artifacts

## Setup

```bash
npm install
cp .env.example .env
cp server/.env.example server/.env
npm run dev:all
```

Frontend: `http://localhost:5173` or the next Vite port if 5173 is occupied.

Backend: `http://localhost:8787`

## Scripts

```bash
npm run dev       # Vite frontend only
npm run dev:host  # Vite frontend on your local network
npm run server    # local artifact generation backend only
npm run dev:all   # frontend and backend together
npm run dev:all:host # frontend on local network and backend together
npm run build     # TypeScript and production build
```

## Testing on Phone

Local network testing:

1. Run the backend: `npm run server`
2. Run the frontend for network access: `npm run dev:host`
3. Find your computer IP address.
4. Open `http://YOUR_LOCAL_IP:5174` or the Vite port shown in the terminal.

Mobile camera access may not work over plain HTTP except on `localhost`. For reliable phone camera testing, use an HTTPS preview or tunnel such as Vercel Preview, Netlify Preview, Cloudflare Tunnel, ngrok, or localtunnel.

## AI Generation

To enable vision-backed artifact generation, set this in `server/.env`:

```bash
OPENAI_API_KEY=your_key_here
PORT=8787
```

The frontend never reads the API key. It only calls the local backend at `VITE_API_BASE_URL`, which defaults to `http://localhost:8787`.

## Fallback Mode

Capsule works without `OPENAI_API_KEY`. The backend uses a local fallback generator that derives a structured artifact from the object name and user context. If the backend is unavailable during local development, the frontend has an emergency client fallback so the capture loop can still complete.

## Known Limitations

- Artifacts are stored in `localStorage` only.
- Uploaded images are stored as data URLs in the browser.
- Object isolation is simulated.
- There is no database, auth, cloud storage, or 3D reconstruction yet.
- The current vision endpoint returns structured artifact metadata, not true object segmentation.

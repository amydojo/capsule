# Capsule

Capsule is an Object Continuity System for preserving ordinary objects as future artifacts. It is not a journal, scrapbook, photo album, or nostalgia app.

The current MVP supports a local-first preservation loop:

- Capture Point image intake with object context prompts
- Manual object field selection that extracts a specimen image from the source capture
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

The frontend never reads the API key. In production it calls the relative Vercel API route at `/api/artifacts/generate`. In local development, set `VITE_API_BASE_URL=http://localhost:8787` to call the Express server.

## Vercel Deployment

1. Push repo to GitHub.
2. Import repo in Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add env var `OPENAI_API_KEY` only if using AI generation.
7. Deploy.
8. Open `/capture` on phone over HTTPS.

Production uses the Vercel function at `/api/artifacts/generate`, so `VITE_API_BASE_URL` is not required in Vercel. Local development can keep `VITE_API_BASE_URL=http://localhost:8787` when running `npm run dev:all`.

## Fallback Mode

Capsule works without `OPENAI_API_KEY`. The backend uses a built-in artifact generator that derives a structured artifact from the object name and user context. If the backend is unavailable during local development, the frontend can still generate a structured artifact so the capture loop can complete.

## Reality Extraction Roadmap

V1 Manual Object Field Lock:
- user locks Object Field
- canvas specimen extraction
- Source Capture retained as provenance

V2 Assisted Object Lock:
- AI suggests object candidates
- user confirms boundary

V3 Specimen Isolation:
- segmentation mask / background removal
- transparent specimen
- synthetic shadow

V4 Specimen Render:
- lighting normalization
- archival render
- product-grade presentation

V5 Object Continuity:
- recognize same object over time
- compare wear/location/context
- Continuity Score evolves

## Object Extraction Test

1. Capture full scene.
2. Lock Object Field.
3. Confirm specimen preview.
4. Add prompts.
5. Add to Chamber.
6. Verify chamber shows specimen.
7. Verify artifact shows specimen.
8. Verify Source Capture appears only in provenance section.
9. Verify archive thumbnail uses specimen.

## Known Limitations

- Artifacts are stored in `localStorage` only.
- Uploaded images are stored as data URLs in the browser.
- Object isolation is manual object field selection, not true segmentation yet.
- There is no database, auth, cloud storage, or 3D reconstruction yet.
- The current vision endpoint returns structured artifact metadata, not true object segmentation.

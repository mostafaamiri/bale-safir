## Bale Message Panel (React + Vite)

A minimal React panel to send instant messages to phone numbers using the Bale Safir API endpoint:

POST https://safir.bale.ai/api/v3/send_message

The app supports two modes:
- Dev Proxy (recommended): Vite dev server proxies `/api` to `https://safir.bale.ai` and injects the `api-access-key` header server-side, so your key is not exposed to the browser.
- Direct Mode (optional): The browser calls `https://safir.bale.ai` directly and sends the `api-access-key` header. Only use in trusted environments.
- Production Server: A small Express server (included) serves the built app and forwards `/api/v3/send_message` to the Safir API while adding the header server-side.

### Prerequisites
- Node.js 18+ and npm
- Your Safir `api-access-key`

### Setup
1. Copy env example and fill your API key:
   - `cp .env.example .env.local` (Windows: copy manually)
   - Edit `.env.local` and set `API_ACCESS_KEY=...`
2. Install dependencies:
   - `npm install`
3. Start the dev server:
   - `npm run dev`
4. Open the app:
   - Visit the URL shown in the terminal (typically `http://localhost:5173`).
5. (Optional) Build a production bundle:
   - `npm run build`
6. (Optional) Serve the production bundle with the Express proxy (requires `API_ACCESS_KEY` env):
   - macOS/Linux: `API_ACCESS_KEY=your-key npm run serve`
   - Windows PowerShell: `$env:API_ACCESS_KEY='your-key'; npm run serve`

### Usage
- Click **Config** and enter your `Bot ID` and `api-access-key` (stored in this browser only).
- Add one or more phone numbers (e.g., `98912xxxxxxx` or `0912xxxxxxx`).
  - Inputs are normalized to `98` prefix when possible.
- Type your message, then click `Send to all` or select specific numbers and click `Send to selected`.
- To send by `chat_id`, add your Bot API token in **Config**, register one or more `chat_id` (numeric or `@channel`) entries, then use the dedicated send buttons in the Chat IDs panel.
- Delivery results appear in the log at the bottom.
- The UI ships in Persian (RTL). Update the strings in `src/App.jsx` if you need another language.

### Environment Variables
- Dev Proxy (npm run dev):
  - `.env.local`: `API_ACCESS_KEY=...`
  - Optional default bot: `VITE_DEFAULT_BOT_ID=1234567890`
- Production server / Docker:
  - Provide `API_ACCESS_KEY` as an environment variable
  - Optional: `PORT` to change the listen port (default 3000)
- Direct Mode fallback (not recommended):
  - `.env.local`: `VITE_DIRECT_API=true` and `VITE_API_ACCESS_KEY=...`
  - This exposes your key to the client.

### Docker
1. Build the image (optional build args are forwarded to Vite during `npm run build`):
   - `docker build -t bale-panel .`
   - Example with default bot: `docker build -t bale-panel --build-arg VITE_DEFAULT_BOT_ID=1234567890 .`
2. Run the container (forwards API requests via Express):
   - `docker run -p 3000:3000 -e API_ACCESS_KEY=your-key bale-panel`
   - Override the port if needed: `docker run -p 8080:8080 -e PORT=8080 -e API_ACCESS_KEY=your-key bale-panel`

### How it works
- Dev (`npm run dev`): the Vite proxy forwards `/api/v3/send_message` to Safir and injects the header using the key provided in the config menu (or `API_ACCESS_KEY` from `.env.local` as a fallback).
- Production (`npm run serve` or Docker): Express serves the `dist` folder and forwards `/api/v3/send_message` to Safir, using the key from the request header (config menu) or `API_ACCESS_KEY` env if none is provided.
- Direct mode: the browser calls Safir directly and attaches `VITE_API_ACCESS_KEY`; only use when you fully control the client environment.

### Production note
Deploy the bundled Express server (or an equivalent backend) so the Safir key stays server-side. Avoid exposing `api-access-key` in client-side bundles unless you understand the security trade-offs.

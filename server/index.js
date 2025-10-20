import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const API_BASE = 'https://safir.bale.ai';

app.use(express.json());
app.use('/assets', express.static(path.join(distDir, 'assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(distDir));

app.post('/api/v3/send_message', async (req, res) => {
  const headerKey = (req.get('api-access-key') || req.get('x-api-access-key') || '').trim();
  const apiKey = headerKey || process.env.API_ACCESS_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API_ACCESS_KEY environment variable is not set.' });
  }

  try {
    const upstream = await fetch(`${API_BASE}/api/v3/send_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-access-key': apiKey
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return res.status(upstream.status).json(data || { error: upstream.statusText });
    }

    return res.status(upstream.status).json(data);
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach Safir API.', detail: error.message });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Unsupported API endpoint.' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

import 'dotenv/config';
import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PYTHON_API_HOST = '127.0.0.1';
const PYTHON_API_PORT = Number(process.env.PYTHON_API_PORT || 8765);

let pythonProcess: ChildProcess | null = null;

function startPythonBackend(): ChildProcess {
  const scriptPath = path.join(__dirname, 'api', '_lib', 'local_server.py');
  const child = spawn('python3', [scriptPath], {
    cwd: __dirname,
    env: {
      ...process.env,
      PYTHON_API_HOST,
      PYTHON_API_PORT: String(PYTHON_API_PORT),
      PYTHONUNBUFFERED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (chunk: Buffer) => {
    process.stdout.write(chunk);
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(chunk);
  });
  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`[server] Python backend exited with code ${code}`);
    }
  });

  return child;
}

async function waitForPythonReady(timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const healthy = await new Promise<boolean>((resolve) => {
      const req = http.get(
        {
          host: PYTHON_API_HOST,
          port: PYTHON_API_PORT,
          path: '/api/health',
          timeout: 500,
        },
        (res) => {
          res.resume();
          resolve(res.statusCode === 200);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });

    if (healthy) {
      return;
    }
    await new Promise((r) => setTimeout(r, 120));
  }
}

function proxyToPython(req: Request, res: Response): void {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const bodyBuffer = Buffer.concat(chunks);
    const headers: Record<string, string | string[]> = {};

    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    }
    if (bodyBuffer.length > 0) {
      headers['content-length'] = String(bodyBuffer.length);
    }

    const proxyReq = http.request(
      {
        host: PYTHON_API_HOST,
        port: PYTHON_API_PORT,
        path: req.originalUrl,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.status(proxyRes.statusCode || 502);
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (value !== undefined) {
            res.setHeader(key, value);
          }
        }
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error('[server] Python API proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({
          ok: false,
          error: 'Python backend is temporarily unavailable.',
        });
      }
    });

    if (bodyBuffer.length > 0) {
      proxyReq.write(bodyBuffer);
    }
    proxyReq.end();
  });
}

async function createServer() {
  pythonProcess = startPythonBackend();
  await waitForPythonReady();

  const app = express();
  app.set('trust proxy', true);

  app.use('/api', proxyToPython);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] Running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close();
    if (pythonProcess && !pythonProcess.killed) {
      pythonProcess.kill('SIGTERM');
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

createServer().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  if (pythonProcess && !pythonProcess.killed) {
    pythonProcess.kill('SIGTERM');
  }
  process.exit(1);
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const broadcastDbPath = path.resolve(__dirname, 'broadcast-db.json');

  const readBroadcastDb = async () => {
    try {
      return JSON.parse(await fs.readFile(broadcastDbPath, 'utf8'));
    } catch {
      return {};
    }
  };

  const writeBroadcastDb = async (db: Record<string, unknown>) => {
    await fs.writeFile(broadcastDbPath, JSON.stringify(db, null, 2), 'utf8');
  };

  const readJsonBody = (req: any) => new Promise<any>((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

  const sendJson = (res: any, status: number, payload: unknown) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };

  return {
    plugins: [
      {
        name: 'broadcast-state-database',
        configureServer(server) {
          server.middlewares.use('/api/broadcast-state', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '/', 'http://localhost');
              const method = req.method || 'GET';
              const db = await readBroadcastDb();

              if (method === 'GET') {
                const user = (requestUrl.searchParams.get('user') || 'default').toLowerCase();
                sendJson(res, 200, {
                  success: true,
                  data: db[user] || null,
                  error: null
                });
                return;
              }

              if (method === 'POST') {
                const body = await readJsonBody(req);
                const user = String(body.user || 'default').toLowerCase();
                db[user] = {
                  user,
                  state: body.state,
                  updatedAt: new Date().toISOString()
                };
                await writeBroadcastDb(db);
                sendJson(res, 200, {
                  success: true,
                  data: db[user],
                  error: null
                });
                return;
              }

              sendJson(res, 405, {
                success: false,
                data: null,
                error: 'Method not allowed'
              });
            } catch (err: any) {
              sendJson(res, 500, {
                success: false,
                data: null,
                error: err?.message || String(err)
              });
            }
          });
        },
      },
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/google-sheets': {
          target: 'https://docs.google.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/google-sheets/, ''),
          secure: false,
        }
      }
    },
  };
});

import express from 'express';
import { Express } from 'express';
import { Server } from 'http';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import path from 'path';

export async function setupVite(app: Express, server: Server) {
  const vite: ViteDevServer = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  app.use(express.static(path.join(__dirname, 'dist')));
} 
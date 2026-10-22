import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function relicUploadPersistencePlugin(): Plugin {
  return {
    name: 'relic-upload-persistence',
    configureServer(server) {
      server.middlewares.use('/api/save-relic', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        const urlObj = new URL(req.url || '', 'http://localhost');
        const slot = urlObj.searchParams.get('slot');
        const targetFile =
          slot === 'lantern-relic' ? 'lantern.glb' : 'dragon_relic.glb';
        const outPath = path.resolve(__dirname, 'public/models', targetFile);

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            if (buffer.length < 100) {
              res.statusCode = 400;
              res.end(JSON.stringify({ok: false, error: 'Empty buffer'}));
              return;
            }
            fs.writeFileSync(outPath, buffer);
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: true,
                file: `/models/${targetFile}`,
                bytes: buffer.length,
              })
            );
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ok: false, error: String(err)}));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), relicUploadPersistencePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

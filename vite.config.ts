import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

function localGradingApi(): Plugin {
  return {
    name: 'devprep-local-grading-api',
    configureServer(server) {
      server.middlewares.use('/api/quizzes/grade', (incoming, outgoing, next) => {
        const requestUrl = new URL(incoming.url ?? '/', 'http://local.devprep');
        if (requestUrl.pathname !== '/') {
          next();
          return;
        }

        void (async () => {
          const bodyParts: string[] = [];
          for await (const value of incoming) {
            const chunk: unknown = value;
            if (typeof chunk === 'string') bodyParts.push(chunk);
            else if (chunk instanceof Uint8Array) {
              bodyParts.push(Buffer.from(chunk).toString('utf8'));
            } else {
              throw new Error('Unsupported local request body');
            }
          }

          const headers = new Headers();
          for (const [name, value] of Object.entries(incoming.headers)) {
            if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
            else if (value !== undefined) headers.set(name, value);
          }

          const { POST } = await import('./api/quizzes/grade.ts');
          const response = await POST(
            new Request('http://127.0.0.1:5173/api/quizzes/grade', {
              method: incoming.method,
              headers,
              body: bodyParts.length > 0 ? bodyParts.join('') : undefined,
            }),
          );
          outgoing.statusCode = response.status;
          response.headers.forEach((value, name) => outgoing.setHeader(name, value));
          outgoing.end(Buffer.from(await response.arrayBuffer()));
        })().catch(() => {
          outgoing.statusCode = 503;
          outgoing.setHeader('content-type', 'application/json');
          outgoing.end(JSON.stringify({ error: 'GRADING_UNAVAILABLE' }));
        });
      });
      server.middlewares.use('/api', (_incoming, outgoing) => {
        outgoing.statusCode = 404;
        outgoing.setHeader('content-type', 'application/json');
        outgoing.end(JSON.stringify({ error: 'API_ROUTE_NOT_FOUND' }));
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.DEVPREP_LOCAL_API === '1' ? [localGradingApi()] : []),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'shared/**/*.test.ts', 'tests/api/**/*.test.ts'],
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});

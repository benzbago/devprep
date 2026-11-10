import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '..');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

describe('Vercel release safety', () => {
  it('keeps test modules out of the routable api tree', () => {
    const routeModules = sourceFiles(resolve(repositoryRoot, 'api'))
      .filter((path) => path.endsWith('.ts'))
      .map((path) => relative(repositoryRoot, path).replaceAll('\\', '/'))
      .filter((path) => !path.startsWith('api/_lib/'))
      .sort();

    expect(routeModules).toEqual(['api/quizzes/grade.ts']);
  });

  it('uses runtime-resolvable relative imports in server modules', () => {
    const serverModules = [
      resolve(repositoryRoot, 'api/quizzes/grade.ts'),
      resolve(repositoryRoot, 'api/_lib/server-supabase.ts'),
    ];

    const importsWithTypeScriptExtensions = serverModules.flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      return [...source.matchAll(/from\s+['"](\.\.?\/[^'"]+\.ts)['"]/g)].map(
        ([, specifier]) => `${relative(repositoryRoot, path)}: ${specifier}`,
      );
    });

    expect(importsWithTypeScriptExtensions).toEqual([]);
  });

  it('exports GET so Vercel returns the handler JSON for unsupported reads', () => {
    const source = readFileSync(resolve(repositoryRoot, 'api/quizzes/grade.ts'), 'utf8');

    expect(source).toMatch(/export\s+(?:async\s+)?function\s+GET\s*\(/);
  });
});

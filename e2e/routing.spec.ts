import { expect, test } from '@playwright/test';

const isViteAdapter = process.env.DEVPREP_ROUTING_RUNTIME === 'vite-adapter';

const deepLinks = [
  ['/', /practice javascript with a clear path/i],
  ['/tutor', /javascript tutor demo/i],
  ['/challenges/normalize-words', /normalize a list of words/i],
  ['/sample-quiz', /javascript sample quiz/i],
  ['/dashboard', /sample learning dashboard/i],
] as const;

for (const [path, heading] of deepLinks) {
  test(`serves the SPA deep link ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  });
}

test('serves emitted static assets without the SPA fallback', async ({
  page,
  request,
}) => {
  await page.goto('/tutor');
  const scriptPath = await page
    .locator('script[type="module"][src]')
    .last()
    .getAttribute('src');
  expect(scriptPath).toMatch(
    isViteAdapter ? /^\/src\/main\.tsx(?:\?.*)?$/ : /^\/assets\/.*\.js$/,
  );

  const response = await request.get(scriptPath!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('javascript');
  expect(await response.text()).not.toContain('<!doctype html>');
});

test('reaches the grading handler instead of the SPA fallback', async ({ request }) => {
  const methodResponse = await request.get('/api/quizzes/grade');
  expect(methodResponse.status()).toBe(405);
  expect(methodResponse.headers()['content-type'] ?? '').not.toContain('text/html');

  const authResponse = await request.post('/api/quizzes/grade', {
    data: {},
    headers: { 'content-type': 'application/json' },
  });
  expect(authResponse.status()).toBe(401);
  expect(await authResponse.json()).toEqual({ error: 'AUTHENTICATION_REQUIRED' });
});

for (const path of ['/api/not-a-route', '/api/quizzes/grade/not-a-route']) {
  test(`keeps the unknown API path ${path} outside the SPA`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type'] ?? '').not.toContain('text/html');
    expect(await response.text()).not.toContain('<!doctype html>');
  });
}

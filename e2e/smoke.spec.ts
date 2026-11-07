import { expect, test } from '@playwright/test';

test('moves from the landing page into the honest tutor demo', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /practice javascript with a clear path/i }),
  ).toBeVisible();
  await page.getByRole('link', { name: /try the tutor demo/i }).click();
  await expect(page).toHaveURL(/\/tutor$/);
  await expect(page.getByText('Demo — predefined responses').first()).toBeVisible();
  await page.getByRole('button', { name: /why use an object for counting/i }).click();
  await expect(
    page.getByText(/an object gives each distinct value its own named slot/i),
  ).toBeVisible();
});

test('loads direct routes and renders the not-found page', async ({ page }) => {
  await page.goto('/tutor');
  await expect(
    page.getByRole('heading', { name: /javascript tutor demo/i }),
  ).toBeVisible();
  await page.goto('/not-a-route');
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
});

test('loads a curated challenge directly and rejects an unknown challenge', async ({
  page,
}) => {
  await page.goto('/challenges/frequency-counter');
  await expect(
    page.getByRole('heading', { name: /build a frequency counter/i }),
  ).toBeVisible();
  await page.goto('/challenges/not-real');
  await expect(page.getByRole('heading', { name: /challenge not found/i })).toBeVisible();
});

test('supports keyboard navigation and a visible skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: /skip to main content/i });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await page.goto('/');
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 768) {
    await page.getByRole('button', { name: /open navigation/i }).click();
  }
  const navigation = page.getByRole('navigation', {
    name: viewport && viewport.width < 768 ? /mobile navigation/i : /primary navigation/i,
  });
  const tutorLink = navigation.getByRole('link', { name: /tutor demo/i });
  await tutorLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tutor$/);
});

test('opens the mobile navigation and exposes every destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /open navigation/i }).click();
  const navigation = page.getByRole('navigation', { name: /mobile navigation/i });
  await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Tutor demo' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

test('makes no external request during the predefined demo journey', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      externalRequests.push(request.url());
    }
  });

  await page.goto('/tutor');
  await page.getByRole('button', { name: /why use an object for counting/i }).click();
  await page.getByRole('button', { name: /show hint 1/i }).click();
  await page.getByRole('button', { name: /i have a different question/i }).click();
  expect(externalRequests).toEqual([]);
});

test('grades the public sample without credentials or network calls', async ({
  page,
}) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/') || request.url().includes('supabase')) {
      apiRequests.push(request.url());
    }
  });

  await page.goto('/sample-quiz');
  await expect(
    page.getByText(/public sample.*answers may be inspectable/i),
  ).toBeVisible();
  await page.getByRole('radio', { name: 'number' }).click();
  await page.getByRole('radio', { name: 'undefined' }).click();
  await page.getByRole('button', { name: /check sample answers/i }).click();
  await expect(page.getByText('100%')).toBeVisible();
  expect(apiRequests).toEqual([]);
});

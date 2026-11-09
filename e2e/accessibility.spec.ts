import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    ),
  ).toEqual([]);
}

async function expectFocusedElementInViewport(page: Page) {
  await expect
    .poll(() =>
      page.evaluate<boolean>(`(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement)) return false;
        const rectangle = element.getBoundingClientRect();
        return rectangle.left >= 0
          && rectangle.right <= window.innerWidth
          && rectangle.top >= 0
          && rectangle.bottom <= window.innerHeight;
      })()`),
    )
    .toBe(true);
}

test('public sample supports keyboard grading with one result announcement path', async ({
  page,
}) => {
  await page.goto('/sample-quiz');
  await expectNoSeriousViolations(page);

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  const submit = page.getByRole('button', { name: /check sample answers/i });
  await expect(submit).toBeDisabled();
  await page.keyboard.press('Tab');
  const first = page.getByRole('radio', { name: 'number' });
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'integer' })).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(first).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: 'null' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'undefined' })).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
  await expect(submit).toBeEnabled();
  await page.keyboard.press('Enter');

  const result = page.getByRole('heading', { name: '100%' });
  await expect(result).toBeFocused();
  await expect(result.locator('xpath=ancestor-or-self::*[@aria-live]')).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
  await expectNoSeriousViolations(page);
});

test('public sample keeps keyboard focus visible at 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/sample-quiz');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await expectFocusedElementInViewport(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: 'number' })).toBeFocused();
  await expectFocusedElementInViewport(page);
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /check sample answers/i })).toBeFocused();
  await expectFocusedElementInViewport(page);
});

test('quiz and dashboard public states fit a narrow viewport without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const path of ['/sample-quiz', '/dashboard', '/quizzes']) {
    await page.goto(path);
    const widths = await page.evaluate<{ document: number; viewport: number }>(
      '({ document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth })',
    );
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    await expectNoSeriousViolations(page);
  }
});

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

test('public sample supports keyboard grading with one result announcement path', async ({
  page,
}) => {
  await page.goto('/sample-quiz');
  await expectNoSeriousViolations(page);

  const first = page.getByRole('radio', { name: 'number' });
  await first.focus();
  await page.keyboard.press('Space');
  await page.getByRole('radio', { name: 'undefined' }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: /check sample answers/i }).focus();
  await page.keyboard.press('Enter');

  const result = page.getByRole('heading', { name: '100%' });
  await expect(result).toBeFocused();
  await expect(result.locator('xpath=ancestor-or-self::*[@aria-live]')).toHaveCount(0);
  await expectNoSeriousViolations(page);
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

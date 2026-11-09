import { createClient } from '@supabase/supabase-js';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    'Local Supabase values are required; authenticated quiz tests do not skip.',
  );
}

async function tabTo(page: Page, target: Locator, maximumTabs = 30) {
  for (let tabCount = 0; tabCount < maximumTabs; tabCount += 1) {
    await page.keyboard.press('Tab');
    if (
      await target.evaluate((element) => element === element.ownerDocument.activeElement)
    )
      return;
  }
  throw new Error(`Target did not receive focus within ${maximumTabs} Tab presses.`);
}

test('grades an authenticated quiz and persists real dashboard progress', async ({
  page,
}) => {
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const email = `quiz-playwright-${crypto.randomUUID()}@example.test`;
  const password = `Local-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();

  try {
    await page.goto('/account');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Code drafts' })).toBeVisible();

    await page.getByLabel('Title').fill('Account deletion check');
    await page.getByLabel('Code').fill('const removedWithAccount = true;');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText('Draft saved. Not executed or verified.')).toBeVisible();

    await page.goto('/quizzes');
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations.filter(({ impact }) => impact === 'critical' || impact === 'serious'),
    ).toEqual([]);
    await page.getByRole('link', { name: 'Take quiz' }).click();
    await page.getByRole('radio', { name: '3' }).focus();
    await page.keyboard.press('Space');
    await page.getByRole('radio', { name: 'A new array of transformed values' }).focus();
    await page.keyboard.press('Space');
    await page.getByRole('radio', { name: 'Value and type without coercion' }).focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Submit quiz' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: '100%' })).toBeFocused();
    await page.keyboard.press('Tab');
    const newAttemptButton = page.getByRole('button', { name: 'Start a new attempt' });
    await expect(newAttemptButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('radio', { name: '3' })).not.toBeChecked();
    await expect(page.getByRole('button', { name: 'Submit quiz' })).toBeDisabled();

    await page.goto('/dashboard');
    await expect(
      page.getByText('Every figure below comes from your server-graded quiz attempts.'),
    ).toBeVisible();
    await expect(
      page.getByText('Total attempts').locator('..').getByText('1'),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('Latest score').locator('..').getByText('100%'),
    ).toBeVisible();
    await expect(page.getByText('Keep it fresh')).toBeVisible();
    await expect(page.getByText(/not AI-generated/i)).toBeVisible();
    const recommendationLink = page.getByRole('link', {
      name: 'Take JavaScript foundations',
    });
    await expect(recommendationLink).toHaveAttribute(
      'href',
      '/quizzes/javascript-foundations/1',
    );
    await page.locator('body').focus();
    await tabTo(page, recommendationLink);
    await expect(recommendationLink).toBeFocused();
    await page.keyboard.press('Tab');
    const challengeLink = page.getByRole('link', {
      name: 'Practice Normalize a list of words',
    });
    await expect(challengeLink).toBeFocused();
    await expect(challengeLink).toHaveAttribute('href', '/challenges/normalize-words');
    await page.keyboard.press('Shift+Tab');
    await expect(recommendationLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/quizzes\/javascript-foundations\/1$/);
    await expect(
      page.getByRole('heading', { name: 'JavaScript foundations' }),
    ).toBeVisible();
    await page.goto('/drafts');
    const signOutButton = page.getByRole('button', { name: 'Sign out' });
    await tabTo(page, signOutButton);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Sample learning dashboard' }),
    ).toBeVisible();
    await expect(
      page.getByText('Every figure below comes from your server-graded quiz attempts.'),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Take JavaScript foundations' }),
    ).toHaveCount(0);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations.filter(({ impact }) => impact === 'critical' || impact === 'serious'),
    ).toEqual([]);
  } finally {
    if (data.user) {
      const deletion = await admin.auth.admin.deleteUser(data.user.id);
      expect(deletion.error).toBeNull();

      const [drafts, attempts] = await Promise.all([
        admin
          .from('code_drafts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', data.user.id),
        admin
          .from('quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', data.user.id),
      ]);
      expect(drafts.error).toBeNull();
      expect(drafts.count).toBe(0);
      expect(attempts.error).toBeNull();
      expect(attempts.count).toBe(0);
    }
  }
});

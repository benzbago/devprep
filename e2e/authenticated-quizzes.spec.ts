import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    'Local Supabase values are required; authenticated quiz tests do not skip.',
  );
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

    await page.goto('/quizzes');
    await page.getByRole('link', { name: 'Take quiz' }).click();
    await page.getByRole('radio', { name: '3' }).click();
    await page.getByRole('radio', { name: 'A new array of transformed values' }).click();
    await page.getByRole('radio', { name: 'Value and type without coercion' }).click();
    await page.getByRole('button', { name: 'Submit quiz' }).click();
    await expect(page.getByText('100%')).toBeVisible();

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
  } finally {
    if (data.user) await admin.auth.admin.deleteUser(data.user.id);
  }
});

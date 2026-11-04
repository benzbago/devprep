import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(url && serviceRoleKey);

test.describe('authenticated draft persistence', () => {
  test.skip(
    !canRun,
    'Requires a running local Supabase stack and its local service-role key.',
  );

  test('saves a private draft across a reload and deletes it', async ({ page }) => {
    const admin = createClient(url!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const email = `playwright-${crypto.randomUUID()}@example.test`;
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

      await page.getByLabel('Title').fill('Persistent local draft');
      await page.getByLabel('Code').fill('const localOnly = true;');
      await page.getByRole('button', { name: 'Save draft' }).click();
      await expect(
        page.getByText('Draft saved. Not executed or verified.'),
      ).toBeVisible();

      await page.reload();
      await expect(
        page.getByRole('button', { name: /Persistent local draft/ }),
      ).toBeVisible();
      await page.getByRole('button', { name: /Persistent local draft/ }).click();
      await expect(page.getByLabel('Code')).toHaveValue('const localOnly = true;');

      await page.getByRole('button', { name: 'Delete' }).click();
      await expect(page.getByText('No saved drafts yet.')).toBeVisible();
    } finally {
      if (data.user) await admin.auth.admin.deleteUser(data.user.id);
    }
  });
});

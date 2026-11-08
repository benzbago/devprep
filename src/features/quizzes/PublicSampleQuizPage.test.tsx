import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicSampleQuizPage } from './PublicSampleQuizPage';

describe('PublicSampleQuizPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('grades inspectable sample content locally without any network request', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const user = userEvent.setup();
    render(<PublicSampleQuizPage />);

    expect(screen.getByText(/public sample.*answers may be inspectable/i)).toBeVisible();
    expect(screen.getByText(/not saved to your account progress/i)).toBeVisible();

    await user.click(screen.getByRole('radio', { name: 'number' }));
    await user.click(screen.getByRole('radio', { name: 'undefined' }));
    await user.click(screen.getByRole('button', { name: /check sample answers/i }));

    const resultHeading = screen.getByRole('heading', { name: '100%' });
    expect(resultHeading).toBeVisible();
    expect(resultHeading).toHaveFocus();
    expect(resultHeading.closest('[aria-live]')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

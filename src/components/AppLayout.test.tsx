import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  it('provides landmarks, a skip link, and primary destinations', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /tutor demo/i })).toHaveAttribute(
      'href',
      '/tutor',
    );
    expect(screen.getByRole('link', { name: /^quizzes$/i })).toHaveAttribute(
      'href',
      '/quizzes',
    );
    expect(screen.getByRole('link', { name: /sample quiz/i })).toHaveAttribute(
      'href',
      '/sample-quiz',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('toggles the mobile navigation with an accessible control', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', { name: /open navigation/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: /close navigation/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});

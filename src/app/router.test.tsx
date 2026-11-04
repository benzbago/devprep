import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { appRoutes } from './router';

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('application routes', () => {
  it('renders the landing page', () => {
    renderRoute('/');
    expect(
      screen.getByRole('heading', { name: /practice javascript with a clear path/i }),
    ).toBeVisible();
  });

  it('renders an honest sample dashboard', () => {
    renderRoute('/dashboard');
    expect(
      screen.getByRole('heading', { name: /sample learning dashboard/i }),
    ).toBeVisible();
    expect(screen.getByText(/sample content only/i)).toBeVisible();
  });

  it('renders a direct curated challenge route', () => {
    renderRoute('/challenges/frequency-counter');
    expect(
      screen.getByRole('heading', { name: /build a frequency counter/i }),
    ).toBeVisible();
    expect(screen.getByText(/practice loops, object keys/i)).toBeVisible();
  });

  it('handles an unknown challenge id honestly', () => {
    renderRoute('/challenges/not-real');
    expect(screen.getByRole('heading', { name: /challenge not found/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /open tutor demo/i })).toHaveAttribute(
      'href',
      '/tutor',
    );
  });

  it('renders a useful not-found page', () => {
    renderRoute('/missing');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});

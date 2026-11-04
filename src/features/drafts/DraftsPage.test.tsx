import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthState } from '../auth/auth-context';
import { listDrafts, type CodeDraft } from './draft-service';
import { DraftsPage } from './DraftsPage';

vi.mock('./draft-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./draft-service')>()),
  listDrafts: vi.fn(),
}));

const signedOut: AuthState = {
  status: 'signedOut',
  signIn: () => Promise.resolve({ ok: false, message: '' }),
  signUp: () => Promise.resolve({ ok: false, message: '' }),
  signOut: () => Promise.resolve(),
};

describe('DraftsPage', () => {
  beforeEach(() => vi.mocked(listDrafts).mockReset());

  it('requires sign-in without affecting public pages', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={signedOut}>
          <DraftsPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /sign in to save drafts/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('never displays a late draft response from a previous account', async () => {
    let resolveFirst!: (drafts: CodeDraft[]) => void;
    let resolveSecond!: (drafts: CodeDraft[]) => void;
    vi.mocked(listDrafts)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));

    const userState = (id: string): AuthState => ({
      ...signedOut,
      status: 'signedIn',
      user: { id } as AuthState['user'],
    });
    const view = render(
      <MemoryRouter>
        <AuthContext.Provider value={userState('user-a')}>
          <DraftsPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    view.rerender(
      <MemoryRouter>
        <AuthContext.Provider value={userState('user-b')}>
          <DraftsPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    resolveSecond([draft('user-b', 'User B draft')]);
    expect(await screen.findByText('User B draft')).toBeInTheDocument();

    resolveFirst([draft('user-a', 'User A private draft')]);
    await waitFor(() =>
      expect(screen.queryByText('User A private draft')).not.toBeInTheDocument(),
    );

    view.rerender(
      <MemoryRouter>
        <AuthContext.Provider value={signedOut}>
          <DraftsPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.queryByText('User B draft')).not.toBeInTheDocument();
  });
});

function draft(userId: string, title: string): CodeDraft {
  return {
    id: `${userId}-draft`,
    userId,
    challengeId: 'reverse-string',
    title,
    code: '',
    createdAt: '2026-11-04T00:00:00Z',
    updatedAt: '2026-11-04T00:00:00Z',
  };
}

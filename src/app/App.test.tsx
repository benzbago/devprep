import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the branded application and landing page', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /devprep ai/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /practice javascript with a clear path/i }),
    ).toBeInTheDocument();
  });
});

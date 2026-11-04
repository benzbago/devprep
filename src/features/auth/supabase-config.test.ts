import { describe, expect, it } from 'vitest';

import { readSupabaseConfig } from './supabase-config';

describe('readSupabaseConfig', () => {
  it('keeps account features optional when configuration is absent', () => {
    expect(readSupabaseConfig({})).toEqual({
      available: false,
      reason: 'Account features are unavailable because Supabase is not configured.',
    });
  });

  it('requires both public values', () => {
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' }),
    ).toEqual({
      available: false,
      reason: 'Account features are unavailable because Supabase is not configured.',
    });
  });

  it('rejects empty placeholder values', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_PUBLISHABLE_KEY: '   ',
      }),
    ).toEqual({
      available: false,
      reason: 'Account features are unavailable because Supabase is not configured.',
    });
  });

  it('rejects a malformed project URL', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'not-a-url',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'public-key',
      }),
    ).toEqual({
      available: false,
      reason: 'Account features are unavailable because Supabase is not configured.',
    });
  });

  it('returns valid public configuration', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'public-key',
      }),
    ).toEqual({
      available: true,
      url: 'https://example.supabase.co',
      publishableKey: 'public-key',
    });
  });
});

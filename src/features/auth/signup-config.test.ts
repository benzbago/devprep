import { describe, expect, it } from 'vitest';

import { isSignupEnabled } from './signup-config';

describe('isSignupEnabled', () => {
  it('defaults to disabled when the public flag is absent or false', () => {
    expect(isSignupEnabled({})).toBe(false);
    expect(isSignupEnabled({ VITE_ENABLE_SIGNUP: 'false' })).toBe(false);
  });

  it('requires the exact explicit true value', () => {
    expect(isSignupEnabled({ VITE_ENABLE_SIGNUP: 'true' })).toBe(true);
    expect(isSignupEnabled({ VITE_ENABLE_SIGNUP: 'TRUE' })).toBe(false);
    expect(isSignupEnabled({ VITE_ENABLE_SIGNUP: true })).toBe(false);
  });
});

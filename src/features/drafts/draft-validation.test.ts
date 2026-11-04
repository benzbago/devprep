import { describe, expect, it } from 'vitest';

import { draftInputSchema } from './draft-validation';

describe('draftInputSchema', () => {
  it('accepts a valid draft', () => {
    expect(
      draftInputSchema.parse({
        challengeId: 'reverse-string',
        title: 'My first solution',
        code: 'function reverse(value) { return value; }',
      }),
    ).toEqual({
      challengeId: 'reverse-string',
      title: 'My first solution',
      code: 'function reverse(value) { return value; }',
    });
  });

  it.each([
    [{ challengeId: '', title: 'Draft', code: '' }, 'Choose a challenge'],
    [{ challengeId: 'reverse-string', title: '   ', code: '' }, 'Enter a title'],
    [
      { challengeId: 'reverse-string', title: 'Draft', code: 'x'.repeat(50_001) },
      'Code must be 50,000 characters or fewer',
    ],
  ])('rejects invalid input %#', (input, message) => {
    const result = draftInputSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(message);
    }
  });
});

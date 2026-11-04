import { describe, expect, it } from 'vitest';

import { createRequestScope } from './request-scope';

describe('createRequestScope', () => {
  it('rejects a response after the account changes', () => {
    const scope = createRequestScope();
    const firstRequest = scope.begin('user-a');

    scope.changeUser('user-b');

    expect(firstRequest.isCurrent()).toBe(false);
  });

  it('accepts only the latest request for the current account', () => {
    const scope = createRequestScope();
    const firstRequest = scope.begin('user-a');
    const secondRequest = scope.begin('user-a');

    expect(firstRequest.isCurrent()).toBe(false);
    expect(secondRequest.isCurrent()).toBe(true);
  });

  it('invalidates pending requests when signed out', () => {
    const scope = createRequestScope();
    const request = scope.begin('user-a');

    scope.changeUser(null);

    expect(request.isCurrent()).toBe(false);
  });
});

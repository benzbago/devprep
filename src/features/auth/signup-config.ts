type Environment = Record<string, string | boolean | undefined>;

export function isSignupEnabled(environment: Environment) {
  return environment.VITE_ENABLE_SIGNUP === 'true';
}

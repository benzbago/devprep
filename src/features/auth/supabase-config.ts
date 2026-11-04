type Environment = Record<string, string | boolean | undefined>;

export type SupabaseConfig =
  | { available: true; url: string; publishableKey: string }
  | { available: false; reason: string };

export function readSupabaseConfig(environment: Environment): SupabaseConfig {
  const rawUrl = environment.VITE_SUPABASE_URL;
  const rawPublishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (typeof rawUrl === 'string' && typeof rawPublishableKey === 'string') {
    const url = rawUrl.trim();
    const publishableKey = rawPublishableKey.trim();
    try {
      const parsedUrl = new URL(url);
      if (publishableKey && ['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { available: true, url, publishableKey };
      }
    } catch {
      // The common unavailable result below keeps public routes credential-free.
    }
  }

  return {
    available: false,
    reason: 'Account features are unavailable because Supabase is not configured.',
  };
}

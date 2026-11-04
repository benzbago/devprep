const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(
    `Authenticated persistence verification requires local Supabase values: ${missing.join(', ')}`,
  );
  process.exitCode = 1;
} else {
  console.log('Local Supabase verification values are present.');
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { readSupabaseConfig } from './supabase-config';

const config = readSupabaseConfig(import.meta.env);

export const supabaseConfig = config;
export const supabase: SupabaseClient | null = config.available
  ? createClient(config.url, config.publishableKey)
  : null;

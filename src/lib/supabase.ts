import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Nunca usar la service role key aquí — solo la anon key protegida por RLS.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

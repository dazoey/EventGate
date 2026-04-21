import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Basic validation to prevent crash if URL is invalid or placeholder
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

if (!isValidUrl(supabaseUrl)) {
  console.warn('Invalid Supabase URL. Please check your .env file.');
}

export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

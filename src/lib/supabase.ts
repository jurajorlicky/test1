import { createClient } from '@supabase/supabase-js';

// VYHODIŤ fallback hodnoty, nech to vyhodí chybu ak ENV nie sú zadané
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('ENV URL:', supabaseUrl);
console.log('ENV KEY:', supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL alebo VITE_SUPABASE_ANON_KEY nie je zadané! Skontroluj nastavenie environment variables v Netlify alebo Vercel.');
}

// Vytvorenie Supabase klienta
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {}
  }
});

// (Voliteľné) jednoduchý test pripojenia
const testConnection = async (): Promise<void> => {
  try {
    console.log('Testing Supabase connection...');
    const { error } = await supabase.from('admin_settings').select('*').limit(1);
    if (error) {
      console.warn('Supabase connection test warning:', error.message);
    } else {
      console.log('Supabase connection successful');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown connection error';
    console.warn('Supabase connection test failed:', msg);
  }
};

if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Unknown initialization error';
      console.warn('Failed to initialize Supabase connection test:', msg);
    });
  }, 1000);
}

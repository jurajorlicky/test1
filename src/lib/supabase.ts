// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Načítanie URL a ANON KEY buď z Vite env premenných, alebo fallback
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
  || 'https://ddzmuxcavpgbzhirzlqt.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkem11eGNhdnBnYnpoaXJ6bHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNDc0NjgsImV4cCI6MjA1NDkyMzQ2OH0.xBnN4V5BmxMMZgIUDo5YA95b8HW8R83maPUETxdMzxc';

console.log('Supabase configuration:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
});

// Vytvorenie Supabase klienta s explicitným prázdnym global.headers
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {}  // zabraňuje čítaniu undefined.headers
    }
  }
);

// (Voliteľné) jednoduchý test pripojenia, ktorý nebloķuje UI
const testConnection = async (): Promise<void> => {
  try {
    console.log('Testing Supabase connection...');
    const { error } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1);
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

// Spustenie testu po 1 sekunde, aby sa UI načítalo bez zdržania
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Unknown initialization error';
      console.warn('Failed to initialize Supabase connection test:', msg);
    });
  }, 1000);
}

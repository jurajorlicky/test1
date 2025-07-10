import { createClient } from '@supabase/supabase-js';

// Tu natvrdo vlož hodnoty zo svojho .env
const supabaseUrl = 'https://ddzmuxcavpgbzhirzlqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkem11eGNhdnBnYnpoaXJ6bHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNDc0NjgsImV4cCI6MjA1NDkyMzQ2OH0.xBnN4V5BmxMMZgIUDo5YA95b8HW8R83maPUETxdMzxc';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey);

// Vytvorenie Supabase klienta
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// (voliteľné) Test pripojenia
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

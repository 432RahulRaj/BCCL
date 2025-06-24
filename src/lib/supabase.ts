import { createClient } from '@supabase/supabase-js';

// Environment configuration with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Connection test utility
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    return !error || !!error.code; // Success or database error (but connection works)
  } catch {
    return false;
  }
};

// Configuration info
export const getConfig = () => ({
  url: supabaseUrl,
  isLocal: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'),
  hasValidConfig: !!supabaseUrl && !!supabaseAnonKey,
});

console.log('🔧 Supabase Configuration:', getConfig());
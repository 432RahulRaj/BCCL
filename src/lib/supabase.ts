import { createClient } from '@supabase/supabase-js';

// Environment configuration
const supabaseMode = import.meta.env.VITE_SUPABASE_MODE || 'local';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default local configuration
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Determine which configuration to use
let finalUrl: string;
let finalAnonKey: string;

if (supabaseMode === 'local') {
  finalUrl = supabaseUrl || LOCAL_SUPABASE_URL;
  finalAnonKey = supabaseAnonKey || LOCAL_SUPABASE_ANON_KEY;
  console.log('🔧 Using local Supabase configuration');
} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Online mode requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    throw new Error('Missing Supabase environment variables for online mode. Please check your .env file.');
  }
  finalUrl = supabaseUrl;
  finalAnonKey = supabaseAnonKey;
  console.log('🌐 Using online Supabase configuration');
}

// Debug logging
console.log('Supabase Mode:', supabaseMode);
console.log('Supabase URL:', finalUrl);
console.log('Supabase Anon Key exists:', !!finalAnonKey);

// Validate URL format
try {
  new URL(finalUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', finalUrl);
  throw new Error('Invalid Supabase URL format. Please check your configuration.');
}

export const supabase = createClient(finalUrl, finalAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable automatic session detection from URL
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Connection test function with better error handling
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Simple health check - try to access a basic endpoint
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.warn('⚠️ Supabase connection test failed:', error.message);
      
      // Check if it's a network/connection error vs a database error
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('fetch')) {
        console.log('🔌 Network connection issue detected');
        return false;
      }
      
      // If it's a database/permission error but we got a response, connection is OK
      if (error.code) {
        console.log('✅ Supabase connection successful (database accessible)');
        return true;
      }
      
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error: any) {
    console.warn('🚫 Supabase connection test error:', error.message);
    
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.log('🔌 Network connection failed - likely server not running');
      return false;
    }
    
    // CORS errors
    if (error.message.includes('CORS')) {
      console.log('🚫 CORS error - check server configuration');
      return false;
    }
    
    return false;
  }
};

// Auto-detect and switch configuration based on availability
export const autoDetectSupabaseConfig = async (): Promise<'local' | 'online' | 'offline'> => {
  // If explicitly set to online, don't auto-detect
  if (supabaseMode === 'online') {
    const isOnline = await testConnection();
    return isOnline ? 'online' : 'offline';
  }
  
  // Test local connection first
  if (supabaseMode === 'local' || !supabaseMode) {
    const isLocalAvailable = await testConnection();
    if (isLocalAvailable) {
      return 'local';
    }
    
    // If local fails and we have online credentials, try online
    if (supabaseUrl && supabaseAnonKey && 
        supabaseUrl !== LOCAL_SUPABASE_URL && 
        supabaseAnonKey !== LOCAL_SUPABASE_ANON_KEY) {
      
      console.log('🔄 Local Supabase not available, trying online configuration...');
      
      // Temporarily create online client for testing
      const onlineClient = createClient(supabaseUrl, supabaseAnonKey);
      try {
        const { error } = await onlineClient.from('users').select('count').limit(1).maybeSingle();
        if (!error || error.code) { // Success or database error (but connection works)
          console.log('🌐 Switching to online Supabase configuration');
          return 'online';
        }
      } catch (e) {
        console.log('🚫 Online Supabase also not available');
      }
    }
  }
  
  return 'offline';
};

// Export configuration info
export const getSupabaseConfig = () => ({
  mode: supabaseMode,
  url: finalUrl,
  isLocal: finalUrl.includes('127.0.0.1') || finalUrl.includes('localhost'),
  hasAnonKey: !!finalAnonKey,
});

// Configuration info
export const getConfig = () => ({
  url: finalUrl,
  isLocal: finalUrl.includes('127.0.0.1') || finalUrl.includes('localhost'),
  hasValidConfig: !!finalUrl && !!finalAnonKey,
});
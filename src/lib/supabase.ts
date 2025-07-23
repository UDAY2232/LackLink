import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client for development when Supabase is not configured
const createMockSupabaseClient = () => ({
  auth: {
    signUp: async () => ({ 
      data: { user: { id: 'demo-user', email: 'demo@example.com' } }, 
      error: null 
    }),
    signInWithPassword: async () => ({ 
      data: { user: { id: 'demo-user', email: 'demo@example.com' } }, 
      error: null 
    }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ 
      data: { user: { id: 'demo-user', email: 'demo@example.com' } }, 
      error: null 
    }),
    getSession: async () => ({ 
      data: { session: { user: { id: 'demo-user', email: 'demo@example.com' } } }, 
      error: null 
    }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
    eq: function() { return this; },
    single: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; }
  })
});

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    console.warn('Supabase not configured, using mock client for development');
    return createMockSupabaseClient();
  }
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'lacklink-marketplace'
        }
      }
    });
  } catch (error) {
    console.warn('Failed to create Supabase client, using mock client:', error);
    return createMockSupabaseClient();
  }
})();

// Check if we're using the real Supabase or mock
export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project');

// Enhanced auth helpers with better error handling
export const signUp = async (email: string, password: string, userData: any) => {
  try {
    if (!isSupabaseConfigured) {
      // Mock successful signup for development
      return {
        data: {
          user: {
            id: 'demo-user-' + Date.now(),
            email: email,
            user_metadata: userData
          }
        },
        error: null
      };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: userData,
      },
    });
    
    return { data, error };
  } catch (error) {
    console.error('SignUp error:', error);
    return { 
      data: null, 
      error: { message: 'Network error. Please check your connection and try again.' }
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    if (!isSupabaseConfigured) {
      // Mock successful signin for development
      return {
        data: {
          user: {
            id: 'demo-user',
            email: email,
            user_metadata: { name: 'Demo User', role: 'customer' }
          }
        },
        error: null
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    
    return { data, error };
  } catch (error) {
    console.error('SignIn error:', error);
    return { 
      data: null, 
      error: { message: 'Network error. Please check your connection and try again.' }
    };
  }
};

export const signOut = async () => {
  try {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('SignOut error:', error);
    return { error: { message: 'Network error during sign out.' } };
  }
};

export const getCurrentUser = async () => {
  try {
    if (!isSupabaseConfigured) {
      return null;
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
    }
    
    return user;
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return null;
  }
};

// Test connection function
export const testConnection = async () => {
  if (!isSupabaseConfigured) {
    console.log('Supabase not configured, skipping connection test');
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('categories').select('count').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
};
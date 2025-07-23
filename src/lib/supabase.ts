import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
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
}) : null;

// Auth helpers with improved error handling
export const signUp = async (email: string, password: string, userData: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: userData,
      },
    });
    
    if (error) {
      console.error('Supabase signUp error:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Unexpected signUp error:', error);
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    
    if (error) {
      console.error('Supabase signIn error:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Unexpected signIn error:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase signOut error:', error);
    }
    
    return { error };
  } catch (error) {
    console.error('Unexpected signOut error:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
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
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        if (event === 'SIGNED_UP' || event === 'SIGNED_IN') {
          await ensureUserProfile(session.user);
        }
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Ensuring user profile for:', authUser.email);
      
      // First check if user profile exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing user:', fetchError);
      }

      if (!existingUser) {
        console.log('Creating user profile...');
        
        // Create user profile
        const userData = {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
          role: authUser.user_metadata?.role || 'customer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert(userData);

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          
          // Try using the RPC function as fallback
          try {
            const { error: rpcError } = await supabase.rpc('create_user_profile', {
              user_id: authUser.id,
              user_email: authUser.email!,
              user_name: userData.name,
              user_role: userData.role
            });
            
            if (rpcError) {
              console.error('RPC function also failed:', rpcError);
            } else {
              console.log('User profile created via RPC function');
            }
          } catch (rpcError) {
            console.error('RPC function error:', rpcError);
          }
        } else {
          console.log('User profile created successfully');
        }
      } else {
        console.log('User profile already exists');
      }
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If user profile doesn't exist, try to create it
        if (error.code === 'PGRST116' && supabaseUser) {
          console.log('User profile not found, creating...');
          await ensureUserProfile(supabaseUser);
          
          // Try fetching again
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (retryError) {
            console.error('Retry fetch failed:', retryError);
          } else {
            setUser(retryData);
          }
        }
      } else {
        console.log('User profile fetched successfully:', data);
        setUser(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { data: null, error: { message: 'Invalid email or password. Please check your credentials and try again.' } };
        } else if (error.message.includes('Email not confirmed')) {
          return { data: null, error: { message: 'Please check your email and click the confirmation link before signing in.' } };
        } else if (error.message.includes('Too many requests')) {
          return { data: null, error: { message: 'Too many login attempts. Please wait a few minutes and try again.' } };
        }
        
        return { data, error };
      }

      console.log('Sign in successful for:', email);
      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected sign in error:', error);
      return { data: null, error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('Attempting sign up for:', email);
      
      // Validate input
      if (!email || !password || !userData.name) {
        return { 
          data: null, 
          error: { message: 'Please fill in all required fields.' } 
        };
      }

      if (password.length < 6) {
        return { 
          data: null, 
          error: { message: 'Password must be at least 6 characters long.' } 
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: userData.name.trim(),
            role: userData.role || 'customer',
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        
        // Provide user-friendly error messages
        if (error.message.includes('already registered')) {
          return { data: null, error: { message: 'This email is already registered. Please sign in instead or use a different email.' } };
        } else if (error.message.includes('Invalid email')) {
          return { data: null, error: { message: 'Please enter a valid email address.' } };
        } else if (error.message.includes('Password')) {
          return { data: null, error: { message: 'Password must be at least 6 characters long.' } };
        } else if (error.message.includes('rate limit')) {
          return { data: null, error: { message: 'Too many signup attempts. Please wait a few minutes and try again.' } };
        }
        
        return { data, error };
      }

      if (data.user) {
        console.log('Sign up successful for:', email);
        
        // Ensure user profile is created
        await ensureUserProfile(data.user);
        
        return { data, error: null };
      }

      return { data, error };
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      return { data: null, error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  };

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
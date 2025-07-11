import React, { useEffect, useState } from 'react';
import { supabase, testConnection } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [authState, setAuthState] = useState<any>(null);
  const { user, supabaseUser, loading } = useAuth();

  useEffect(() => {
    // Test Supabase connection
    testConnection().then(setConnectionStatus);

    // Get current auth state
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setAuthState({ session, error });
    });
  }, []);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm text-xs">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      
      <div className="space-y-1">
        <div>
          <strong>Connection:</strong>{' '}
          <span className={connectionStatus ? 'text-green-600' : 'text-red-600'}>
            {connectionStatus === null ? 'Testing...' : connectionStatus ? 'Connected' : 'Failed'}
          </span>
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Supabase User:</strong> {supabaseUser ? supabaseUser.email : 'None'}
        </div>
        
        <div>
          <strong>App User:</strong> {user ? `${user.name} (${user.role})` : 'None'}
        </div>
        
        <div>
          <strong>Env Vars:</strong>{' '}
          <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
            {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
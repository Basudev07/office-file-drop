import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Initialize and listen to Supabase Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuth = !!session;
      setIsAuthenticated(isAuth);
      setUserEmail(session?.user?.email ?? null);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuth = !!session;
      setIsAuthenticated(isAuth);
      setUserEmail(session?.user?.email ?? null);
      setLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setUserEmail(null);
  }, []);

  return {
    isAuthenticated,
    loadingAuth,
    userEmail,
    signIn,
    signOut,
  };
}

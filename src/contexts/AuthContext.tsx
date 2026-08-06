import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout to ensure loading state never hangs indefinitely
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(timer);
      })
      .catch((err) => {
        console.warn('Auth session check error:', err);
        if (!isMounted) return;
        setLoading(false);
        clearTimeout(timer);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, user, loading }), [session, user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, serverUrl } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'producer' | 'admin' | 'super_admin';
  business_name?: string;
  producer_verified?: boolean;
  suspended?: boolean;
  suspension_reason?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether signIn() is in progress so onAuthStateChange doesn't race with it
  const signingInRef = useRef(false);

  const fetchProfile = async (token: string): Promise<{ ok: boolean; status?: number; errorText?: string }> => {
    try {
      const response = await fetch(`${serverUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.profile);
        return { ok: true, status: response.status };
      } else {
        // Log actual error for debugging
        let errorText = '';
        try { errorText = await response.text(); } catch {}
        console.error(`[fetchProfile] HTTP ${response.status}:`, errorText);
        setUser(null);
        setAccessToken(null);
        return { ok: false, status: response.status, errorText };
      }
    } catch (error) {
      console.error('[fetchProfile] Network/parse error:', error);
      setUser(null);
      setAccessToken(null);
      return { ok: false };
    }
  };

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setAccessToken(session.access_token);
        fetchProfile(session.access_token);
      }
      setLoading(false);
    });

    // Listen for auth changes (token refresh, sign-out, etc.)
    // We skip SIGNED_IN events when signIn() is already handling them to avoid a race.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && signingInRef.current) {
        // signIn() is managing this — don't duplicate the fetchProfile call
        return;
      }
      if (session?.access_token) {
        setAccessToken(session.access_token);
        fetchProfile(session.access_token);
      } else {
        setUser(null);
        setAccessToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    signingInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
        const profileResult = await fetchProfile(data.session.access_token);
        if (!profileResult.ok) {
          await supabase.auth.signOut();
          if (profileResult.status === 404) {
            throw new Error('Account profile not found. Please sign up or contact support.');
          }
          // Show the actual status so it's easier to diagnose
          throw new Error(
            `Failed to load your profile (HTTP ${profileResult.status ?? 'network error'}). Please try again or contact support.`
          );
        }
      }
    } finally {
      signingInRef.current = false;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'buyer') => {
    try {
      const response = await fetch(`${serverUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      const responseText = await response.text();
      console.log('Signup response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse signup response:', responseText);
        throw new Error('Server returned invalid response. Please check the edge function logs.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Auto sign in after signup
      await signIn(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  const changePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  const refreshProfile = async () => {
    if (accessToken) {
      await fetchProfile(accessToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, signIn, signUp, resetPassword, changePassword, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
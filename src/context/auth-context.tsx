'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/config/supabase';
import { Session } from '@supabase/supabase-js';
import { User as AppUser } from '@/types';

// Username/password auth: Supabase auth needs an email, so we derive a
// fixed synthetic email from the username: `<username>@ds.local`
export const usernameToEmail = (username: string) => `${username.trim().toLowerCase()}@ds.local`;

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    username: string,
    password: string,
    displayName: string
  ) => Promise<{ error: Error | null; needsVerification?: boolean }>;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<{ error: Error | null }>;
  isUsernameTaken: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return data as AppUser;
  };

  const refreshUser = async () => {
    const { data: { session: current } } = await supabase.auth.getSession();
    if (current?.user) {
      const userData = await fetchUser(current.user.id);
      setUser(userData);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      setSession(initialSession);

      if (initialSession?.user) {
        const userData = await fetchUser(initialSession.user.id);
        setUser(userData);
      }
      setLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        const userData = await fetchUser(newSession.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isUsernameTaken = async (username: string) => {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .maybeSingle();
    return !!data;
  };

  const signUp = async (username: string, password: string, displayName: string) => {
    const cleanUsername = username.trim().toLowerCase();

    // Check availability first for a friendly error
    if (await isUsernameTaken(cleanUsername)) {
      return { error: new Error('This username is already taken') };
    }

    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(cleanUsername),
      password,
      options: {
        data: { username: cleanUsername, display_name: displayName },
      },
    });

    if (error) return { error };
    if (!data.session) {
      // Supabase created the auth user but email confirmation is enabled —
      // no session is issued for synthetic @ds.local addresses.
      return { error: null, needsVerification: true };
    }

    // Create (or reuse) the public.users row.
    // Idempotent: if a DB trigger on auth.users already created the profile
    // row, our insert is skipped instead of crashing with users_pkey duplicate.
    const { error: insertError } = await supabase
      .from('users')
      .upsert(
        {
          id: data.user!.id,
          username: cleanUsername,
          name: displayName.trim() || cleanUsername,
          phone_number: '',
          avatar_color: Math.floor(Math.random() * 10),
          selected_theme_name: 'DARK',
          chat_wallpaper: 'NONE',
          is_online: true,
          is_suspended: false,
          suspended_until: 0,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    if (insertError) {
      console.warn('[DS] users row upsert skipped:', insertError.message);
    }

    return { error: null };
  };

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username.trim().toLowerCase()),
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!session?.user) return { error: new Error('No session') };

    // username is the login credential — never update it here
    const { username: _ignored, ...allowedUpdates } = updates as Record<string, unknown>;

    const { error } = await supabase
      .from('users')
      .update(allowedUpdates)
      .eq('id', session.user.id);

    if (!error) {
      await refreshUser();
    }
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, refreshUser, updateProfile, isUsernameTaken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

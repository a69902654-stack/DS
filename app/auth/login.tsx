'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [infoLong, setInfoLong] = useState(false);

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setError('');
    setInfo('');
  };

  const handleSubmit = async () => {
    setError('');
    setInfo('');

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setError('Username: 3-20 characters, only letters, numbers and _');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      const { error: err, needsVerification } = await signUp(cleanUsername, password, displayName.trim() || cleanUsername);
      setLoading(false);

      if (err) {
        setError(friendlyError(err.message));
        return;
      }
      if (needsVerification) {
        setInfo(
          'Account created but email confirmation is ON in this Supabase project. Disable it: Authentication → Sign In / Up → turn off "Confirm email".'
        );
        return;
      }
      router.replace('/(tabs)');
    } else {
      setLoading(true);
      const { error: err } = await signIn(cleanUsername, password);
      setLoading(false);

      if (err) {
        setError(friendlyError(err.message));
        return;
      }
      router.replace('/(tabs)');
    }
  };

  const friendlyError = (message: string) => {
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'Cannot reach the server. Check your Supabase URL/anon key in .env and your internet connection.';
    }
    if (message.includes('Invalid login credentials')) {
      return 'Wrong username or password';
    }
    if (message.includes('already registered')) {
      return 'This username is already registered — try signing in';
    }
    if (message.includes('rate limit')) {
      return 'Too many attempts. Wait a moment and try again.';
    }
    return message;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
              <Text style={[styles.logoText, { color: theme.onPrimary }]}>DS</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.onSurface }]}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
            {mode === 'signin'
              ? 'Sign in with your username and password'
              : 'Pick a username and password to join DS'}
          </Text>

          <View style={styles.form}>
            {mode === 'signup' && (
              <Input
                label="Display name"
                leftIcon="person-outline"
                placeholder="e.g. Ali Rezaei"
                autoCapitalize="words"
                value={displayName}
                onChangeText={(t) => {
                  setDisplayName(t);
                  setError('');
                }}
              />
            )}

            <Input
              label="Username"
              leftIcon="at-outline"
              placeholder="username"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={(t) => {
                setUsername(t.replace(/\s/g, '').toLowerCase());
                setError('');
              }}
            />

            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              placeholder="At least 6 characters"
              secureTextEntry
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
            />

            {mode === 'signup' && (
              <Input
                label="Confirm password"
                leftIcon="lock-closed-outline"
                placeholder="Repeat password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setError('');
                }}
              />
            )}

            {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}
            {info ? (
              <TouchableOpacity onPress={() => setInfoLong((v) => !v)}>
                <Text
                  style={[styles.error, { color: theme.warning }]}
                  numberOfLines={infoLong ? undefined : 2}
                >
                  {info}
                </Text>
              </TouchableOpacity>
            ) : null}

            <Button
              title={mode === 'signin' ? 'Sign in' : 'Create account'}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />

            <TouchableOpacity
              onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              style={styles.switchRow}
            >
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 14.5 }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  logoRow: { alignItems: 'center', marginBottom: 22 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { fontSize: 34, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 22,
  },
  form: { gap: 14 },
  error: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  switchRow: { alignItems: 'center', paddingVertical: 12 },
});

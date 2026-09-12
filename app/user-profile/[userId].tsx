'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/config/supabase';
import { useTheme } from '@/context/theme-context';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types';
import { formatDate, displayName } from '@/utils';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) setProfile(data as User);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="person-outline" size={44} color={theme.onSurfaceVariant} />
        <Text style={{ color: theme.onSurfaceVariant, marginTop: 12 }}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.outlineVariant }]}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar name={displayName(profile)} avatarUrl={profile.avatar_url} avatarColor={profile.avatar_color} size={112} />
          <Text style={[styles.name, { color: theme.onSurface }]}>{displayName(profile)}</Text>
          <Text style={{ color: theme.primary, fontSize: 16 }}>@{profile.username}</Text>
          {profile.bio ? (
            <Text style={{ color: theme.onSurfaceVariant, textAlign: 'center', marginTop: 10, lineHeight: 21, paddingHorizontal: 30 }}>
              {profile.bio}
            </Text>
          ) : null}
          <View style={[styles.statusPill, { backgroundColor: profile.is_online ? theme.primaryContainer : theme.surfaceVariant }]}>
            <View style={[styles.statusDot, { backgroundColor: profile.is_online ? theme.success : theme.onSurfaceVariant }]} />
            <Text style={{ color: profile.is_online ? theme.success : theme.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>
              {profile.is_online ? 'Online now' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardRow}>
            <Ionicons name="call-outline" size={20} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12.5 }}>Phone</Text>
              <Text style={{ color: theme.onSurface, fontSize: 15.5 }}>{profile.phone_number || '—'}</Text>
            </View>
          </View>
          <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12.5 }}>Joined</Text>
              <Text style={{ color: theme.onSurface, fontSize: 15.5 }}>
                {profile.created_at ? formatDate(new Date(profile.created_at).getTime()) : '—'}
              </Text>
            </View>
          </View>
        </View>

        <Button
          title="Send message"
          onPress={() => router.push(`/chat/${profile.id}`)}
          fullWidth
          size="lg"
          leftIcon={<Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.onPrimary} style={{ marginRight: 8 }} />}
          style={{ marginTop: 22 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6, width: 36 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 30, gap: 4 },
  name: { fontSize: 24, fontWeight: '700', marginTop: 14 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 14,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  card: { borderRadius: 16, marginHorizontal: 16, marginTop: 12, overflow: 'hidden' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
});

'use client';

import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useSearchUsers } from '@/hooks/use-search';
import { Avatar } from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types';
import { displayName } from '@/utils';

export default function NewChatScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const { results, loading, search } = useSearchUsers(user?.id || '');
  const [query, setQuery] = useState('');

  const onChange = (text: string) => {
    setQuery(text);
    if (text.trim().length > 1) search(text.trim());
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={[styles.row, { backgroundColor: theme.background }]} activeOpacity={0.6} onPress={() => router.replace(`/chat/${item.id}`)}>
      <Avatar name={displayName(item)} avatarUrl={item.avatar_url} avatarColor={item.avatar_color} size={50} showOnlineDot isOnline={item.is_online} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.onSurface }]}>
          {displayName(item)}
        </Text>
        <Text numberOfLines={1} style={{ color: theme.onSurfaceVariant, fontSize: 14 }}>
          @{item.username}
        </Text>
      </View>
      <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.outlineVariant }]}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>New chat</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: theme.surfaceVariant }]}>
          <Ionicons name="search" size={18} color={theme.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: theme.onSurface }]}
            placeholder="Search by name, @username or ID..."
            placeholderTextColor={theme.onSurfaceVariant}
            value={query}
            onChangeText={onChange}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); }}>
              <Ionicons name="close-circle" size={18} color={theme.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        renderItem={renderUser}
        keyExtractor={(u) => u.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={query.length > 1 ? 'sad-outline' : 'search-outline'} size={40} color={theme.onSurfaceVariant} />
            <Text style={{ color: theme.onSurfaceVariant, marginTop: 12, textAlign: 'center', lineHeight: 21, paddingHorizontal: 40 }}>
              {query.length > 1 ? 'No people found. Try a different name or @username.' : 'Type at least 2 characters to search all DS users.'}
            </Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  searchWrap: { paddingHorizontal: 14, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 21 },
  searchInput: { flex: 1, fontSize: 15.5, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 11 },
  name: { fontSize: 16, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
});

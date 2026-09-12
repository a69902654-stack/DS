'use client';

import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Text, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useConversations } from '@/hooks/use-messages';
import { useSearchUsers } from '@/hooks/use-search';
import { Avatar } from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, User } from '@/types';
import { formatTimestamp, messagePreview, displayName } from '@/utils';
import { setUserCache } from '@/hooks/use-messages';

export default function ChatListScreen() {
  const { user, session } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const { conversations, loading, loadConversations } = useConversations(user?.id || '');
  const { results: searchResults, loading: searchLoading, search } = useSearchUsers(user?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (user) setUserCache(user.name, user.username);
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 1) search(text.trim());
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => router.push(`/chat/${item.user.id}`)}
      style={[styles.row, { backgroundColor: theme.background }]}
      activeOpacity={0.6}
    >
      <Avatar
        name={displayName(item.user)}
        avatarUrl={item.user.avatar_url}
        avatarColor={item.user.avatar_color}
        size={52}
        showOnlineDot
        isOnline={item.user.is_online}
      />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={[styles.name, { color: theme.onSurface }]}>
            {displayName(item.user)}
          </Text>
          <Text style={[styles.time, { color: item.unreadCount > 0 ? theme.primary : theme.onSurfaceVariant }]}>
            {item.lastMessage ? formatTimestamp(item.lastMessage.timestamp) : ''}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text numberOfLines={1} style={[styles.preview, { color: theme.onSurfaceVariant }]}>
            {item.lastMessage ? messagePreview(item.lastMessage, user?.id) : 'Say hi 👋'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => {
        setSearchQuery('');
        router.push(`/chat/${item.id}`);
      }}
      style={[styles.row, { backgroundColor: theme.background }]}
      activeOpacity={0.6}
    >
      <Avatar name={displayName(item)} avatarUrl={item.avatar_url} avatarColor={item.avatar_color} size={52} showOnlineDot isOnline={item.is_online} />
      <View style={styles.rowContent}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.onSurface }]}>
          {displayName(item)}
        </Text>
        <Text numberOfLines={1} style={[styles.preview, { color: theme.onSurfaceVariant }]}>
          @{item.username} · {item.is_online ? 'online' : 'offline'}
        </Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
    </TouchableOpacity>
  );

  if (!session) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.onSurface }}>Not signed in</Text>
      </SafeAreaView>
    );
  }

  const isSearching = searchQuery.trim().length > 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.outlineVariant }]}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>DS</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/new-chat')}
            style={[styles.headerBtn, { backgroundColor: theme.surfaceVariant }]}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={20} color={theme.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={[styles.headerBtn, { backgroundColor: theme.surfaceVariant }]}
            activeOpacity={0.7}
          >
            <Avatar name={user?.name || '?'} avatarUrl={user?.avatar_url} avatarColor={user?.avatar_color} size={28} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: theme.surfaceVariant }]}>
          <Ionicons name="search" size={18} color={theme.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: theme.onSurface }]}
            placeholder="Search name, @username or ID..."
            placeholderTextColor={theme.onSurfaceVariant}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={(isSearching ? searchResults : conversations) as any[]}
        renderItem={(isSearching ? renderSearchResult : renderConversation) as any}
        keyExtractor={(item: any) => item.id || item.user?.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
        ListHeaderComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyCircle, { backgroundColor: theme.surfaceVariant }]}>
                <Ionicons name="chatbubbles-outline" size={40} color={theme.onSurfaceVariant} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
                {isSearching ? 'No people found' : 'No chats yet'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.onSurfaceVariant }]}>
                {isSearching
                  ? `Nothing matches "${searchQuery}"`
                  : 'Tap the person icon to start a conversation'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: 0.3 },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  searchWrap: { paddingHorizontal: 14, paddingVertical: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 21,
  },
  searchInput: { flex: 1, fontSize: 15.5, paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowContent: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  name: { fontSize: 16.5, fontWeight: '600', flexShrink: 1 },
  time: { fontSize: 12, fontWeight: '500' },
  preview: { fontSize: 14.5, flexShrink: 1 },
  badge: { borderRadius: 12, minWidth: 22, height: 22, paddingHorizontal: 7, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  loadingRow: { padding: 16, alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 40, paddingTop: 60 },
  emptyCircle: { width: 92, height: 92, borderRadius: 46, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 19, fontWeight: '700' },
  emptySub: { fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
});

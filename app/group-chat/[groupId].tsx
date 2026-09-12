'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/auth-context';
import { useTheme, wallpaperUri } from '@/context/theme-context';
import { useGroupMessages } from '@/hooks/use-groups';
import { useMediaUpload } from '@/hooks/use-media';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { Ionicons } from '@expo/vector-icons';
import { Group, GroupMember, Message } from '@/types';
import { formatDate, displayName } from '@/utils';

export default function GroupChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user: currentUser } = useAuth();
  const { theme, wallpaper } = useTheme();
  const router = useRouter();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const [group, setGroup] = useState<(Group & { members: GroupMember[] }) | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const { messages, loading, sending, sendGroupMessage, sendGroupMedia, deleteMessage } = useGroupMessages(
    currentUser?.id || '',
    groupId
  );
  const { pickImage, pickVideo, pickDocument, takePhoto } = useMediaUpload();

  const wpUri = wallpaperUri(wallpaper);

  // Load group + members
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    (async () => {
      const [{ data: g }, { data: members }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('group_members').select('*, user:users(*)').eq('group_id', groupId),
      ]);
      if (!cancelled && g) setGroup({ ...(g as Group), members: (members as GroupMember[]) || [] });
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const myMember = group?.members.find((m) => m.user_id === currentUser?.id);
  const canSend = group?.owner_id === currentUser?.id || myMember?.role !== 'member' || group?.can_members_send_messages !== false;

  const handleSend = async (text: string) => {
    if (!currentUser) return;
    await sendGroupMessage(text, currentUser.name ?? '', currentUser.username ?? '', replyingTo || undefined);
    setReplyingTo(null);
  };

  const handlePickAndSend = async (picker: () => Promise<string | null>, type: 'IMAGE' | 'VIDEO' | 'FILE') => {
    if (!currentUser) return;
    const uri = await picker();
    if (!uri) return;
    await sendGroupMedia(type, uri, currentUser.name ?? '', currentUser.username ?? '', replyingTo || undefined);
    setReplyingTo(null);
  };

  const handleMessageLongPress = (message: Message) => {
    const isOwn = message.sender_id === currentUser?.id;
    const options: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: 'Reply', onPress: () => setReplyingTo(message) },
    ];
    if (message.media_uri) options.push({ text: 'View media', onPress: () => setViewer(message.media_uri!) });
    if (isOwn) {
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete message?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(message.id) },
          ]),
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(message.sender_name || 'Message', message.content || message.media_type, options);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === currentUser?.id;
    const prev = messages[messages.indexOf(item) - 1];
    const showDate = !prev || formatDate(prev.timestamp) !== formatDate(item.timestamp);
    const sender = group?.members.find((m) => m.user_id === item.sender_id)?.user;

    return (
      <View>
        {showDate && (
          <View style={styles.dateWrap}>
            <Text style={[styles.dateText, { color: theme.onSurface, backgroundColor: theme.surfaceVariant }]}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        )}
        <MessageBubble
          message={item}
          isOwn={isOwn}
          showAvatar={!isOwn}
          showName={!!group && group.members.length > 2 && !isOwn}
          onLongPress={handleMessageLongPress}
          onMediaPress={(uri) => setViewer(uri)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.tabBar, borderBottomColor: theme.outlineVariant }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => setShowInfo(true)} activeOpacity={0.7} disabled={!group}>
          {group?.avatar_url ? (
            <Avatar name={group.name} avatarUrl={group.avatar_url} size={38} />
          ) : (
            <View style={[styles.groupAvatar, { backgroundColor: theme.primaryContainer }]}>
              <Ionicons name="people" size={20} color={theme.primary} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[styles.headerName, { color: theme.onSurface }]}>
              {group?.name || '...'}
            </Text>
            <Text numberOfLines={1} style={[styles.headerStatus, { color: theme.onSurfaceVariant }]}>
              {group ? `${group.members.length} members · tap for info` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Invite code',
              `Share this code so others can join:\n\n${group?.invite_code || '—'}`,
              group?.invite_code
                ? [
                    { text: 'Copy', onPress: () => Alert.alert('DS', `Code: ${group.invite_code}`) },
                    { text: 'OK', style: 'cancel' as const },
                  ]
                : [{ text: 'OK' }]
            )
          }
          style={styles.headerBtn}
        >
          <Ionicons name="key-outline" size={22} color={theme.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {wpUri && <Image source={{ uri: wpUri }} style={StyleSheet.absoluteFill} />}
        {wpUri && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />}

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerFill}>
            <Text style={{ color: theme.onSurfaceVariant, fontSize: 15 }}>Start the conversation 💬</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingVertical: 10 }}
            onContentSizeChange={scrollToBottom}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {canSend ? (
        <ChatInput
          onSend={handleSend}
          onPickImage={() => handlePickAndSend(pickImage, 'IMAGE')}
          onPickVideo={() => handlePickAndSend(pickVideo, 'VIDEO')}
          onPickFile={() => handlePickAndSend(pickDocument, 'FILE')}
          onTakePhoto={() => handlePickAndSend(takePhoto, 'IMAGE')}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          disabled={sending}
        />
      ) : (
        <View style={[styles.readOnlyBar, { backgroundColor: theme.surface, borderTopColor: theme.outlineVariant }]}>
          <Ionicons name="eye-outline" size={16} color={theme.onSurfaceVariant} />
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 13.5 }}>Only admins can send messages</Text>
        </View>
      )}

      {/* Group info sheet — members, description, invite code */}
      <Modal visible={showInfo} transparent animationType="slide" onRequestClose={() => setShowInfo(false)}>
        <View style={styles.infoOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowInfo(false)} />
          <View style={[styles.infoSheet, { backgroundColor: theme.tabBar, borderTopColor: theme.outlineVariant }]}>
            <View style={styles.infoHandle}>
              <View style={[styles.infoHandleBar, { backgroundColor: theme.outline }]} />
            </View>
            <View style={styles.infoHeader}>
              {group?.avatar_url ? (
                <Avatar name={group.name} avatarUrl={group.avatar_url} size={64} />
              ) : (
                <View style={[styles.infoGroupAvatar, { backgroundColor: theme.primaryContainer }]}>
                  <Ionicons name="people" size={30} color={theme.primary} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={[styles.infoName, { color: theme.onSurface }]}>
                  {group?.name || '...'}
                </Text>
                <Text style={{ color: theme.primary, fontSize: 13.5, marginTop: 2 }}>
                  {group?.members.length ?? 0} members
                </Text>
              </View>
            </View>

            {group?.description ? (
              <Text style={[styles.infoDescription, { color: theme.onSurfaceVariant }]}>{group.description}</Text>
            ) : null}

            {group?.invite_code && (
              <View style={[styles.inviteRow, { backgroundColor: theme.surfaceVariant }]}>
                <Ionicons name="key-outline" size={16} color={theme.primary} />
                <Text style={[styles.inviteLabel, { color: theme.onSurfaceVariant }]}>Invite code</Text>
                <Text style={[styles.inviteCode, { color: theme.onSurface }]}>{group.invite_code}</Text>
              </View>
            )}

            <Text style={[styles.membersTitle, { color: theme.onSurfaceVariant }]}>MEMBERS</Text>
            <FlatList
              data={group?.members ?? []}
              keyExtractor={(m) => m.id}
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => {
                const memberUser = item.user;
                const isOwner = group?.owner_id === item.user_id;
                return (
                  <View style={styles.memberRow}>
                    <Avatar
                      name={displayName(memberUser)}
                      avatarUrl={memberUser?.avatar_url}
                      avatarColor={memberUser?.avatar_color}
                      size={40}
                      showOnlineDot
                      isOnline={!!memberUser?.is_online}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: theme.onSurface, fontSize: 15, fontWeight: '500' }}>
                        {displayName(memberUser)}
                        {item.user_id === currentUser?.id ? '  (you)' : ''}
                      </Text>
                      <Text numberOfLines={1} style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>
                        @{memberUser?.username ?? 'unknown'}
                      </Text>
                    </View>
                    {isOwner ? (
                      <View style={[styles.roleBadge, { backgroundColor: theme.primaryContainer }]}>
                        <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>OWNER</Text>
                      </View>
                    ) : item.role === 'admin' ? (
                      <View style={[styles.roleBadge, { backgroundColor: theme.surfaceVariant }]}>
                        <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, fontWeight: '700' }}>ADMIN</Text>
                      </View>
                    ) : null}
                  </View>
                );
              }}
            />

            <TouchableOpacity style={[styles.closeBar, { borderTopColor: theme.outlineVariant }]} onPress={() => setShowInfo(false)}>
              <Text style={{ color: theme.primary, fontSize: 15.5, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewer(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {viewer && <Image source={{ uri: viewer }} style={styles.viewerImage} resizeMode="contain" />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6 },
  groupAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerName: { fontSize: 16.5, fontWeight: '600' },
  headerStatus: { fontSize: 12.5, marginTop: 1 },
  headerBtn: { padding: 6 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateWrap: { alignItems: 'center', paddingVertical: 10 },
  dateText: { fontSize: 12, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  readOnlyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: { position: 'absolute', top: 54, right: 20, padding: 10 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  infoSheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    maxHeight: '85%',
  },
  infoHandle: { alignItems: 'center', paddingVertical: 8 },
  infoHandleBar: { width: 40, height: 4, borderRadius: 2 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  infoGroupAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  infoName: { fontSize: 20, fontWeight: '700' },
  infoDescription: { fontSize: 14.5, lineHeight: 21, paddingVertical: 6 },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginVertical: 8,
  },
  inviteLabel: { fontSize: 13.5 },
  inviteCode: { fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
  membersTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 10, marginBottom: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  closeBar: { alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
});

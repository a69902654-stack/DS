'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useTheme, wallpaperUri } from '@/context/theme-context';
import { useMessages } from '@/hooks/use-messages';
import { useMediaUpload } from '@/hooks/use-media';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { Ionicons } from '@expo/vector-icons';
import { Message, User } from '@/types';
import { formatDate, formatLastSeen, displayName } from '@/utils';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { theme, themeName, wallpaper } = useTheme();
  const router = useRouter();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const {
    messages,
    loading,
    sending,
    otherUser,
    sendMessage,
    sendMediaMessage,
    deleteMessage,
  } = useMessages(currentUser?.id || '', userId);

  const { pickImage, pickVideo, pickDocument, takePhoto, uploadChatMedia } = useMediaUpload();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [viewer, setViewer] = useState<{ uri: string; type: string } | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const wpUri = wallpaperUri(wallpaper);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = async (text: string) => {
    await sendMessage(text, replyingTo || undefined);
    setReplyingTo(null);
  };

  const handlePickAndSend = async (picker: () => Promise<string | null>, type: 'IMAGE' | 'VIDEO' | 'FILE') => {
    const uri = await picker();
    if (!uri) return;
    await sendMediaMessage(type, uri, replyingTo || undefined);
    setReplyingTo(null);
  };

  const handleMessageLongPress = (message: Message) => {
    const isOwn = message.sender_id === currentUser?.id;
    const options: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: 'Reply', onPress: () => setReplyingTo(message) },
    ];
    if (message.media_uri) {
      options.push({
        text: 'Open media',
        onPress: () => setViewer({ uri: message.media_uri!, type: message.media_type }),
      });
    }
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
    const showDate =
      !prev || formatDate(prev.timestamp) !== formatDate(item.timestamp);

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
          onLongPress={handleMessageLongPress}
          onMediaPress={(uri, type) => setViewer({ uri, type })}
        />
      </View>
    );
  };

  const statusText = otherUser
    ? otherUser.is_online
      ? 'online'
      : formatLastSeen(otherUser.last_seen)
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.tabBar, borderBottomColor: theme.outlineVariant }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerUser} onPress={() => setShowInfo(true)} activeOpacity={0.7}>
          <Avatar
            name={displayName(otherUser)}
            avatarUrl={otherUser?.avatar_url}
            avatarColor={otherUser?.avatar_color}
            size={38}
            showOnlineDot
            isOnline={!!otherUser?.is_online}
          />
          <View style={{ flexShrink: 1 }}>
            <Text numberOfLines={1} style={[styles.headerName, { color: theme.onSurface }]}>
              {otherUser ? displayName(otherUser) : '...'}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.headerStatus, { color: otherUser?.is_online ? theme.success : theme.onSurfaceVariant }]}
            >
              {statusText}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowInfo(true)} style={styles.headerBtn}>
          <Ionicons name="information-circle-outline" size={24} color={theme.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {wpUri && <Image source={{ uri: wpUri }} style={StyleSheet.absoluteFill} blurRadius={themeName === 'FROSTED' ? 6 : 0} />}
        {wpUri && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />}

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerFill}>
            <View style={[styles.emptyBubble, { backgroundColor: theme.surfaceVariant }]}>
              <Ionicons name="lock-closed-outline" size={16} color={theme.onSurfaceVariant} />
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>Messages are end-to-end visible only to you two</Text>
            </View>
            <Text style={{ color: theme.onSurfaceVariant, marginTop: 12, fontSize: 15 }}>Say hi 👋</Text>
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

      {/* Input */}
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

      {/* User info modal */}
      <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowInfo(false)} />
          <View style={[styles.infoSheet, { backgroundColor: theme.surface }]}>
            <Avatar name={displayName(otherUser)} avatarUrl={otherUser?.avatar_url} avatarColor={otherUser?.avatar_color} size={84} />
            <Text style={[styles.infoName, { color: theme.onSurface }]}>{displayName(otherUser)}</Text>
            <Text style={{ color: theme.primary, fontSize: 15, marginBottom: 14 }}>@{otherUser?.username}</Text>
            {otherUser?.bio ? (
              <Text style={{ color: theme.onSurface, fontSize: 15, textAlign: 'center', marginBottom: 14 }}>{otherUser.bio}</Text>
            ) : null}
            <View style={[styles.infoRow, { borderTopColor: theme.outlineVariant }]}>
              <Ionicons name="call-outline" size={18} color={theme.onSurfaceVariant} />
              <Text style={{ color: theme.onSurface, fontSize: 15 }}>{otherUser?.phone_number || '—'}</Text>
            </View>
            <TouchableOpacity style={[styles.infoRow, { borderTopColor: theme.outlineVariant }]} onPress={() => router.push(`/user-profile/${userId}`)}>
              <Ionicons name="person-outline" size={18} color={theme.onSurfaceVariant} />
              <Text style={{ color: theme.primary, fontSize: 15 }}>View full profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoRow, { borderTopColor: theme.outlineVariant }]} onPress={() => setShowInfo(false)}>
              <Ionicons name="close" size={18} color={theme.onSurfaceVariant} />
              <Text style={{ color: theme.primary, fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Media viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewer(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {viewer && (
            <Image source={{ uri: viewer.uri }} style={styles.viewerImage} resizeMode="contain" />
          )}
          {viewer && (
            <TouchableOpacity
              style={styles.viewerOpen}
              onPress={() => Linking.openURL(viewer.uri)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Open in browser</Text>
            </TouchableOpacity>
          )}
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
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerName: { fontSize: 16.5, fontWeight: '600' },
  headerStatus: { fontSize: 12.5, marginTop: 1 },
  headerBtn: { padding: 6 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  dateWrap: { alignItems: 'center', paddingVertical: 10 },
  dateText: { fontSize: 12, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  infoSheet: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    alignItems: 'center',
  },
  infoName: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: { position: 'absolute', top: 54, right: 20, padding: 10 },
  viewerOpen: { position: 'absolute', bottom: 60, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
});

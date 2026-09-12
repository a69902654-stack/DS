'use client';

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Message, User } from '@/types';
import { useTheme } from '@/context/theme-context';
import { formatTime } from '@/utils';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.78;

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  onLongPress?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onMediaPress?: (uri: string, type: Message['media_type']) => void;
}

const fileIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  AUDIO: 'musical-notes-outline',
  FILE: 'document-text-outline',
};

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwn,
  showAvatar = false,
  showName = false,
  onLongPress,
  onMediaPress,
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const isMedia = message.media_type !== 'TEXT';
  const isReply = !!message.reply_to_id;
  const hasText = !!message.content;

  const bubbleBg = isOwn ? theme.primaryContainer : theme.surface;
  const textColor = isOwn ? theme.onSurface : theme.onSurface;
  const timeColor = isOwn ? theme.success : theme.onSurfaceVariant;

  const renderMedia = () => {
    if (!message.media_uri) return null;

    if (message.media_type === 'IMAGE') {
      return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onMediaPress?.(message.media_uri!, 'IMAGE')}>
          <Image
            source={{ uri: message.media_uri }}
            style={{ width: 240, height: 240, borderRadius: 14 }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (message.media_type === 'VIDEO') {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.videoThumb}
          onPress={() => onMediaPress?.(message.media_uri!, 'VIDEO')}
        >
          <View style={styles.playCircle}>
            <Ionicons name="play" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.fileRow}>
        <View style={[styles.fileIcon, { backgroundColor: isOwn ? theme.primary : theme.primaryContainer }]}>
          <Ionicons
            name={fileIcon[message.media_type] ?? 'document-text-outline'}
            size={22}
            color={isOwn ? theme.onPrimary : theme.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: textColor, fontSize: 15, fontWeight: '500' }}>
            {message.content || (message.media_type === 'AUDIO' ? 'Voice message' : 'File')}
          </Text>
          <Text style={{ color: timeColor, fontSize: 12 }}>Tap to open</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {showAvatar && !isOwn ? <View style={{ width: 30 }} /> : null}
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPress?.(message)}
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg, maxWidth: MAX_BUBBLE_WIDTH },
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        {isReply && (
          <View style={[styles.replyPreview, { borderLeftColor: isOwn ? theme.primary : theme.onSurfaceVariant }]}>
            <Text style={{ color: isOwn ? theme.primary : theme.onSurfaceVariant, fontSize: 12.5, fontWeight: '600' }}>
              {message.reply_to_sender || 'User'}
            </Text>
            <Text numberOfLines={2} style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>
              {message.reply_to_content || 'Media'}
            </Text>
          </View>
        )}

        {hasText && !isMedia && (
          <Text style={{ color: textColor, fontSize: 15.5, lineHeight: 21 }}>{message.content}</Text>
        )}

        {isMedia && renderMedia()}

        {hasText && isMedia && (
          <Text style={{ color: textColor, fontSize: 15, marginTop: 4 }}>{message.content}</Text>
        )}

        {message.is_pinned && (
          <View style={styles.pinnedRow}>
            <Ionicons name="pin" size={11} color={timeColor} />
            <Text style={{ color: timeColor, fontSize: 11 }}>Pinned</Text>
          </View>
        )}

        <View style={styles.footer}>
          {showName && !isOwn && !!message.sender_name && (
            <Text style={{ color: theme.primary, fontSize: 12.5, fontWeight: '600', marginRight: 6 }}>
              {message.sender_name}
            </Text>
          )}
          <View style={styles.timeRow}>
            <Text style={{ color: timeColor, fontSize: 11 }}>{formatTime(message.timestamp)}</Text>
            {isOwn && <Ionicons name="checkmark-done" size={13} color={timeColor} style={{ marginLeft: 2 }} />}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 10,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 2,
    marginBottom: 6,
    gap: 1,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoThumb: {
    width: 240,
    height: 170,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 190,
    paddingVertical: 2,
  },
  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

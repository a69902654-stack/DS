'use client';

import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types';

interface ChatInputProps {
  onSend: (text: string) => void | Promise<void>;
  onSendMedia?: (type: 'IMAGE' | 'VIDEO' | 'FILE', uri: string) => void | Promise<void>;
  onPickImage?: () => void | Promise<void>;
  onPickVideo?: () => void | Promise<void>;
  onPickFile?: () => void | Promise<void>;
  onTakePhoto?: () => void | Promise<void>;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = React.memo(function ChatInput({
  onSend,
  onPickImage,
  onPickVideo,
  onPickFile,
  onTakePhoto,
  replyingTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Message',
}: ChatInputProps) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText('');
    setShowAttachments(false);
  };

  const handleAttachment = async (action?: () => void | Promise<void>) => {
    setShowAttachments(false);
    await action?.();
  };

  return (
    <View style={{ backgroundColor: theme.background }}>
      {replyingTo && (
        <View style={[styles.replyBar, { backgroundColor: theme.surface, borderTopColor: theme.outlineVariant }]}>
          <View style={[styles.replyAccent, { backgroundColor: theme.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>
              {replyingTo.sender_name || 'User'}
            </Text>
            <Text numberOfLines={1} style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>
              {replyingTo.content || 'Media'}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={22} color={theme.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}

      {showAttachments && (
        <View style={[styles.attachmentSheet, { backgroundColor: theme.background }]}>
          {[
            { icon: 'image-outline' as const, label: 'Photos', color: '#53BDEB', action: onPickImage },
            { icon: 'videocam-outline' as const, label: 'Video', color: '#F472B6', action: onPickVideo },
            { icon: 'camera-outline' as const, label: 'Camera', color: '#25D366', action: onTakePhoto },
            { icon: 'document-text-outline' as const, label: 'File', color: '#F5B35C', action: onPickFile },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.attachmentItem}
              onPress={() => handleAttachment(item.action)}
              disabled={disabled}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={22} color="#FFFFFF" />
              </View>
              <Text style={{ color: theme.onSurface, fontSize: 12, marginTop: 6 }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.inputRow, { borderTopColor: theme.outlineVariant }]}>
        <TouchableOpacity
          onPress={() => setShowAttachments((v) => !v)}
          style={styles.circleButton}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showAttachments ? 'close' : 'add'}
            size={26}
            color={showAttachments ? theme.error : theme.onSurfaceVariant}
          />
        </TouchableOpacity>

        <View style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
          <TextInput
            ref={inputRef}
            style={{ flex: 1, color: theme.onSurface, fontSize: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8 }}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={theme.onSurfaceVariant}
            multiline
            maxLength={4000}
            editable={!disabled}
            returnKeyType="send"
            blurOnSubmit={Platform.OS !== 'ios'}
            onSubmitEditing={handleSend}
          />
          {!text.trim() && (
            <>
              <TouchableOpacity onPress={() => handleAttachment(onPickImage)} style={styles.inlineIcon}>
                <Ionicons name="image-outline" size={22} color={theme.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAttachment(onTakePhoto)} style={styles.inlineIcon}>
                <Ionicons name="camera-outline" size={22} color={theme.onSurfaceVariant} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          style={[styles.circleButton, { opacity: !text.trim() || disabled ? 0.4 : 1 }]}
          activeOpacity={0.7}
        >
          <View style={[styles.sendCircle, { backgroundColor: theme.primary }]}>
            <Ionicons name="send" size={18} color={theme.onPrimary} style={{ marginLeft: 2 }} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  replyAccent: {
    width: 3,
    height: 34,
    borderRadius: 2,
  },
  attachmentSheet: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 22,
  },
  attachmentItem: {
    alignItems: 'center',
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  circleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 42,
    maxHeight: 110,
  },
  inlineIcon: {
    padding: 6,
  },
  sendCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

'use client';

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/theme-context';
import { getInitials } from '@/utils';

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  avatarColor?: number | string | null;
  size?: number;
  showOnlineDot?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

export const Avatar = React.memo(function Avatar({
  name,
  avatarUrl,
  avatarColor = 0,
  size = 44,
  showOnlineDot = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const { theme } = useTheme();

  const color =
    typeof avatarColor === 'number'
      ? theme.avatarColors[avatarColor % theme.avatarColors.length]
      : avatarColor || theme.primary;

  return (
    <View style={style}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.surfaceVariant }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: size * 0.36, color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase' }}>
            {getInitials(name) || '?'}
          </Text>
        </View>
      )}
      {showOnlineDot && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            backgroundColor: isOnline ? theme.success : theme.onSurfaceVariant,
            borderWidth: 2,
            borderColor: theme.background,
          }}
        />
      )}
    </View>
  );
});

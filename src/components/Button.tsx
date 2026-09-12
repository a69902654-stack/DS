'use client';

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/theme-context';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'surface';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: object;
}

export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'md',
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  const sizeStyles = {
    sm: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, gap: 6, radius: 10 },
    md: { paddingHorizontal: 24, paddingVertical: 14, fontSize: 16, gap: 8, radius: 14 },
    lg: { paddingHorizontal: 32, paddingVertical: 16, fontSize: 17, gap: 10, radius: 16 },
  };

  const variantStyles = {
    primary: {
      container: { backgroundColor: theme.primary },
      text: { color: theme.onPrimary },
      spinner: theme.onPrimary,
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
      text: { color: theme.primary },
      spinner: theme.primary,
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: theme.primary },
      spinner: theme.primary,
    },
    danger: {
      container: { backgroundColor: theme.error },
      text: { color: '#FFFFFF' },
      spinner: '#FFFFFF',
    },
    surface: {
      container: { backgroundColor: theme.surfaceVariant },
      text: { color: theme.onSurface },
      spinner: theme.onSurface,
    },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        v.container,
        { borderRadius: s.radius, ...s, width: fullWidth ? '100%' : 'auto' },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, v.text, { fontSize: s.fontSize }]}>{title}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});

'use client';

import React, { forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { useTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: object;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      style,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [focused, setFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const isSecure = secureTextEntry && !showPassword;

    const borderColor = error ? theme.error : focused ? theme.primary : theme.outline;

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>{label}</Text> : null}
        <View
          style={[
            styles.inputWrapper,
            { borderColor, backgroundColor: theme.surface },
          ]}
        >
          {leftIcon && (
            <View style={styles.iconLeft}>
              <Ionicons name={leftIcon} size={20} color={focused ? theme.primary : theme.onSurfaceVariant} />
            </View>
          )}
          <TextInput
            ref={ref}
            style={[styles.input, { color: theme.onSurface }, style]}
            placeholderTextColor={theme.onSurfaceVariant}
            secureTextEntry={isSecure}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
            value={props.value ?? ''}
          />
          {(rightIcon || secureTextEntry) && (
            <TouchableOpacity onPress={secureTextEntry ? () => setShowPassword(!showPassword) : onRightIconPress} style={styles.iconRight}>
              {secureTextEntry ? (
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.onSurfaceVariant} />
              ) : (
                rightIcon
              )}
            </TouchableOpacity>
          )}
        </View>
        {error ? <Text style={[styles.helperText, { color: theme.error }]}>{error}</Text> : null}
        {!error && helperText ? <Text style={[styles.helperText, { color: theme.onSurfaceVariant }]}>{helperText}</Text> : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  iconLeft: {
    paddingLeft: 14,
  },
  iconRight: {
    paddingRight: 14,
    paddingLeft: 8,
  },
  helperText: {
    fontSize: 12,
  },
});

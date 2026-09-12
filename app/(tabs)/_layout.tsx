'use client';

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/theme-context';

function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: ColorValue;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={24} color={focused ? theme.primary : color} />
      {focused && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
    </View>
  );
}

export default function TabsLayout() {
  const { theme, themeName } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.outlineVariant,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="chatbubbles-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ focused, color }) => <TabIcon name="people-outline" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => <TabIcon name="person-circle-outline" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});

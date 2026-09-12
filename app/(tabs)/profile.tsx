'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useMediaUpload, uploadAvatarFile } from '@/hooks/use-media';
import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { THEMES, WALLPAPERS, ThemeName, WallpaperName } from '@/constants';

export default function ProfileScreen() {
  const { user, updateProfile, signOut } = useAuth();
  const { theme, themeName, setTheme, wallpaper, setWallpaper } = useTheme();
  const { pickImage, takePhoto } = useMediaUpload();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url ?? null);
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color ?? 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setUsername(user.username ?? '');
      setBio(user.bio ?? '');
      setAvatarUrl(user.avatar_url);
      setAvatarColor(user.avatar_color ?? 0);
    }
  }, [user]);

  const handleAvatarPress = () => {
    Alert.alert('Profile photo', 'Choose an option', [
      { text: 'Take photo', onPress: () => uploadAvatar(takePhoto) },
      { text: 'Choose from gallery', onPress: () => uploadAvatar(pickImage) },
      ...(avatarUrl
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setAvatarUrl(null) }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const uploadAvatar = async (picker: () => Promise<string | null>) => {
    const uri = await picker();
    if (!uri || !user) return;
    setUploading(true);
    const url = await uploadAvatarFile(uri, user.id);
    setUploading(false);
    if (url) setAvatarUrl(url);
    else Alert.alert('DS', 'Upload failed. Check your connection and Storage policies.');
  };

  const handleSave = async () => {
    if (!user) return;
    if (name.trim().length < 2) {
      Alert.alert('DS', 'Name must be at least 2 characters');
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      name: name.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      avatar_color: avatarColor,
      selected_theme_name: themeName,
      chat_wallpaper: wallpaper,
    });
    setSaving(false);

    if (error) Alert.alert('DS', error.message);
    else Alert.alert('DS', 'Profile saved ✓');
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.outlineVariant }]}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
            <Avatar name={name || '?'} avatarUrl={avatarUrl} avatarColor={avatarColor} size={104} />
            <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              {uploading ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <Ionicons name="camera" size={17} color={theme.onPrimary} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 13, marginTop: 8 }}>@{user?.username}</Text>
        </View>

        {/* Fields */}
        <View style={styles.section}>
          <Input label="Name" leftIcon="person-outline" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
          <Input
            label="Username (login credential — cannot be changed)"
            leftIcon="at-outline"
            value={username}
            editable={false}
            placeholder="username"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Phone"
            leftIcon="call-outline"
            value={user?.phone_number ?? ''}
            editable={false}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
          <Input label="Bio" leftIcon="information-circle-outline" value={bio} onChangeText={setBio} placeholder="A few words about you" multiline />
        </View>

        {/* Avatar color */}
        <Text style={[styles.sectionTitle, { color: theme.onSurfaceVariant }]}>AVATAR COLOR</Text>
        <View style={styles.colorGrid}>
          {theme.avatarColors.map((color: string, index: number) => (
            <TouchableOpacity
              key={index}
              onPress={() => setAvatarColor(index)}
              style={[
                styles.colorOption,
                { backgroundColor: color, borderColor: avatarColor === index ? theme.onSurface : 'transparent' },
              ]}
            >
              {avatarColor === index && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: theme.onSurfaceVariant }]}>THEME</Text>
        <View style={styles.themeRow}>
          {(Object.keys(THEMES) as ThemeName[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTheme(t)}
              style={[
                styles.themeOption,
                { backgroundColor: THEMES[t].surfaceVariant, borderColor: themeName === t ? theme.primary : theme.outlineVariant },
              ]}
            >
              <View style={[styles.themePreview, { backgroundColor: THEMES[t].background }]}>
                <View style={[styles.themeBubble, { backgroundColor: THEMES[t].primary }]} />
                <View style={[styles.themeBubble, { backgroundColor: THEMES[t].surface, position: 'absolute', left: 10, top: 14 }]} />
              </View>
              <Text style={{ color: themeName === t ? theme.primary : theme.onSurfaceVariant, fontSize: 12.5, fontWeight: '600', marginTop: 8 }}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallpaper */}
        <Text style={[styles.sectionTitle, { color: theme.onSurfaceVariant }]}>CHAT WALLPAPER</Text>
        <View style={styles.wallpaperGrid}>
          {(Object.keys(WALLPAPERS) as WallpaperName[]).map((w) => (
            <TouchableOpacity
              key={w}
              onPress={() => setWallpaper(w)}
              style={[styles.wallpaperOption, { borderColor: wallpaper === w ? theme.primary : theme.outlineVariant }]}
            >
              {WALLPAPERS[w] ? (
                <Image source={{ uri: WALLPAPERS[w]! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="ban-outline" size={16} color={theme.onSurfaceVariant} />
                </View>
              )}
              {wallpaper === w && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                </View>
              )}
              <Text style={[styles.wallpaperLabel, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Save changes" onPress={handleSave} loading={saving} fullWidth size="lg" style={{ marginTop: 20 }} />

        <Button
          title="Sign out"
          variant="ghost"
          onPress={handleSignOut}
          fullWidth
          leftIcon={<Ionicons name="log-out-outline" size={20} color={theme.error} style={{ marginRight: 6 }} />}
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  content: { paddingHorizontal: 16, paddingBottom: 50 },
  avatarSection: { alignItems: 'center', paddingVertical: 22 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  section: { gap: 12, marginTop: 6, marginBottom: 20 },
  sectionTitle: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  themeRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  themeOption: { flex: 1, borderRadius: 14, borderWidth: 2, padding: 10, alignItems: 'center' },
  themePreview: { width: '100%', height: 54, borderRadius: 8, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 8 },
  themeBubble: { width: 34, height: 14, borderRadius: 7 },
  wallpaperGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  wallpaperOption: {
    width: '31%',
    aspectRatio: 16 / 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    justifyContent: 'flex-end',
  },
  checkBadge: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' },
  wallpaperLabel: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
    paddingVertical: 3,
    textAlign: 'center',
    width: '100%',
  },
});

import { useState, useCallback } from 'react';
import { supabase, getPublicUrl, STORAGE_BUCKETS } from '@/config/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

/** Core upload helper — usable from anywhere (hooks or plain functions). */
export async function uploadToBucket(uri: string, bucket: string, folder: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const ext =
      uri.split('.').pop()?.split('?')[0]?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) ||
      (blob.type.includes('png') ? 'png' : blob.type.includes('video') ? 'mp4' : 'jpg');
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, blob, {
      contentType: blob.type || 'application/octet-stream',
      upsert: false,
    });

    if (error) {
      console.error('[DS] upload error:', error.message);
      return null;
    }

    return getPublicUrl(bucket, fileName);
  } catch (error) {
    console.error('[DS] upload exception:', error);
    return null;
  }
}

export async function uploadAvatarFile(uri: string, userId: string): Promise<string | null> {
  return uploadToBucket(uri, STORAGE_BUCKETS.AVATARS, userId);
}

export async function uploadChatMediaFile(uri: string, userId: string): Promise<string | null> {
  return uploadToBucket(uri, STORAGE_BUCKETS.MEDIA, `chat/${userId}`);
}

/** React wrapper with uploading/progress state for UI indicators. */
export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (uri: string, bucket: string, folder: string): Promise<string | null> => {
    setUploading(true);
    const url = await uploadToBucket(uri, bucket, folder);
    setUploading(false);
    return url;
  }, []);

  const uploadAvatar = useCallback((uri: string, userId: string) => uploadAvatarFile(uri, userId), []);

  const uploadChatMedia = useCallback((uri: string, userId: string) => uploadChatMediaFile(uri, userId), []);

  const pickImage = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    return result.canceled ? null : result.assets[0].uri;
  }, []);

  const pickVideo = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
    });

    return result.canceled ? null : result.assets[0].uri;
  }, []);

  const pickDocument = useCallback(async (): Promise<string | null> => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) return result.assets[0].uri;
    return null;
  }, []);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    return result.canceled ? null : result.assets[0].uri;
  }, []);

  const recordVideo = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 60,
    });
    return result.canceled ? null : result.assets[0].uri;
  }, []);

  return {
    uploading,
    uploadFile,
    uploadAvatar,
    uploadChatMedia,
    pickImage,
    pickVideo,
    pickDocument,
    takePhoto,
    recordVideo,
  };
}

export const isWeb = Platform.OS === 'web';

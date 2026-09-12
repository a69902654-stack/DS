'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useGroups } from '@/hooks/use-groups';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Ionicons } from '@expo/vector-icons';
import { Group, GroupMember, User } from '@/types';

export default function GroupsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const { groups, loading, createGroup, joinGroup } = useGroups(user?.id || '');

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (groupName.trim().length < 2) {
      Alert.alert('DS', 'Group name must be at least 2 characters');
      return;
    }
    setBusy(true);
    const group = await createGroup(groupName.trim(), groupDesc.trim(), []);
    setBusy(false);
    if (group) {
      setShowCreate(false);
      setGroupName('');
      setGroupDesc('');
      router.push(`/group-chat/${group.id}`);
    } else {
      Alert.alert('DS', 'Could not create the group. Check your connection.');
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length < 4) {
      Alert.alert('DS', 'Enter a valid invite code');
      return;
    }
    setBusy(true);
    const { group, error } = await joinGroup(inviteCode.trim());
    setBusy(false);
    if (group) {
      setShowJoin(false);
      setInviteCode('');
      router.push(`/group-chat/${group.id}`);
    } else {
      Alert.alert('DS', error || 'Group not found');
    }
  };

  const renderGroup = ({ item }: { item: Group & { members: GroupMember[]; myRole?: string } }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.background }]}
      activeOpacity={0.6}
      onPress={() => router.push(`/group-chat/${item.id}`)}
    >
      {item.avatar_url ? (
        <Avatar name={item.name} avatarUrl={item.avatar_url} size={52} />
      ) : (
        <View style={[styles.groupAvatar, { backgroundColor: theme.primaryContainer }]}>
          <Ionicons name="people" size={24} color={theme.primary} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={[styles.name, { color: theme.onSurface }]}>
            {item.name}
          </Text>
          {item.myRole === 'owner' && (
            <View style={[styles.ownerBadge, { backgroundColor: theme.primaryContainer }]}>
              <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '700' }}>OWNER</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={1} style={[styles.preview, { color: theme.onSurfaceVariant }]}>
          {item.description || `${item.members.length} members · code ${item.invite_code}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowJoin(true)}
            style={[styles.headerBtn, { backgroundColor: theme.surfaceVariant }]}
          >
            <Ionicons name="key-outline" size={19} color={theme.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={[styles.headerBtn, { backgroundColor: theme.surfaceVariant }]}
          >
            <Ionicons name="add" size={22} color={theme.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(g) => g.id}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyCircle, { backgroundColor: theme.surfaceVariant }]}>
                <Ionicons name="people-outline" size={40} color={theme.onSurfaceVariant} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>No groups yet</Text>
              <Text style={[styles.emptySub, { color: theme.onSurfaceVariant }]}>
                Create a group or join with an invite code
              </Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
          )
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      />

      {/* Create group modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCreate(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.onSurface }]}>Create group</Text>
            <Input label="Group name" leftIcon="people-outline" placeholder="e.g. Dev Team" value={groupName} onChangeText={setGroupName} />
            <Input label="Description (optional)" leftIcon="information-circle-outline" placeholder="What is this group about?" value={groupDesc} onChangeText={setGroupDesc} />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setShowCreate(false)} />
              <Button title="Create" onPress={handleCreate} loading={busy} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Join group modal */}
      <Modal visible={showJoin} transparent animationType="slide" onRequestClose={() => setShowJoin(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowJoin(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.onSurface }]}>Join group</Text>
            <Text style={{ color: theme.onSurfaceVariant, marginBottom: 14, fontSize: 14 }}>
              Ask a friend for their group's 8-character invite code.
            </Text>
            <Input
              label="Invite code"
              leftIcon="key-outline"
              placeholder="ABCD1234"
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setShowJoin(false)} />
              <Button title="Join" onPress={handleJoin} loading={busy} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 30, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 11 },
  groupAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 16.5, fontWeight: '600', flexShrink: 1 },
  preview: { fontSize: 14, marginTop: 2 },
  ownerBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 40, paddingTop: 60 },
  emptyCircle: { width: 92, height: 92, borderRadius: 46, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 19, fontWeight: '700' },
  emptySub: { fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 34,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
});

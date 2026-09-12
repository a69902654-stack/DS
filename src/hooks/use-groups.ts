import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { Group, GroupMember, Message } from '@/types';
import { generateInviteCode } from '@/utils';
import { uploadChatMediaFile } from './use-media';

export function useGroups(currentUserId: string) {
  const [groups, setGroups] = useState<(Group & { members: GroupMember[]; myRole?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    // Fetch my memberships
    const { data: memberships, error } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', currentUserId);

    if (error || !memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);
    const roleMap = new Map(memberships.map((m) => [m.group_id, m.role]));

    // Fetch groups + all members with user info
    const [{ data: groupsData }, { data: membersData }] = await Promise.all([
      supabase.from('groups').select('*').in('id', groupIds),
      supabase
        .from('group_members')
        .select('*, user:users(*)')
        .in('group_id', groupIds),
    ]);

    if (!groupsData) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupsWithMembers = (groupsData as Group[]).map((g) => ({
      ...g,
      myRole: roleMap.get(g.id) as GroupMember['role'],
      members: ((membersData ?? []) as GroupMember[]).filter((mem) => mem.group_id === g.id),
    }));

    setGroups(groupsWithMembers as (Group & { members: GroupMember[]; myRole?: string })[]);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    loadGroups();

    const channel = supabase
      .channel(`groups:${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_members', filter: `user_id=eq.${currentUserId}` },
        () => loadGroups()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadGroups]);

  const createGroup = async (
    name: string,
    description: string,
    memberIds: string[],
    avatarUrl?: string
  ): Promise<Group | null> => {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        invite_code: generateInviteCode(),
        name,
        description: description || null,
        avatar_url: avatarUrl ?? null,
        owner_id: currentUserId,
        can_members_send_messages: true,
        can_members_send_media: true,
      })
      .select()
      .single();

    if (error || !group) {
      console.error('[DS] create group error:', error?.message);
      return null;
    }

    const members = [
      { group_id: group.id, user_id: currentUserId, role: 'owner' as const },
      ...memberIds.map((id) => ({ group_id: group.id, user_id: id, role: 'member' as const })),
    ];
    await supabase.from('group_members').insert(members);

    await loadGroups();
    return group as Group;
  };

  const joinGroup = async (inviteCode: string): Promise<{ group: Group | null; error?: string }> => {
    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !group) return { group: null, error: 'Invalid invite code' };

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (existing) return { group: group as Group };

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: currentUserId, role: 'member' });

    if (memberError) {
      console.error('[DS] join group error:', memberError.message);
      return { group: null, error: 'Could not join group' };
    }

    await loadGroups();
    return { group: group as Group };
  };

  const leaveGroup = async (groupId: string) => {
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', currentUserId);
    await loadGroups();
  };

  return { groups, loading, loadGroups, createGroup, joinGroup, leaveGroup };
}

export function useGroupMessages(currentUserId: string, groupId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('timestamp', { ascending: true })
      .limit(200);

    if (!error && data) setMessages(data as Message[]);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const deletedId = payload.old.id as number;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const sendGroupMessage = useCallback(
    async (content: string, senderName: string, senderUsername: string, replyTo?: Message): Promise<Message | null> => {
      if (!groupId || !currentUserId) return null;
      setSending(true);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          sender_name: senderName,
          sender_username: senderUsername,
          group_id: groupId,
          content,
          media_type: 'TEXT',
          timestamp: Date.now(),
          is_pinned: false,
          reply_to_id: replyTo?.id ?? null,
          reply_to_content: replyTo?.content ?? null,
          reply_to_sender: replyTo?.sender_name ?? null,
        })
        .select()
        .single();
      setSending(false);

      if (error) {
        console.error('[DS] group send error:', error.message);
        return null;
      }

      const message = data as Message;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      return message;
    },
    [groupId, currentUserId]
  );

  const sendGroupMedia = useCallback(
    async (
      mediaType: Message['media_type'],
      localUri: string,
      senderName: string,
      senderUsername: string,
      replyTo?: Message
    ): Promise<Message | null> => {
      if (!groupId || !currentUserId) return null;
      setSending(true);
      const url = await uploadChatMediaFile(localUri, currentUserId);
      if (!url) {
        setSending(false);
        return null;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          sender_name: senderName,
          sender_username: senderUsername,
          group_id: groupId,
          content: null,
          media_type: mediaType,
          media_uri: url,
          timestamp: Date.now(),
          is_pinned: false,
          reply_to_id: replyTo?.id ?? null,
          reply_to_content: replyTo?.content ?? null,
          reply_to_sender: replyTo?.sender_name ?? null,
        })
        .select()
        .single();
      setSending(false);

      if (error) {
        console.error('[DS] group media error:', error.message);
        return null;
      }

      const message = data as Message;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      return message;
    },
    [groupId, currentUserId]
  );

  const deleteMessage = useCallback(async (messageId: number) => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) console.error('[DS] delete error:', error.message);
  }, []);

  return { messages, loading, sending, sendGroupMessage, sendGroupMedia, deleteMessage };
}

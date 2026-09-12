import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/config/supabase';
import { Message, User } from '@/types';
import { uploadChatMediaFile } from './use-media';

export function useMessages(currentUserId: string, otherUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const sentIds = useRef<Set<number>>(new Set());

  const loadMessages = useCallback(async () => {
    if (!currentUserId || !otherUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order('timestamp', { ascending: true })
      .limit(200);

    if (!error && data) {
      setMessages(data as Message[]);
      data.forEach((m) => sentIds.current.add((m as Message).id));
    }
    setLoading(false);
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Fetch the other user's profile
  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('id', otherUserId).single();
      if (!cancelled && data) setOtherUser(data as User);
    })();
    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  // Realtime: INSERT + DELETE for this conversation.
  // Note: postgres_changes filters don't support `or(...)`, so we subscribe to
  // both participants' columns and dedupe client-side.
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const channel = supabase
      .channel(`dm:${[currentUserId, otherUserId].sort().join(':')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== otherUserId) return;
          upsertMessage(msg);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.receiver_id !== otherUserId) return;
          upsertMessage(msg);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = payload.old.id as number;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  const upsertMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      next.sort((a, b) => a.timestamp - b.timestamp);
      return next;
    });
  }, []);

  const insertMessage = useCallback(
    async (row: Partial<Message>): Promise<Message | null> => {
      if (!currentUserId || !otherUserId) return null;
      setSending(true);
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          sender_name: userCache.name ?? '',
          sender_username: userCache.username ?? '',
          receiver_id: otherUserId,
          media_type: 'TEXT',
          timestamp: Date.now(),
          is_pinned: false,
          ...row,
        })
        .select()
        .single();
      setSending(false);

      if (error) {
        console.error('[DS] send message error:', error.message);
        return null;
      }

      const message = data as Message;
      upsertMessage(message);
      return message;
    },
    [currentUserId, otherUserId, upsertMessage]
  );

  const sendMessage = useCallback(
    async (content: string, replyTo?: Message): Promise<Message | null> =>
      insertMessage({
        content,
        media_type: 'TEXT',
        reply_to_id: replyTo?.id ?? null,
        reply_to_content: replyTo?.content ?? null,
        reply_to_sender: replyTo?.sender_name ?? null,
      }),
    [insertMessage]
  );

  const sendMediaMessage = useCallback(
    async (mediaType: Message['media_type'], localUri: string, replyTo?: Message): Promise<Message | null> => {
      if (!currentUserId || !otherUserId) return null;
      setSending(true);
      const url = await uploadChatMediaFile(localUri, currentUserId);
      setSending(false);
      if (!url) return null;

      return insertMessage({
        media_type: mediaType,
        media_uri: url,
        content: fileNameFromUri(localUri),
        reply_to_id: replyTo?.id ?? null,
        reply_to_content: replyTo?.content ?? null,
        reply_to_sender: replyTo?.sender_name ?? null,
      });
    },
    [currentUserId, otherUserId, insertMessage]
  );

  const deleteMessage = useCallback(async (messageId: number) => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) console.error('[DS] delete message error:', error.message);
  }, []);

  const togglePin = useCallback(async (message: Message) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: !message.is_pinned })
      .eq('id', message.id);
    if (!error) {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, is_pinned: !m.is_pinned } : m)));
    }
  }, []);

  return {
    messages,
    loading,
    sending,
    otherUser,
    sendMessage,
    sendMediaMessage,
    deleteMessage,
    togglePin,
  };
}

// Cache current user's name/username so we don't refetch per message.
let userCache = { name: '' as string | null, username: '' as string | null };
export const setUserCache = (name?: string | null, username?: string | null) => {
  userCache = { name: name ?? null, username: username ?? null };
};

function fileNameFromUri(uri: string): string | null {
  try {
    const last = uri.split('/').pop() || '';
    const clean = decodeURIComponent(last.split('?')[0]);
    return clean || null;
  } catch {
    return null;
  }
}

export function useConversations(currentUserId: string) {
  const [conversations, setConversations] = useState<
    Array<{ user: User; lastMessage: Message | null; unreadCount: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error || !messages) {
      setLoading(false);
      return;
    }

    const userIds = new Set<string>();
    messages.forEach((m) => {
      if (m.sender_id !== currentUserId) userIds.add(m.sender_id);
      if (m.receiver_id && m.receiver_id !== currentUserId) userIds.add(m.receiver_id);
    });

    let users: User[] = [];
    if (userIds.size > 0) {
      const { data } = await supabase.from('users').select('*').in('id', Array.from(userIds));
      users = (data as User[]) ?? [];
    }
    const userMap = new Map(users.map((u) => [u.id, u]));

    const convMap = new Map<string, { user: User; lastMessage: Message; unreadCount: number }>();

    for (const msg of messages) {
      if (msg.group_id) continue;
      const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
      if (!otherId) continue;

      const existing = convMap.get(otherId);
      if (!existing) {
        const user = userMap.get(otherId);
        if (user) {
          convMap.set(otherId, {
            user,
            lastMessage: msg as Message,
            unreadCount: msg.sender_id !== currentUserId ? 1 : 0,
          });
        }
      } else if (msg.sender_id !== currentUserId) {
        existing.unreadCount += 1;
      }
    }

    setConversations(Array.from(convMap.values()));
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel(`dm-inbox:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  return { conversations, loading, loadConversations };
}

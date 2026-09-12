import { Message } from '@/types';

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

export const formatLastSeen = (lastSeen: string | null | undefined): string => {
  if (!lastSeen) return 'Offline';
  const date = new Date(lastSeen);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Last seen just now';
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${formatTimestamp(date.getTime())}`;
};

export const messagePreview = (message: Message, currentUserId?: string): string => {
  const prefix = message.sender_id === currentUserId ? 'You: ' : '';
  switch (message.media_type) {
    case 'IMAGE':
      return `${prefix}📷 Photo`;
    case 'VIDEO':
      return `${prefix}🎬 Video`;
    case 'AUDIO':
      return `${prefix}🎤 Voice`;
    case 'FILE':
      return `${prefix}📎 ${message.content || 'File'}`;
    default:
      return `${prefix}${message.content || ''}`;
  }
};

export const getInitials = (name?: string | null): string => {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Best display name for a user: falls back to @username when `name` is null.
 */
export const displayName = (user?: { name?: string | null; username?: string | null } | null): string => {
  if (!user) return 'Unknown';
  const n = (user.name ?? '').trim();
  if (n) return n;
  const u = (user.username ?? '').trim();
  return u ? `@${u}` : 'Unknown';
};

export const getRandomAvatarColor = (): string => {
  const colors = [
    '#208AEF', '#E84855', '#34C759', '#FF9F0A', '#AF52DE',
    '#FF375F', '#5AC8FA', '#FFCC00', '#FF2D55', '#4CD964',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
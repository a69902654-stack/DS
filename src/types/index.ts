export type User = {
  id: string;
  username: string | null;
  name: string | null;
  phone_number: string | null;
  avatar_color: number;
  selected_theme_name: 'DARK' | 'LIGHT' | 'FROSTED';
  chat_wallpaper: 'NONE' | 'MOUNTAIN' | 'OCEAN' | 'FOREST' | 'SUNSET' | 'NIGHT';
  is_online: boolean;
  is_suspended: boolean;
  suspended_until: number;
  created_at: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
};

export type Message = {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_username: string;
  receiver_id: string | null;
  group_id: string | null;
  content: string | null;
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  media_uri: string | null;
  timestamp: number;
  created_at: string;
  reply_to_id: number | null;
  reply_to_content: string | null;
  reply_to_sender: string | null;
  is_pinned: boolean;
};

export type Group = {
  id: string;
  invite_code: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
  can_members_send_messages: boolean;
  can_members_send_media: boolean;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: User;
};

export type Conversation = {
  user: User;
  lastMessage: Message | null;
  unreadCount: number;
};

export type ThemeName = 'DARK' | 'LIGHT' | 'FROSTED';
export type WallpaperName = 'NONE' | 'MOUNTAIN' | 'OCEAN' | 'FOREST' | 'SUNSET' | 'NIGHT';

export type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
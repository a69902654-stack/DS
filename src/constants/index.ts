export const THEMES = {
  DARK: {
    name: 'DARK',
    background: '#0B141A',
    surface: '#15202B',
    surfaceVariant: '#1C2A36',
    surfaceTint: 'rgba(255, 255, 255, 0.06)',
    primary: '#25D366',
    primaryContainer: '#1B3A29',
    onPrimary: '#04120A',
    onSurface: '#E9EDEF',
    onSurfaceVariant: '#8696A0',
    outline: '#2A3942',
    outlineVariant: '#222E35',
    error: '#F15C6D',
    errorContainer: '#3A1D24',
    success: '#25D366',
    warning: '#F5B35C',
    tabBar: '#111B21',
    headerBlur: 'rgba(17, 27, 33, 0.85)',
    avatarColors: [
      '#25D366', '#53BDEB', '#F77C68', '#F5B35C', '#A78BFA',
      '#F472B6', '#34D399', '#FBBF24', '#FB7185', '#60A5FA',
    ],
  },
  LIGHT: {
    name: 'LIGHT',
    background: '#F0F2F5',
    surface: '#FFFFFF',
    surfaceVariant: '#EFEAE2',
    surfaceTint: 'rgba(0, 0, 0, 0.04)',
    primary: '#00A884',
    primaryContainer: '#D9FDD3',
    onPrimary: '#FFFFFF',
    onSurface: '#111B21',
    onSurfaceVariant: '#667781',
    outline: '#D1D7DB',
    outlineVariant: '#E9EDEF',
    error: '#D93025',
    errorContainer: '#FCE8E6',
    success: '#00A884',
    warning: '#B45309',
    tabBar: '#FFFFFF',
    headerBlur: 'rgba(255, 255, 255, 0.9)',
    avatarColors: [
      '#00A884', '#0E7490', '#EA580C', '#B45309', '#7C3AED',
      '#DB2777', '#059669', '#D97706', '#E11D48', '#2563EB',
    ],
  },
  FROSTED: {
    name: 'FROSTED',
    background: '#0E1621',
    surface: 'rgba(30, 41, 59, 0.72)',
    surfaceVariant: 'rgba(45, 58, 75, 0.6)',
    surfaceTint: 'rgba(255, 255, 255, 0.08)',
    primary: '#7DD3FC',
    primaryContainer: 'rgba(125, 211, 252, 0.18)',
    onPrimary: '#0B1220',
    onSurface: '#F1F5F9',
    onSurfaceVariant: '#94A3B8',
    outline: 'rgba(148, 163, 184, 0.35)',
    outlineVariant: 'rgba(148, 163, 184, 0.18)',
    error: '#FDA4AF',
    errorContainer: 'rgba(127, 29, 29, 0.45)',
    success: '#86EFAC',
    warning: '#FDE68A',
    tabBar: 'rgba(15, 23, 42, 0.82)',
    headerBlur: 'rgba(15, 23, 42, 0.75)',
    avatarColors: [
      '#7DD3FC', '#C4B5FD', '#FDBA74', '#FDE68A', '#A5B4FC',
      '#F9A8D4', '#6EE7B7', '#FCD34D', '#FDA4AF', '#93C5FD',
    ],
  },
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];

export const WALLPAPERS = {
  NONE: null,
  MOUNTAIN: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
  OCEAN: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1080&q=80',
  FOREST: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
  SUNSET: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1080&q=80',
  NIGHT: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1080&q=80',
} as const;

export const AVATAR_COLORS = THEMES.DARK.avatarColors;

export const DEFAULT_AVATAR_COLOR = '#25D366';

export const APP_NAME = 'DS';

export type { ThemeName, WallpaperName } from '@/types';

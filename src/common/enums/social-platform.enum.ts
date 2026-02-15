export enum SocialPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  WHATSAPP = 'whatsapp',
  GMAIL = 'gmail',
}

export enum MessageDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export enum SocialInboxPermissionType {
  VIEW_ONLY = 'view_only',
  VIEW_AND_ANSWER = 'view_and_answer',
}

export enum SocialInboxAccessType {
  USER = 'user',
  TEAM = 'team',
  ROLE = 'role',
}

/**
 * Platform display configuration with colors
 */
export const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { name: string; color: string }
> = {
  [SocialPlatform.FACEBOOK]: {
    name: 'Facebook',
    color: '#3B82F6', // Blue (Messenger blue)
  },
  [SocialPlatform.INSTAGRAM]: {
    name: 'Instagram',
    color: '#EC4899', // Pink
  },
  [SocialPlatform.WHATSAPP]: {
    name: 'WhatsApp',
    color: '#22C55E', // Green
  },
  [SocialPlatform.GMAIL]: {
    name: 'Gmail',
    color: '#EA4335', // Red (Gmail brand color)
  },
};

/**
 * Get platform color by platform enum value
 */
export function getPlatformColor(platform: SocialPlatform): string {
  return PLATFORM_CONFIG[platform]?.color || '#6B7280'; // Default gray if not found
}

/**
 * Get platform display name by platform enum value
 */
export function getPlatformName(platform: SocialPlatform): string {
  return PLATFORM_CONFIG[platform]?.name || platform;
}

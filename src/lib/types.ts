
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isLocked?: boolean;
  isAdmin?: boolean; 
  // For guest users liking/commenting
  ipAddress?: string;
}

export interface Post {
  id: string; // yyyy_mm_dd_hh_HEMUNG_000
  userId?: string; // If posted by a registered user
  userName: string; // Name provided during post creation
  userPhone: string; // Phone provided during post creation
  userEmail: string; // Email provided during post creation
  images: { url: string; alt: string }[]; // URLs of uploaded images with alt text
  description: string;
  createdAt: string; // ISO date string
  isFeatured?: boolean;
  isHidden?: boolean;
  // Counts will be derived or stored
  likeCount: number;
  shareCount: number;
  commentCount: number;
  // Full data for interactions
  likes: Like[];
  comments: Comment[];
  isFlagged?: boolean; // For moderation based on keywords
  flaggedKeywords?: string[];
}

export interface Like {
  id: string;
  postId: string;
  userId?: string; // If liked by a registered user
  guestName?: string; // If liked by a guest
  guestIp?: string; // IP of guest liker
  createdAt: string; // ISO date string
}

export interface Comment {
  id: string;
  postId: string;
  userId?: string; // If commented by a registered user
  guestName?: string; // If commented by a guest
  content: string;
  createdAt: string; // ISO date string
  isFlagged?: boolean; // For moderation
  flaggedKeywords?: string[];
}

export interface Report {
  id: string;
  postId: string;
  reason: string;
  reportedByUserId?: string; // If reported by a registered user
  reportedByGuestName?: string; // If reported by a guest
  reportedAt: string; // ISO date string
}

export interface LotteryProgram {
  id: string;
  name: string;
  winningNumbers: string[]; // Array of 3-digit strings
  createdAt: string; // ISO date string
  winningPosts?: Post[]; // Posts that matched the numbers
}

export interface ModerationKeyword {
  id: string;
  keyword: string;
}

export interface AppStats {
  totalPosts: number;
  totalUsers: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
}

// Mock user for auth context
export type AuthenticatedUser = Pick<User, 'id' | 'name' | 'phone' | '
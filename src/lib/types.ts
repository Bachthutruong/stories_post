export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isLocked?: boolean;
  role?: 'user' | 'admin';
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
  winningNumbers: string[];
  drawDate: string; // Array of 3-digit strings
  createdAt: string; // ISO date string
  // Actual winners from the backend, each linking to a user and post
  winners?: { // Using _id from backend for Mongoose docs
    _id: string; // ID of the winner entry itself
    userId: { // Populated user details
      _id: string; // User ID from Mongoose
      name: string;
      phoneNumber: string;
      email?: string;
    } | null; // Can be null if user was deleted
    postId: string; // ID of the winning post
    // Assuming drawDate might be useful here, though it's on the parent Lottery object
    // drawDate?: string; // Consider if this should be here or derived from parent
  }[];
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
  totalReports?: number; // Added for potential dashboard use
  activeLotteryPrograms?: number; // Added
}

// Define a new type for the details inside the nested 'user' property
export interface AuthenticatedUserDetails {
  id: string;
  name: string;
  phoneNumber: string; // Matches the JSON key
  email?: string;
  role?: 'user' | 'admin';
}

// Define the full structure of the authenticated user info returned by the API
export interface AuthenticatedUserResponse {
  message: string;
  token: string;
  user: AuthenticatedUserDetails;
}

// The type used in the AuthContext state should be the full response structure or null
export type AuthenticatedUser = AuthenticatedUserResponse | null;

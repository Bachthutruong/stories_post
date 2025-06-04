
import type { Post, User, Comment, Like, AppStats, ModerationKeyword, LotteryProgram, Report } from './types';
import { generatePostId } from './utils';

export const mockUsers: User[] = [
  { id: 'user1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nva@example.com', isAdmin: true },
  { id: 'user2', name: 'Trần Thị B', phone: '0907654321', email: 'ttb@example.com' },
  { id: 'user3', name: 'Lê Văn C', phone: '0912345678', email: 'lvc@example.com', isLocked: true },
];

const createMockPost = (idSuffix: string, featured: boolean, i: number): Post => {
  const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000 - i * 3 * 60 * 60 * 1000); // posts spread over days and hours
  const postId = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}_HEMUNG_${idSuffix}`;
  
  const comments: Comment[] = Array.from({ length: Math.floor(Math.random() * 5) }, (_, k) => ({
    id: `comment${i}-${k}`,
    postId,
    guestName: `Guest Commenter ${k+1}`,
    content: `This is a insightful comment number ${k+1} on post ${i+1}.`,
    createdAt: new Date(date.getTime() + (k+1) * 60000).toISOString(), // comments after post
  }));

  const likes: Like[] = Array.from({ length: Math.floor(Math.random() * 20) }, (_, k) => ({
    id: `like${i}-${k}`,
    postId,
    guestName: `Guest Liker ${k+1}`,
    createdAt: new Date(date.getTime() + (k+1) * 30000).toISOString(),
  }));

  return {
    id: postId,
    userName: mockUsers[i % mockUsers.length].name,
    userPhone: mockUsers[i % mockUsers.length].phone,
    userEmail: mockUsers[i % mockUsers.length].email || 'test@example.com',
    images: [
      { url: `https://placehold.co/600x400.png?text=Post+Image+${i+1}`, alt: `Post Image ${i+1}` }
    ],
    description: `This is a sample description for post ${i+1} about Hẻm Story. It showcases community events and local culture. ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(Math.max(1, i % 5))}`,
    createdAt: date.toISOString(),
    isFeatured: featured,
    likeCount: likes.length,
    shareCount: Math.floor(Math.random() * 10),
    commentCount: comments.length,
    likes,
    comments,
  };
};

export const mockPosts: Post[] = [
  createMockPost('001', true, 0),
  createMockPost('002', true, 1),
  createMockPost('003', false, 2),
  createMockPost('004', true, 3),
  createMockPost('005', false, 4),
  createMockPost('006', false, 5),
  createMockPost('007', true, 6),
  createMockPost('008', false, 7),
  createMockPost('009', false, 8),
  createMockPost('010', true, 9),
  createMockPost('123', false, 10), // For lottery
  createMockPost('456', false, 11), // For lottery
];

export const mockFeaturedPosts = mockPosts.filter(p => p.isFeatured);

export const mockTopLikedPosts = [...mockPosts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6);
export const mockTopSharedPosts = [...mockPosts].sort((a, b) => b.shareCount - a.shareCount).slice(0, 6);
export const mockTopCommentedPosts = [...mockPosts].sort((a, b) => b.commentCount - a.commentCount).slice(0, 6);

export const mockAppStats: AppStats = {
  totalPosts: mockPosts.length,
  totalUsers: mockUsers.length,
  totalShares: mockPosts.reduce((sum, p) => sum + p.shareCount, 0),
  totalComments: mockPosts.reduce((sum, p) => sum + p.commentCount, 0),
  totalLikes: mockPosts.reduce((sum, p) => sum + p.likeCount, 0),
};

export const mockModerationKeywords: ModerationKeyword[] = [
  { id: 'kw1', keyword: 'offensive' },
  { id: 'kw2', keyword: 'inappropriate' },
  { id: 'kw3', keyword: 'badword' },
];

export const mockLotteryPrograms: LotteryProgram[] = [
  { 
    id: 'lottery1', 
    name: 'Grand Prize Draw - January', 
    winningNumbers: ['123', '789'], 
    createdAt: new Date().toISOString(),
    winningPosts: mockPosts.filter(p => p.id.endsWith('_HEMUNG_123') || p.id.endsWith('_HEMUNG_789'))
  },
];

export const mockReports: Report[] = [
  { id: 'report1', postId: mockPosts[2].id, reason: 'Spam content', reportedAt: new Date().toISOString(), reportedByGuestName: 'Concerned User' },
  { id: 'report2', postId: mockPosts[4].id, reason: 'Misleading information', reportedAt: new Date().toISOString(), reportedByUserId: 'user2' },
];

export const findPostById = (id: string): Post | undefined => mock
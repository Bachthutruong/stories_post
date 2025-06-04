
import type { Post, User, Comment, Like, AppStats, ModerationKeyword, LotteryProgram, Report } from './types';
import { generatePostId } from './utils';

export const mockUsers: User[] = [
  { id: 'user1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nva@example.com', isAdmin: true, isLocked: false },
  { id: 'user2', name: 'Trần Thị B', phone: '0907654321', email: 'ttb@example.com', isAdmin: false, isLocked: false },
  { id: 'user3', name: 'Lê Văn C', phone: '0912345678', email: 'lvc@example.com', isAdmin: false, isLocked: true },
  { id: 'user4', name: 'Phạm Hữu D', phone: '0987654321', email: 'phd@example.com', isAdmin: false, isLocked: false },
];

const createMockPost = (idSuffix: string, featured: boolean, i: number, isFlagged?: boolean, flaggedKeywords?: string[]): Post => {
  const userIndex = i % mockUsers.length;
  const currentUser = mockUsers[userIndex];
  const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000 - i * 3 * 60 * 60 * 1000 - Math.floor(Math.random() * 100000)); // posts spread over days and hours
  
  // Ensure ID suffix is part of the full ID for lottery matching
  const postId = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}_HEMUNG_${idSuffix}`;
  
  const comments: Comment[] = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, k) => ({
    id: `comment${i}-${k}`,
    postId,
    guestName: `Guest Commenter ${k+1}`,
    content: `This is an insightful comment number ${k+1} on post ${i+1}. It adds much value.`,
    createdAt: new Date(date.getTime() + (k+1) * 60000).toISOString(), // comments after post
    isFlagged: k % 3 === 0 ? true : false, // Mock some flagged comments
    flaggedKeywords: k % 3 === 0 ? ['badword'] : []
  }));

  const likes: Like[] = Array.from({ length: Math.floor(Math.random() * 20) + 1 }, (_, k) => ({
    id: `like${i}-${k}`,
    postId,
    guestName: `Guest Liker ${k+1}`,
    createdAt: new Date(date.getTime() + (k+1) * 30000).toISOString(),
  }));

  return {
    id: postId,
    userId: currentUser.id, // Assign a user ID for edit checks
    userName: currentUser.name,
    userPhone: currentUser.phone,
    userEmail: currentUser.email || 'test@example.com',
    images: [
      { url: `https://placehold.co/600x400.png?text=Story+${i+1}`, alt: `Story Image ${i+1}` },
      ...( i % 3 === 0 ? [{ url: `https://placehold.co/600x400.png?text=Extra+${i+1}`, alt: `Extra Image ${i+1}` }] : []) // Add a second image for some posts
    ],
    description: `This is a sample description for post ${i+1} with ID suffix ${idSuffix}. It showcases community events and local culture. ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(Math.max(1, i % 5))}`,
    createdAt: date.toISOString(),
    isFeatured: featured,
    isHidden: i % 5 === 0, // Mock some hidden posts
    likeCount: likes.length,
    shareCount: Math.floor(Math.random() * 15) + 1,
    commentCount: comments.length,
    likes,
    comments,
    isFlagged: isFlagged,
    flaggedKeywords: flaggedKeywords
  };
};

export const mockPosts: Post[] = [
  createMockPost('123', true, 0, false, []), // Lottery winner candidate
  createMockPost('456', true, 1, true, ['offensive']), // Lottery winner candidate, flagged
  createMockPost('789', false, 2, false, []), // Lottery winner candidate
  createMockPost('101', true, 3, false, []),
  createMockPost('202', false, 4, true, ['inappropriate', 'badword']), // Flagged
  createMockPost('303', false, 5, false, []),
  createMockPost('404', true, 6, false, []),
  createMockPost('505', false, 7, false, []),
  createMockPost('606', false, 8, true, ['spam']), // Flagged
  createMockPost('707', true, 9, false, []),
  createMockPost('808', false, 10, false, []), 
  createMockPost('909', false, 11, false, []), 
];

export const findPostById = (id: string): Post | undefined => mockPosts.find(post => post.id === id);


export const mockFeaturedPosts = mockPosts.filter(p => p.isFeatured && !p.isHidden && !p.isFlagged);

export const mockTopLikedPosts = [...mockPosts.filter(p => !p.isHidden && !p.isFlagged)].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6);
export const mockTopSharedPosts = [...mockPosts.filter(p => !p.isHidden && !p.isFlagged)].sort((a, b) => b.shareCount - a.shareCount).slice(0, 6);
export const mockTopCommentedPosts = [...mockPosts.filter(p => !p.isHidden && !p.isFlagged)].sort((a, b) => b.commentCount - a.commentCount).slice(0, 6);


export const mockModerationKeywords: ModerationKeyword[] = [
  { id: 'kw1', keyword: 'offensive' },
  { id: 'kw2', keyword: 'inappropriate' },
  { id: 'kw3', keyword: 'badword' },
  { id: 'kw4', keyword: 'spam' },
  { id: 'kw5', keyword: 'hate' },
];

export const mockLotteryPrograms: LotteryProgram[] = [
  { 
    id: 'lottery1', 
    name: 'Grand Prize Draw - June', 
    winningNumbers: ['123', '789'], 
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    winningPosts: mockPosts.filter(p => {
      const suffix = p.id.split('_HEMUNG_')[1];
      return suffix && (suffix.startsWith('123') || suffix.startsWith('789'));
    })
  },
   { 
    id: 'lottery2', 
    name: 'Mid-Year Special Draw', 
    winningNumbers: ['456'], 
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    winningPosts: mockPosts.filter(p => {
      const suffix = p.id.split('_HEMUNG_')[1];
      return suffix && suffix.startsWith('456');
    })
  },
];

export const mockReports: Report[] = [
  { id: 'report1', postId: mockPosts[2].id, reason: 'Spam content, irrelevant to community.', reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), reportedByGuestName: 'Concerned User X' },
  { id: 'report2', postId: mockPosts[4].id, reason: 'Misleading information and potentially harmful advice.', reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), reportedByUserId: 'user2' },
  { id: 'report3', postId: mockPosts[8].id, reason: 'Contains offensive language.', reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), reportedByGuestName: 'Anonymous Guest' },
];

export const mockAppStats: AppStats = {
  totalPosts: mockPosts.length,
  totalUsers: mockUsers.length,
  totalShares: mockPosts.reduce((sum, p) => sum + p.shareCount, 0),
  totalComments: mockPosts.reduce((sum, p) => sum + p.commentCount, 0),
  totalLikes: mockPosts.reduce((sum, p) => sum + p.likeCount, 0),
  totalReports: mockReports.length,
  activeLotteryPrograms: mockLotteryPrograms.length,
};

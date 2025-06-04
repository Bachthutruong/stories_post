
import type { Post, User, Comment, Like, AppStats, ModerationKeyword, LotteryProgram, Report } from './types';
import { formatDate } from './utils'; // Keep if utils also provide deterministic ID generation

export const mockUsers: User[] = [
  { id: 'user1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'nva@example.com', isAdmin: true, isLocked: false },
  { id: 'user2', name: 'Trần Thị B', phone: '0907654321', email: 'ttb@example.com', isAdmin: false, isLocked: false },
  { id: 'user3', name: 'Lê Văn C', phone: '0912345678', email: 'lvc@example.com', isAdmin: false, isLocked: true },
  { id: 'user4', name: 'Phạm Hữu D', phone: '0987654321', email: 'phd@example.com', isAdmin: false, isLocked: false },
];

const createMockPost = (idSuffix: string, featured: boolean, i: number, isFlagged?: boolean, flaggedKeywords?: string[]): Post => {
  const userIndex = i % mockUsers.length;
  const currentUser = mockUsers[userIndex];

  // Use a fixed base date and deterministic offsets to avoid hydration issues
  const baseDate = new Date('2024-05-20T10:00:00.000Z');
  // Deterministic offset for each post: subtract days, hours, and a small unique offset based on index 'i'
  const postDate = new Date(baseDate.getTime() - (i * 24 * 60 * 60 * 1000) - (i * 3 * 60 * 60 * 1000) - (i * 10000));

  // Ensure ID suffix is part of the full ID for lottery matching
  // The date part of ID should come from the actual postDate for consistency
  const postId = `${postDate.getFullYear()}_${(postDate.getMonth() + 1).toString().padStart(2, '0')}_${postDate.getDate().toString().padStart(2, '0')}_${postDate.getHours().toString().padStart(2, '0')}_HEMUNG_${idSuffix}`;

  const comments: Comment[] = Array.from({ length: Math.floor(i / 2) + 1 }, (_, k) => ({
    id: `comment${i}-${k}`,
    postId,
    userId: k % 2 === 0 ? mockUsers[(userIndex + k + 1) % mockUsers.length].id : undefined,
    guestName: k % 2 !== 0 ? `Guest Commenter ${k+1}`: undefined,
    content: `This is an insightful comment number ${k+1} on post ${i+1}. It adds much value. Lorem ipsum.`,
    createdAt: new Date(postDate.getTime() + (k+1) * 60000 + (i*1000) + 10000).toISOString(), // comments after post, slight variation
    isFlagged: k % 4 === 0 ? true : false,
    flaggedKeywords: k % 4 === 0 ? ['badword'] : []
  }));

  const likes: Like[] = Array.from({ length: (i * 3) % 20 + 1 }, (_, k) => ({
    id: `like${i}-${k}`,
    postId,
    userId: k % 3 === 0 ? mockUsers[(userIndex + k + 2) % mockUsers.length].id : undefined,
    guestName: k % 3 !== 0 ? `Guest Liker ${k+1}`: undefined,
    createdAt: new Date(postDate.getTime() + (k+1) * 30000 + (i*500) + 20000).toISOString(), // likes after post, slight variation
  }));

  return {
    id: postId,
    userId: currentUser.id,
    userName: currentUser.name,
    userPhone: currentUser.phone,
    userEmail: currentUser.email || `user${i+1}@example.com`,
    images: [
      { url: `https://placehold.co/600x400.png?text=Story+${i+1}`, alt: `Story Image ${i+1}`, 'data-ai-hint': 'story image' },
      ...( i % 3 === 0 ? [{ url: `https://placehold.co/600x400.png?text=Extra+${i+1}`, alt: `Extra Image ${i+1}`, 'data-ai-hint': 'gallery photo' }] : [])
    ],
    description: `This is a sample description for post ${i+1} with ID suffix ${idSuffix}. It showcases community events and local culture. ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(Math.max(1, i % 4 + 1))}`,
    createdAt: postDate.toISOString(),
    isFeatured: featured,
    isHidden: i % 7 === 0,
    likeCount: likes.length,
    shareCount: (i * 2) % 15 + 1,
    commentCount: comments.length,
    likes,
    comments,
    isFlagged: isFlagged,
    flaggedKeywords: flaggedKeywords
  };
};

export const mockPosts: Post[] = [
  createMockPost('123', true, 0, false, []),
  createMockPost('456', true, 1, true, ['offensive']),
  createMockPost('789', false, 2, false, []),
  createMockPost('101', true, 3, false, []),
  createMockPost('202', false, 4, true, ['inappropriate', 'badword']),
  createMockPost('303', false, 5, false, []),
  createMockPost('404', true, 6, false, []),
  createMockPost('505', false, 7, false, []),
  createMockPost('606', false, 8, true, ['spam']),
  createMockPost('707', true, 9, false, []),
  createMockPost('808', false, 10, false, []),
  createMockPost('909', false, 11, false, []),
  createMockPost('110', true, 12, false, []),
  createMockPost('221', false, 13, true, ['test']),
  createMockPost('332', true, 14, false, []),
];

export const findPostById = (id: string): Post | undefined => mockPosts.find(post => post.id === id);

export const mockFeaturedPosts = mockPosts.filter(p => p.isFeatured && !p.isHidden && !p.isFlagged);

// Ensure unique keys for sorted lists if multiple posts have same counts
const getSortedPosts = (sortFn: (a: Post, b: Post) => number) => {
  return [...mockPosts.filter(p => !p.isHidden && !p.isFlagged)]
    .sort(sortFn)
    .slice(0, 6);
};

export const mockTopLikedPosts = getSortedPosts((a, b) => b.likeCount - a.likeCount || a.id.localeCompare(b.id));
export const mockTopSharedPosts = getSortedPosts((a, b) => b.shareCount - a.shareCount || a.id.localeCompare(b.id));
export const mockTopCommentedPosts = getSortedPosts((a, b) => b.commentCount - a.commentCount || a.id.localeCompare(b.id));


export const mockModerationKeywords: ModerationKeyword[] = [
  { id: 'kw1', keyword: 'offensive' },
  { id: 'kw2', keyword: 'inappropriate' },
  { id: 'kw3', keyword: 'badword' },
  { id: 'kw4', keyword: 'spam' },
  { id: 'kw5', keyword: 'hate' },
  { id: 'kw6', keyword: 'test' },
];

const lotteryBaseDate = new Date('2024-05-01T10:00:00.000Z');
export const mockLotteryPrograms: LotteryProgram[] = [
  {
    id: 'lottery1',
    name: 'Grand Prize Draw - May',
    winningNumbers: ['123', '789'],
    createdAt: new Date(lotteryBaseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    winningPosts: mockPosts.filter(p => {
      const suffix = p.id.split('_HEMUNG_')[1];
      return suffix && (suffix.startsWith('123') || suffix.startsWith('789')) && !p.isFlagged && !p.isHidden;
    })
  },
   {
    id: 'lottery2',
    name: 'Mid-Month Special Draw',
    winningNumbers: ['456'],
    createdAt: new Date(lotteryBaseDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    winningPosts: mockPosts.filter(p => {
      const suffix = p.id.split('_HEMUNG_')[1];
      return suffix && suffix.startsWith('456') && !p.isFlagged && !p.isHidden;
    })
  },
];

const reportBaseDate = new Date('2024-05-10T10:00:00.000Z');
export const mockReports: Report[] = mockPosts.reduce((acc, post, index) => {
  if (index % 4 === 0 && post.id) { 
    acc.push({
      id: `report${index}`,
      postId: post.id,
      reason: `This is a sample report for post ${post.id}. Reason: ${index % 2 === 0 ? 'Spam content' : 'Offensive imagery'}.`,
      reportedAt: new Date(reportBaseDate.getTime() + index * (12 * 60 * 60 * 1000)).toISOString(),
      reportedByUserId: index % 3 === 0 ? mockUsers[(index + 1) % mockUsers.length].id : undefined,
      reportedByGuestName: index % 3 !== 0 ? `Concerned Guest ${index}` : undefined,
    });
  }
  return acc;
}, [] as Report[]);


export const mockAppStats: AppStats = {
  totalPosts: mockPosts.length,
  totalUsers: mockUsers.length,
  totalShares: mockPosts.reduce((sum, p) => sum + p.shareCount, 0),
  totalComments: mockPosts.reduce((sum, p) => sum + p.commentCount, 0),
  totalLikes: mockPosts.reduce((sum, p) => sum + p.likeCount, 0),
  totalReports: mockReports.length,
  activeLotteryPrograms: mockLotteryPrograms.length,
};

    
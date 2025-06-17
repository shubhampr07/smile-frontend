import { PublicUser } from './user'

export interface LeaderboardFilters {
  timeframe?: 'weekly' | 'monthly' | 'allTime'
  period?: 'today' | 'week' | 'month' | 'all'
  sortBy?: 'gifts' | 'posts' | 'likes' | 'activity'
  limit?: number
}

export interface LeaderboardUserEntry {
  rank: number
  user: PublicUser
  totalGiftsReceived: number
  totalGiftsSent: number
  postsCount: number
  likesReceived: number
  activityScore: number
  joinedAt: Date
  lastActive?: Date
  isCurrentUser: boolean
}

export interface LeaderboardPostEntry {
  rank: number
  post: {
    _id: string
    caption?: string
    image: {
      url: string
      publicId: string
    }
    createdAt: Date
  }
  user: PublicUser
  likesCount: number
  giftsCount: number
  totalGiftAmount: number
  engagementScore: number
  recentGifts: any[] // Could be more specific if needed
  isCurrentUserPost: boolean
}

export interface LeaderboardResponse {
  users: any
  leaderboard: LeaderboardUserEntry[]
  sortBy: string
}

export interface PostLeaderboardResponse {
  posts: any
  leaderboard: LeaderboardPostEntry[]
  period: string
}

export interface LeaderboardStats {
  totalGifts: number
  totalTransactions: number
  avgGiftAmount: number
  uniqueRecipients: number
  uniqueSenders: number
}

export interface TrendingData {
  trendingPosts: LeaderboardPostEntry[]
  trendingUsers: LeaderboardUserEntry[]
  stats: {
    last24Hours: {
      giftsCount: number
      totalAmount: number
    }
    lastWeek: {
      giftsCount: number
      totalAmount: number
    }
  }
}
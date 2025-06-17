export interface User {
  _id: string
  username: string
  email: string
  fullName: string
  avatar?: {
    url: string
    publicId: string
  }
  upiId?: string
  bio?: string
  totalGiftsReceived: number
  totalGiftsSent: number
  postsCount: number
  likesReceived: number
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface PublicUser {
  _id: string
  username: string
  fullName: string
  avatar?: {
    url: string
    publicId: string
  }
  bio?: string
  totalGiftsReceived: number
  postsCount: number
  likesReceived: number
  createdAt: Date
}

export interface UserStats {
  totalGiftsReceived: number
  totalGiftsSent: number
  postsCount: number
  likesReceived: number
  rank?: number
  giftTrend?: {
    thisWeek: number
    lastWeek: number
    change: number
  }
  postPerformance?: {
    averageLikes: number
    averageGifts: number
    totalEngagement: number
  }
}
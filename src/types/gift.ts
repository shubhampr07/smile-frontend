import { PublicUser } from './user'
import { Post } from './post'

export interface Gift {
  _id: string
  sender: PublicUser
  recipient: PublicUser
  post: string | Post
  amount: number
  transactionId: string
  status: 'pending' | 'confirmed' | 'disputed' | 'cancelled'
  message?: string
  paymentMethod: 'upi'
  createdAt: Date
  updatedAt: Date
}

export interface CreateGiftData {
  postId: string
  amount: number
  transactionId: string
  message?: string
}

export interface GiftFilters {
  status?: Gift['status']
  page?: number
  limit?: number
}

export interface GiftsResponse {
  gifts: Gift[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats?: {
    totalAmount: number
    totalCount: number
    averageAmount: number
  }
}

export interface GiftStats {
  sent: {
    total: number
    amount: number
    average: number
  }
  received: {
    total: number
    amount: number
    average: number
  }
  thisMonth: {
    sent: number
    received: number
  }
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
}
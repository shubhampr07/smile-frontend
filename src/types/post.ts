import { PublicUser } from './user'

export interface Post {
  _id: string
  title: string
  content: string
  image?: {
    url: string
  }
  author: {
    _id: string
    username: string
    avatar?: string
  }
  // Fallback for legacy posts
  user?: {
    _id: string
    username: string
    avatar?: string
    fullName?: string
    upiId?: string
  }
  likesCount: number
  commentsCount: number
  isLikedByUser: boolean
  comments: Array<{
    _id: string
    content: string
    author: {
      _id: string
      username: string
      avatar?: string
    }
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

export interface Like {
  user: string | PublicUser
  likedAt: Date
}

export interface PostWithGifts extends Post {
  gifts: Gift[]
}

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

export interface CreatePostData {
  title: string
  content: string
  image?: File
}

export interface UpdatePostData {
  caption?: string
  location?: string
}

export interface PostFilters {
  author?: string
  search?: string
  page?: number
  limit?: number
  sort?: string
}

export interface PostsResponse {
  pagination: any
  posts: Post[]
  total: number
  page: number
  totalPages: number
}
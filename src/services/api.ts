import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { User } from '../types/user'
import { Post, CreatePostData, PostsResponse, PostFilters } from '../types/post'
import { Gift, CreateGiftData, GiftsResponse, GiftFilters, GiftStats } from '../types/gift'
import { 
  LeaderboardResponse, 
  LeaderboardFilters, 
  PostLeaderboardResponse,
  TrendingData
} from '../types/leaderboard'

// Create axios instance with base URL
const API_URL = (import.meta as any).env.VITE_API_URL || 'https://smile-backend-qxgc.onrender.com/api'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Only remove token and redirect if we're not already on the login page
      // and if the error is not from the profile endpoint
      const isProfileEndpoint = error.config?.url?.includes('/auth/me')
      const isLoginPage = window.location.pathname === '/login'
      
      if (!isLoginPage && !isProfileEndpoint) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await axiosInstance.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData: {
    username: string
    email: string
    password: string
    fullName: string
    upiId?: string
  }) => {
    const response = await axiosInstance.post('/auth/register', userData)
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get('/auth/me')
    return response.data.user
  },
}

// Posts API
export const postsAPI = {
  getPosts: async (filters?: PostFilters): Promise<PostsResponse> => {
    const response = await axiosInstance.get('/posts', { params: filters })
    return response.data
  },

  getPost: async (id: string): Promise<{ post: Post }> => {
    const response = await axiosInstance.get(`/posts/${id}`)
    return response.data
  },

  createPost: async (postData: FormData): Promise<{ message: string; post: Post }> => {
    const response = await axiosInstance.post('/posts', postData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  updatePost: async (id: string, postData: Partial<CreatePostData>): Promise<{ message: string; post: Post }> => {
    const response = await axiosInstance.put(`/posts/${id}`, postData)
    return response.data
  },

  deletePost: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/posts/${id}`)
    return response.data
  },

  likePost: async (id: string): Promise<{ message: string; post: { _id: string; likesCount: number; isLikedByUser: boolean } }> => {
    const response = await axiosInstance.post(`/posts/${id}/like`)
    return response.data
  },

  getUserPosts: async (userId: string, filters?: PostFilters): Promise<PostsResponse> => {
    const response = await axiosInstance.get(`/posts/user/${userId}`, { params: filters })
    return response.data
  },

  addComment: async (postId: string, content: string): Promise<any> => {
    const response = await axiosInstance.post(`/posts/${postId}/comments`, { content })
    return response.data
  },

  getComments: async (postId: string, page = 1, limit = 10): Promise<any> => {
    const response = await axiosInstance.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    })
    return response.data
  },

  getPostsByUsername: async (username: string, filters?: PostFilters) => {
    try {
      // Check if the input is a MongoDB ObjectId (24 character hex string)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(username);
      
      if (isObjectId) {
        // If it's an ObjectId, use the direct posts endpoint
        const response = await axiosInstance.get(`/posts/user/${username}`, { params: filters });
        return response.data;
      } else {
        // If it's a username, first get the user ID
        const userRes = await axiosInstance.get(`/users`, { params: { search: username, limit: 1 } });
        if (!userRes.data.users || userRes.data.users.length === 0) {
          return { posts: [], pagination: { currentPage: 1, totalPages: 1, totalPosts: 0, hasNextPage: false, hasPrevPage: false } };
        }
        const user = userRes.data.users[0];
        const postsRes = await axiosInstance.get(`/posts/user/${user._id}`, { params: filters });
        return postsRes.data;
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  },
}

// Gifts API
export const giftsAPI = {
  createGift: async (giftData: CreateGiftData): Promise<Gift> => {
    const response = await axiosInstance.post('/gifts', giftData)
    return response.data
  },

  getGifts: async (filters?: GiftFilters): Promise<GiftsResponse> => {
    const response = await axiosInstance.get('/gifts', { params: filters })
    return response.data
  },

  getGift: async (id: string): Promise<Gift> => {
    const response = await axiosInstance.get(`/gifts/${id}`)
    return response.data
  },

  getPostGifts: async (postId: string, page = 1, limit = 10): Promise<GiftsResponse> => {
    const response = await axiosInstance.get(`/gifts/post/${postId}`, {
      params: { page, limit },
    })
    return response.data
  },

  getUserGifts: async (userId: string, type: 'sent' | 'received', page = 1, limit = 10): Promise<GiftsResponse> => {
    const response = await axiosInstance.get(`/gifts/user/${userId}`, {
      params: { type, page, limit },
    })
    return response.data
  },

  getUserGiftStats: async (userId: string): Promise<GiftStats> => {
    const response = await axiosInstance.get(`/gifts/user/${userId}/stats`)
    return response.data
  },

  verifyPayment: async (transactionId: string, paymentId: string): Promise<Gift> => {
    const response = await axiosInstance.post(`/gifts/${transactionId}/verify`, { paymentId })
    return response.data
  },
}

// Leaderboard API
export const leaderboardAPI = {
  getUserLeaderboard: async (filters?: LeaderboardFilters): Promise<LeaderboardResponse> => {
    const response = await axiosInstance.get('/leaderboard/users', { params: filters })
    return response.data
  },

  getPostLeaderboard: async (filters?: LeaderboardFilters): Promise<PostLeaderboardResponse> => {
    const response = await axiosInstance.get('/leaderboard/posts', { params: filters })
    return response.data
  },

  getTrending: async (): Promise<TrendingData> => {
    const response = await axiosInstance.get('/leaderboard/trending')
    return response.data
  },
}

// Users API
export const usersAPI = {
  getUser: async (id: string): Promise<User> => {
    const response = await axiosInstance.get(`/users/${id}`)
    return response.data
  },

  updateUser: async (userData: FormData): Promise<User> => {
    const response = await axiosInstance.put('/users/profile', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadAvatar: async (formData: FormData): Promise<User> => {
    const response = await axiosInstance.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.user
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await axiosInstance.get('/users/search', { params: { q: query } })
    return response.data
  },

  getUserByUsername: async (username: string) => {
    try {
      // Check if the input is a MongoDB ObjectId (24 character hex string)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(username);
      
      if (isObjectId) {
        // If it's an ObjectId, use the direct user endpoint
        const response = await axiosInstance.get(`/users/${username}`);
        return response.data.user;
      } else {
        // If it's a username, use the search endpoint
        const response = await axiosInstance.get(`/users`, { params: { search: username, limit: 1 } });
        if (response.data.users && response.data.users.length > 0) {
          return response.data.users[0];
        }
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  getUserStatsByUsername: async (username: string) => {
    // First, get the user by username
    const userRes = await axiosInstance.get(`/users`, { params: { search: username, limit: 1 } })
    if (!userRes.data.users || userRes.data.users.length === 0) return null
    const user = userRes.data.users[0]
    const statsRes = await axiosInstance.get(`/users/${user._id}/stats`)
    return statsRes.data
  },
}

export default axiosInstance
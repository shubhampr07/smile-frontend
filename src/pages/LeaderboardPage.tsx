import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { leaderboardAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { LeaderboardFilters } from '../types/leaderboard'

const LeaderboardPage = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('weekly')
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users')

  const filters: LeaderboardFilters = {
    timeframe,
    limit: 20,
  }

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['leaderboard', 'users', filters],
    queryFn: () => leaderboardAPI.getUserLeaderboard(filters),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['leaderboard', 'posts', filters],
    queryFn: () => leaderboardAPI.getPostLeaderboard(filters),
  })

  const isLoading = (activeTab === 'users' && usersLoading) || (activeTab === 'posts' && postsLoading)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Leaderboard</h1>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('users')}
            >
              Top Users
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${activeTab === 'posts' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('posts')}
            >
              Top Posts
            </button>
          </div>
        </div>

        {/* Timeframe Filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeframe === 'weekly' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setTimeframe('weekly')}
            >
              This Week
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${timeframe === 'monthly' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setTimeframe('monthly')}
            >
              This Month
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeframe === 'allTime' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setTimeframe('allTime')}
            >
              All Time
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div>
            {activeTab === 'users' && usersData && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Top Gift Recipients
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Users who received the most gifts {timeframe === 'weekly' ? 'this week' : timeframe === 'monthly' ? 'this month' : 'of all time'}
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {usersData.users.map((user, index) => (
                    <li key={user._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <div className="absolute -left-1 -top-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <img className="h-10 w-10 rounded-full object-cover" src={user.avatar || '/default-avatar.png'} alt={user.username} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">₹{user.totalGiftsReceived.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {user.trend > 0 ? (
                              <span className="text-green-600 flex items-center justify-end">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                {user.trend}%
                              </span>
                            ) : user.trend < 0 ? (
                              <span className="text-red-600 flex items-center justify-end">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                {Math.abs(user.trend)}%
                              </span>
                            ) : (
                              <span className="text-gray-500">No change</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'posts' && postsData && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Top Posts
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Posts with the highest engagement {timeframe === 'weekly' ? 'this week' : timeframe === 'monthly' ? 'this month' : 'of all time'}
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {postsData.posts.map((post, index) => (
                    <li key={post._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            <div className="absolute -left-1 -top-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <img className="h-12 w-12 rounded object-cover" src={post.imageUrl} alt="Post thumbnail" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">{post.caption}</div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <img className="h-4 w-4 rounded-full mr-1" src={post.user.avatar || '/default-avatar.png'} alt={post.user.username} />
                              <span>@{post.user.username}</span>
                              <span className="mx-1">•</span>
                              <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">Score: {post.engagementScore.toFixed(1)}</div>
                          <div className="text-xs text-gray-500 flex items-center justify-end space-x-2">
                            <span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {post.likesCount}
                            </span>
                            <span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ₹{post.giftsAmount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardPage
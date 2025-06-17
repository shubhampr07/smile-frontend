import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { postsAPI, leaderboardAPI } from '../services/api'
import { Post } from '../types/post'
import { LeaderboardUser } from '../types/leaderboard'
import PostCard from '../components/Post/PostCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const HomePage = () => {
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest')
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState<Post[]>([])
  const [hasMore, setHasMore] = useState(true)
  
  const { ref, inView } = useInView()

  const { data: leaderboardData } = useQuery(
    ['leaderboard', 'gifts', { period: 'week', limit: 5 }],
    () => leaderboardAPI.getGiftsLeaderboard({ period: 'week', limit: 5 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const { 
    data: postsData, 
    isLoading, 
    isFetching,
    refetch 
  } = useQuery(
    ['posts', sortBy, page],
    () => postsAPI.getPosts({ sort: sortBy, page, limit: 10 }),
    {
      keepPreviousData: true,
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  )

  // Handle sort change
  const handleSortChange = (newSortBy: 'latest' | 'popular' | 'trending') => {
    if (sortBy !== newSortBy) {
      setSortBy(newSortBy)
      setPosts([])
      setPage(1)
      setHasMore(true)
    }
  }

  // Load more posts when scrolling to the bottom
  useEffect(() => {
    if (inView && hasMore && !isFetching) {
      setPage(prev => prev + 1)
    }
  }, [inView, hasMore, isFetching])

  // Update posts when data changes
  useEffect(() => {
    if (postsData) {
      if (page === 1) {
        setPosts(postsData.posts)
      } else {
        setPosts(prev => [...prev, ...postsData.posts])
      }
      setHasMore(postsData.pagination.hasNext)
    }
  }, [postsData, page])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main content */}
        <div className="md:w-2/3">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              {/* <h1 className="text-2xl font-bold text-gray-900">Smile Feed</h1> */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleSortChange('latest')}
                  className={`px-3 py-1 text-sm rounded-full ${sortBy === 'latest' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Latest
                </button>
                <button 
                  onClick={() => handleSortChange('popular')}
                  className={`px-3 py-1 text-sm rounded-full ${sortBy === 'popular' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Popular
                </button>
                <button 
                  onClick={() => handleSortChange('trending')}
                  className={`px-3 py-1 text-sm rounded-full ${sortBy === 'trending' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Trending
                </button>
              </div>
            </div>

            {isLoading && page === 1 ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">No posts found. Be the first to share your smile!</p>
                <Link to="/create" className="btn-primary mt-4">
                  Create Post
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} onUpdate={refetch} />
                ))}
                
                {/* Loading indicator for infinite scroll */}
                {hasMore && (
                  <div ref={ref} className="flex justify-center py-4">
                    {isFetching && <LoadingSpinner />}
                  </div>
                )}
                
                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">You've reached the end!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:w-1/3">
          {/* Weekly Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Weekly Top Gifted</h2>
              <Link to="/leaderboard" className="text-primary-600 text-sm hover:text-primary-700">
                View All
              </Link>
            </div>

            {leaderboardData ? (
              <div className="space-y-4">
                {leaderboardData.users.map((user: LeaderboardUser) => (
                  <Link key={user._id} to={`/user/${user.username}`} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0 relative">
                      <img 
                        src={user.avatar?.url || '/default-avatar.png'} 
                        alt={user.username} 
                        className="avatar avatar-md"
                      />
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full">
                        {user.rank}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-sm font-semibold text-primary-600">₹{user.totalGiftsReceived.toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
          </div>

          {/* App Info */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">About Smile & Gift</h2>
            <p className="text-gray-600 text-sm mb-4">
              Share your smile, receive gifts, and climb the leaderboard! Connect with friends and spread happiness.
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-primary-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="ml-2 text-sm text-gray-600">Post your smiling selfies</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="ml-2 text-sm text-gray-600">Send gifts via UPI</span>
              </div>
              <div className="flex items-center">
                <span className="text-primary-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="ml-2 text-sm text-gray-600">Climb the leaderboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
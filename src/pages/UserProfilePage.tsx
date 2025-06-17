import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { usersAPI, postsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import PostCard from '../components/Post/PostCard'

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts')

  // If username is missing, show error
  if (!username) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-8">The user you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="inline-block bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-dark transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user', username],
    queryFn: () => usersAPI.getUserByUsername(username),
    enabled: !!username,
    retry: 1,
    staleTime: 30000,
  })

  const { data: userPosts, isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: () => postsAPI.getPostsByUsername(username, { page: 1, limit: 20 }),
    enabled: !!username && !!user,
  })

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', username],
    queryFn: () => usersAPI.getUserStatsByUsername(username),
    enabled: !!username && !!user,
  })

  const isLoading = userLoading || postsLoading || statsLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Profile</h2>
          <p className="text-gray-600 mb-8">There was an error loading this user's profile. Please try again later.</p>
          <Link to="/" className="inline-block bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-dark transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-8">The user you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="inline-block bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-dark transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser && (currentUser.username === user.username)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={user.avatar || '/default-avatar.png'} 
                  alt={user.username} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
              <p className="text-gray-600">@{user.username}</p>
              {isOwnProfile && (
                <Link 
                  to="/settings" 
                  className="mt-4 inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>

          {user.bio && (
            <div className="mt-6 text-center sm:text-left">
              <p className="text-gray-800 whitespace-pre-line">{user.bio}</p>
            </div>
          )}

          <div className="mt-6 flex justify-center sm:justify-start space-x-8">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{user.postsCount}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{user.likesCount}</div>
              <div className="text-sm text-gray-600">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">₹{user.giftsReceivedCount || 0}</div>
              <div className="text-sm text-gray-600">Gifts</div>
            </div>
          </div>

          {user.upiId && isOwnProfile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center sm:justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-gray-700">UPI ID: <span className="font-medium">{user.upiId}</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'about'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              About
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'posts' && (
          <div>
            {postsLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : postsError ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <p className="text-red-600 mb-4">Error loading posts. Please try again later.</p>
              </div>
            ) : userPosts && userPosts.posts && userPosts.posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {userPosts.posts.map((post: import('../types/post').Post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {isOwnProfile ? 'You haven\'t posted anything yet' : `${user.username} hasn't posted anything yet`}
                </h3>
                {isOwnProfile && (
                  <div className="mt-6">
                    <Link 
                      to="/post/create" 
                      className="inline-block bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-dark transition-colors"
                    >
                      Create Your First Post
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && userStats && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">User Information</h3>
              <p className="mt-1 text-sm text-gray-500">Personal details and statistics</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900">@{user.username}</dd>
                </div>
                {isOwnProfile && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last active</dt>
                  <dd className="mt-1 text-sm text-gray-900">{format(new Date(user.lastLogin || user.createdAt), 'MMMM d, yyyy')}</dd>
                </div>
                {user.upiId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">UPI ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.upiId}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Gift Statistics */}
            {userStats.giftStats && (
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gift Statistics</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total gifts received</dt>
                    <dd className="mt-1 text-sm text-gray-900">₹{userStats.giftStats.totalReceived.toLocaleString()}</dd>
                  </div>
                  {isOwnProfile && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total gifts sent</dt>
                      <dd className="mt-1 text-sm text-gray-900">₹{userStats.giftStats.totalSent.toLocaleString()}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">This month</dt>
                    <dd className="mt-1 text-sm text-gray-900">₹{userStats.giftStats.monthlyReceived.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Trend</dt>
                    <dd className="mt-1 text-sm flex items-center">
                      {userStats.giftStats.trend > 0 ? (
                        <span className="text-green-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          {userStats.giftStats.trend}% from last month
                        </span>
                      ) : userStats.giftStats.trend < 0 ? (
                        <span className="text-red-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          {Math.abs(userStats.giftStats.trend)}% from last month
                        </span>
                      ) : (
                        <span className="text-gray-500">No change from last month</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Post Statistics */}
            {userStats.postStats && (
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Post Statistics</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total posts</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userStats.postStats.totalPosts}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total likes received</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userStats.postStats.totalLikes}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Average gifts per post</dt>
                    <dd className="mt-1 text-sm text-gray-900">₹{userStats.postStats.avgGiftsPerPost.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Most popular post</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userStats.postStats.mostPopularPost ? (
                        <Link 
                          to={`/post/${userStats.postStats.mostPopularPost._id}`}
                          className="text-primary hover:underline"
                        >
                          View Post
                        </Link>
                      ) : (
                        'No posts yet'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfilePage
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import GiftModal from '../components/Post/GiftModal'

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [showGiftModal, setShowGiftModal] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsAPI.getPost(id!),
  })

  const likeMutation = useMutation({
    mutationFn: () => postsAPI.likePost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] })
    },
    onError: () => {
      toast.error('Failed to like post')
    },
  })

  const commentMutation = useMutation({
    mutationFn: (comment: string) => postsAPI.addComment(id!, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] })
      setComment('')
    },
    onError: () => {
      toast.error('Failed to add comment')
    },
  })

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like posts')
      return
    }
    likeMutation.mutate()
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to comment')
      return
    }
    if (!comment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }
    commentMutation.mutate(comment)
  }

  const handleGift = () => {
    if (!user) {
      toast.error('Please login to send gifts')
      return
    }
    setShowGiftModal(true)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load post</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-500 hover:text-blue-600"
        >
          Go back
        </button>
      </div>
    )
  }

  const post = data.post

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Gift Modal */}
        {showGiftModal && (
          <GiftModal 
            post={post}
            onClose={() => setShowGiftModal(false)}
            onSuccess={() => {
              setShowGiftModal(false)
              queryClient.invalidateQueries({ queryKey: ['post', id] })
            }}
          />
        )}
        {/* Post Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={(post.author?.avatar || post.user?.avatar || '/default-avatar.png')}
                alt={(post.author?.username || post.user?.username || 'User')}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <Link
                  to={`/profile/${post.author?._id || post.user?._id}`}
                  className="text-lg font-semibold hover:text-blue-600"
                >
                  {post.author?.username || post.user?.username || 'User'}
                </Link>
                <p className="text-gray-500 text-sm">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {user?._id === (post.author?._id || post.user?._id) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/posts/${post._id}/edit`)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this post?')) {
                      postsAPI.deletePost(post._id)
                        .then(() => {
                          toast.success('Post deleted successfully')
                          navigate('/')
                        })
                        .catch(() => {
                          toast.error('Failed to delete post')
                        })
                    }
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Image */}
        {post.image && (
          <div className="relative w-full flex justify-center bg-gray-100">
            <img
              src={post.image.url}
              alt={post.title}
              className="max-w-full max-h-[600px] w-auto h-auto"
              style={{ objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Post Content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Post Stats */}
        <div className="px-6 py-4 border-t border-b">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLike}
                className={`text-lg ${
                  post.isLikedByUser ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                ❤️
              </button>
              <span>{post.likesCount} likes</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGift}
                className="text-lg text-gray-500"
              >
                🎁
              </button>
              <span>Gift</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">💬</span>
              <span>{post.commentsCount} comments</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          {user && (
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={commentMutation.isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {commentMutation.isLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
          <div className="space-y-4">
            {(post.comments || []).map((comment) => (
              <div key={comment._id} className="flex space-x-4">
                <img
                  src={comment.author?.avatar || '/default-avatar.png'}
                  alt={comment.author?.username || 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <Link
                      to={`/profile/${comment.author?._id || '#'}`}
                      className="font-semibold hover:text-blue-600"
                    >
                      {comment.author?.username || 'Anonymous User'}
                    </Link>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostDetailPage
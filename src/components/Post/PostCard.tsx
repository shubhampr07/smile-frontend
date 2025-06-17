import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { Post } from '../../types/post'
import { postsAPI } from '../../services/api'
import GiftModal from './GiftModal'

interface PostCardProps {
  post: Post
  onUpdate?: () => void
  showFullContent?: boolean
}

const PostCard = ({ post, onUpdate, showFullContent = false }: PostCardProps) => {
  const { user } = useAuth()
  const [isLiking, setIsLiking] = useState(false)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [currentPost, setCurrentPost] = useState<Post | null>(null)
  const navigate = useNavigate()

  // Check if the current user has liked the post
  const hasLiked = user ? post.isLikedByUser : false

  // Format the date
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  // Defensive fallback for author
  const author = post?.author || post?.user || { username: 'unknown', avatar: '' }

  // Handle like button click
  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }

    try {
      setIsLiking(true)
      await postsAPI.likePost(post._id)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  // Handle gift button click
  const handleGift = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }

    setCurrentPost(post)
    setShowGiftModal(true)
  }

  // Handle comment button click
  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/post/${post._id}`)
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 cursor-pointer"
      onClick={(_e) => {
        // Don't navigate if gift modal is open
        if (!showGiftModal) {
          navigate(`/post/${post._id}`)
        }
      }}
    >
      {/* Post header */}
      <div className="p-4 flex items-center">
        <Link to={`/profile/${author.username}`} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
          <img 
            src={author.avatar || '/default-avatar.png'} 
            alt={author.username} 
            className="avatar avatar-md"
          />
        </Link>
        <div className="ml-3">
          <Link to={`/profile/${author.username}`} className="text-sm font-medium text-gray-900 hover:underline" onClick={e => e.stopPropagation()}>
            {author.username}
          </Link>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* Post image */}
      <div className="relative w-full flex justify-center bg-gray-100" onClick={e => e.stopPropagation()}>
        {post.image?.url && (
          <img 
            src={post.image.url} 
            alt={post.content || 'Post image'} 
            className="max-w-full max-h-[400px] w-auto h-auto object-contain"
          />
        )}
      </div>

      {/* Post content */}
      <div className="p-4">
        {post.content && (
          <p className="text-gray-800 mb-2">
            {showFullContent 
              ? post.content 
              : post.content.length > 100 
                ? `${post.content.substring(0, 100)}...` 
                : post.content
            }
            {!showFullContent && post.content.length > 100 && (
              <span className="text-primary-600 hover:text-primary-700 ml-1">Read more</span>
            )}
          </p>
        )}

        {/* Post stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.likesCount}
            </div>
          </div>
          {/* Removed View Details link since card is clickable */}
        </div>

        {/* Action buttons */}
        <div className="flex mt-4 border-t border-gray-100 pt-4">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors ${hasLiked ? 'text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-1" 
              fill={hasLiked ? 'currentColor' : 'none'} 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Like
          </button>
          <button 
            onClick={handleGift}
            className="flex-1 flex items-center justify-center py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Gift
          </button>
          <button 
            onClick={handleComment}
            className="flex-1 flex items-center justify-center py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comment
          </button>
        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && currentPost && (
        <GiftModal 
          post={currentPost}
          onClose={() => setShowGiftModal(false)}
          onSuccess={() => {
            setShowGiftModal(false)
            if (onUpdate) onUpdate()
          }}
        />
      )}
    </div>
  )
}

export default PostCard
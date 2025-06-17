import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { postsAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { useQueryClient } from '@tanstack/react-query'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const createPostSchema = z.object({
  caption: z.string().min(1, 'Caption is required').max(500, 'Caption cannot exceed 500 characters'),
  location: z.string().max(100, 'Location cannot exceed 100 characters').optional(),
  tags: z.string().max(100, 'Tags cannot exceed 100 characters').optional(),
})

type CreatePostFormData = z.infer<typeof createPostSchema>

const CreatePostPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      caption: '',
      location: '',
      tags: '',
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)

    if (!file) {
      setImagePreview(null)
      setImageFile(null)
      return
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      setImagePreview(null)
      setImageFile(null)
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError('File size is too large. Maximum size is 5MB.')
      setImagePreview(null)
      setImageFile(null)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setImageFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError('File size is too large. Maximum size is 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setImageFile(file)
    setImageError(null)
  }

  const onSubmit = async (data: CreatePostFormData) => {
    if (!imageFile) {
      setImageError('Please upload an image')
      return
    }

    try {
      setIsSubmitting(true)

      // Process tags if provided
      const tagsArray = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : []

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('caption', data.caption)
      if (data.location) formData.append('location', data.location)
      if (tagsArray.length > 0) formData.append('tags', JSON.stringify(tagsArray))

      await postsAPI.createPost(formData)
      
      // Invalidate posts query to trigger a refetch
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      
      toast.success('Post created successfully!')
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create post'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Create New Post</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center ${imageError ? 'border-red-300' : 'border-gray-300'} hover:border-primary transition-colors cursor-pointer`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-80 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImagePreview(null)
                        setImageFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP up to 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>
              {imageError && <p className="mt-1 text-sm text-red-600">{imageError}</p>}
            </div>

            {/* Caption */}
            <div className="mb-6">
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
              <textarea
                id="caption"
                rows={4}
                className={`form-textarea block w-full rounded-md ${errors.caption ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                placeholder="Write a caption for your post..."
                {...register('caption')}
              ></textarea>
              {errors.caption && <p className="mt-1 text-sm text-red-600">{errors.caption.message}</p>}
            </div>

            {/* Location */}
            <div className="mb-6">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="location"
                  className={`form-input block w-full pl-10 rounded-md ${errors.location ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                  placeholder="Add location"
                  {...register('location')}
                />
              </div>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional)</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="tags"
                  className={`form-input block w-full pl-10 rounded-md ${errors.tags ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                  placeholder="Add tags separated by commas (e.g. nature, travel, food)"
                  {...register('tags')}
                />
              </div>
              {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" light className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePostPage
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const userSettingsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
  upiId: z.string().max(50, 'UPI ID cannot exceed 50 characters').optional(),
})

type UserSettingsFormData = z.infer<typeof userSettingsSchema>

const UserSettingsPage = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar
      ? typeof user.avatar === 'string'
        ? user.avatar
        : user.avatar.url
      : null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError, clearErrors } = useForm<any>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      upiId: user?.upiId || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  // Watch password fields to clear them if section is closed
  const currentPassword = watch('currentPassword')
  const newPassword = watch('newPassword')
  const confirmNewPassword = watch('confirmNewPassword')

  // Hide password fields and clear values if section is closed
  if (!showPasswordFields && (currentPassword || newPassword || confirmNewPassword)) {
    setValue('currentPassword', '')
    setValue('newPassword', '')
    setValue('confirmNewPassword', '')
  }

  if (!user) {
    navigate('/login')
    return null
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setAvatarError(null)

    if (!file) return

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError('File size is too large. Maximum size is 2MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setAvatarFile(file)
  }

  const onSubmit = async (data: any) => {
    console.log('onSubmit called', data)
    // Password validation only if section is open
    if (showPasswordFields) {
      if (!data.currentPassword || !data.newPassword || !data.confirmNewPassword) {
        setError('currentPassword', { message: 'All password fields are required to change password' })
        setError('newPassword', { message: 'All password fields are required to change password' })
        setError('confirmNewPassword', { message: 'All password fields are required to change password' })
        return
      }
      if (data.newPassword.length < 6) {
        setError('newPassword', { message: 'Password must be at least 6 characters' })
        return
      }
      if (data.newPassword !== data.confirmNewPassword) {
        setError('confirmNewPassword', { message: 'Passwords do not match' })
        return
      }
    } else {
      // Clear password errors if not changing password
      clearErrors(['currentPassword', 'newPassword', 'confirmNewPassword'])
    }
    try {
      setIsSubmitting(true)

      // First, upload avatar if changed
      if (avatarFile) {
        const avatarFormData = new FormData()
        avatarFormData.append('avatar', avatarFile)
        const avatarUser = await usersAPI.uploadAvatar(avatarFormData)
        updateUser(avatarUser)
        if (avatarUser.avatar) {
          setAvatarPreview(
            typeof avatarUser.avatar === 'string'
              ? avatarUser.avatar
              : avatarUser.avatar.url
          )
        }
      }

      // Then update profile information
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('username', data.username)
      formData.append('email', data.email)
      if (data.bio) formData.append('bio', data.bio)
      if (data.upiId) formData.append('upiId', data.upiId)
      
      // Add password fields if user is changing password
      if (showPasswordFields && data.currentPassword && data.newPassword) {
        formData.append('currentPassword', data.currentPassword)
        formData.append('newPassword', data.newPassword)
      }

      const updatedUser = await usersAPI.updateUser(formData)
      updateUser(updatedUser)
      toast.success('Profile updated successfully!')
      navigate(`/user/${updatedUser.username}`)
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Account Settings</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              {/* Avatar Upload */}
              <div className="mb-6 flex flex-col items-center">
                <div className="mb-4">
                  <div className="relative">
                    <img
                      src={avatarPreview || '/default-avatar.png'}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md hover:bg-primary-dark transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                </div>
                {avatarError && <p className="text-sm text-red-600">{avatarError}</p>}
                <p className="text-xs text-gray-500">Click the camera icon to change your profile picture</p>
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className={`form-input block w-full rounded-md ${errors.fullName ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                  {...register('fullName')}
                />
                {typeof errors.fullName?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
              </div>

              {/* Username */}
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">@</span>
                  </div>
                  <input
                    type="text"
                    id="username"
                    className={`form-input block w-full pl-8 rounded-md ${errors.username ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                    {...register('username')}
                  />
                </div>
                {typeof errors.username?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  className={`form-input block w-full rounded-md ${errors.email ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                  {...register('email')}
                />
                {typeof errors.email?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              {/* Bio */}
              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio (Optional)</label>
                <textarea
                  id="bio"
                  rows={3}
                  className={`form-textarea block w-full rounded-md ${errors.bio ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                  placeholder="Tell us a little about yourself..."
                  {...register('bio')}
                ></textarea>
                {typeof errors.bio?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
                <p className="mt-1 text-xs text-gray-500 text-right">{user.bio?.length || 0}/200</p>
              </div>

              {/* UPI ID */}
              <div className="mb-4">
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">UPI ID (Optional)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="upiId"
                    className={`form-input block w-full pl-10 rounded-md ${errors.upiId ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                    placeholder="yourname@upi"
                    {...register('upiId')}
                  />
                </div>
                {typeof errors.upiId?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.upiId.message}</p>}
                <p className="mt-1 text-xs text-gray-500">This is required to receive gifts from other users</p>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>
              {!showPasswordFields ? (
                <button
                  type="button"
                  className="btn-secondary mb-4"
                  onClick={() => setShowPasswordFields(true)}
                >
                  Change Password
                </button>
              ) : (
                <>
                  <div className="mb-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      className={`form-input block w-full rounded-md ${errors.currentPassword ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                      {...register('currentPassword')}
                    />
                    {typeof errors.currentPassword?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      className={`form-input block w-full rounded-md ${errors.newPassword ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                      {...register('newPassword')}
                    />
                    {typeof errors.newPassword?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      className={`form-input block w-full rounded-md ${errors.confirmNewPassword ? 'border-red-300 focus:border-red-300 focus:ring-red-300' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                      {...register('confirmNewPassword')}
                    />
                    {typeof errors.confirmNewPassword?.message === 'string' && <p className="mt-1 text-sm text-red-600">{errors.confirmNewPassword.message}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary mb-4"
                    onClick={() => setShowPasswordFields(false)}
                  >
                    Cancel Password Change
                  </button>
                </>
              )}
              <p className="text-sm text-gray-500 mb-4">Leave this section closed if you don't want to change your password</p>
            </div>

            {/* Submit Buttons */}
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
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
            <p className="text-sm text-gray-500 mb-4">These actions are irreversible. Please proceed with caution.</p>

            <div className="flex flex-col space-y-4">
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to deactivate your account? You can reactivate it later by logging in.')) {
                    // Implement account deactivation
                    toast.error('Account deactivation is not implemented yet')
                  }
                }}
              >
                Deactivate Account
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
                    // Implement account deletion
                    toast.error('Account deletion is not implemented yet')
                  }
                }}
              >
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSettingsPage
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Post } from '../../types/post'
import { giftsAPI } from '../../services/api'
import toast from 'react-hot-toast'

interface GiftModalProps {
  post: Post
  onClose: () => void
  onSuccess: () => void
}

const giftSchema = z.object({
  amount: z
    .number()
    .min(1, 'Amount must be at least ₹1')
    .max(10000, 'Amount cannot exceed ₹10,000')
    .refine((val: number) => !isNaN(val), { message: 'Amount is required' }),
  message: z.string().max(100, 'Message cannot exceed 100 characters').optional(),
})

type GiftFormData = z.infer<typeof giftSchema>

// Function to detect if user is on a mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const GiftModal = ({ post, onClose, onSuccess }: GiftModalProps) => {
  const [_isSubmitting, setIsSubmitting] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [isMobile] = useState(isMobileDevice())

  const { register, handleSubmit, formState: { errors }, watch } = useForm<GiftFormData>({
    resolver: zodResolver(giftSchema),
    defaultValues: {
      amount: 10,
      message: '',
    },
  })

  const amount = watch('amount')

  // Generate UPI payment link
  const getUpiLink = (amount: number) => {
    const upiId = post.user?.upiId || 'example@upi'
    const note = `Gift for ${post.user?.username}'s post on Smile & Gift`
    
    // Format the UPI link according to the standard format
    // This will open the UPI app selector on the device with prefilled values
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(post.user?.fullName || '')}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
  }

  const handleProceedToPayment = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    
    if (!amount || isNaN(amount) || amount < 1) {
      toast.error('Please enter a valid amount')
      return
    }
    
    // Check if user is on a desktop device
    if (!isMobile) {
      toast.error('UPI payments can only be made from mobile devices. Please open this page on your mobile phone to proceed with payment.')
      return
    }
    
    // Generate a random transaction ID for demo purposes
    // In a real app, this would come from the payment gateway
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setTransactionId(randomId)
    
    // Open UPI app with the payment link
    window.location.href = getUpiLink(amount)
  }

  const onSubmit = async (data: GiftFormData) => {
    try {
      setIsSubmitting(true)
      await giftsAPI.createGift({
        postId: post._id,
        amount: data.amount,
        transactionId: transactionId || 'manual-entry-required',
        message: data.message,
      })
      toast.success('Gift sent successfully!')
      onSuccess()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send gift'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Send a Gift</h3>

                {!isMobile && (
                  <div className="mt-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                    <p className="text-sm">⚠️ UPI payments can only be made from mobile devices. Please open this page on your mobile phone to proceed with payment.</p>
                  </div>
                )}

                <div className="mt-4">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Recipient:</span>
                        <span className="font-medium">{post.user?.fullName}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">UPI ID:</span>
                        <span className="font-medium">{post.user?.upiId || 'Not available'}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="amount" className="form-label">Amount (₹)</label>
                      <input
                        type="number"
                        id="amount"
                        className="form-input"
                        min={1}
                        {...register('amount', { valueAsNumber: true })}
                      />
                      {errors.amount && <p className="form-error">{errors.amount.message}</p>}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="message" className="form-label">Message (Optional)</label>
                      <textarea
                        id="message"
                        rows={3}
                        className="form-textarea"
                        placeholder="Add a message with your gift..."
                        {...register('message')}
                      ></textarea>
                      {errors.message && <p className="form-error">{errors.message.message}</p>}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleProceedToPayment}
                        disabled={!isMobile}
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GiftModal
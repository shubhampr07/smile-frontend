import React from 'react'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  className?: string
  light?: boolean
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  light = false,
}) => {
  const sizeClass = sizeMap[size]
  const colorClass = light ? 'border-white border-t-transparent' : 'border-gray-300 border-t-primary-600'

  return (
    <div className={`spinner ${sizeClass} ${colorClass} ${className}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default LoadingSpinner
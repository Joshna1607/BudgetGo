import React from 'react'
import './Logo.css'

const Logo = ({ size = 'medium', showText = true, className = '' }) => {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  }

  return (
    <div className={`logo-container ${sizeClasses[size]} ${className}`}>
      <div className="logo-icon">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background Circle */}
          <circle cx="60" cy="60" r="55" fill="url(#gradient1)" />

          {/* Map Pin */}
          <path
            d="M60 20C45.64 20 34 31.64 34 46C34 60 60 85 60 85C60 85 86 60 86 46C86 31.64 74.36 20 60 20Z"
            fill="white"
            stroke="url(#gradient2)"
            strokeWidth="2"
          />
          <circle cx="60" cy="46" r="8" fill="url(#gradient2)" />

          {/* Rupee Symbol */}
          <path
            d="M45 55L55 55L55 50L50 50L50 45L55 45L55 40L60 40L60 45L65 45L65 50L60 50L60 55L70 55L70 60L60 60L60 65L55 65L55 70L50 70L50 65L45 65L45 60L50 60L50 55L45 55Z"
            fill="url(#gradient2)"
          />

          {/* Budget Lines/Chart */}
          <path
            d="M30 75L40 70L50 80L60 65L70 75L80 70L90 85"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="30" cy="75" r="2" fill="white" />
          <circle cx="40" cy="70" r="2" fill="white" />
          <circle cx="50" cy="80" r="2" fill="white" />
          <circle cx="60" cy="65" r="2" fill="white" />
          <circle cx="70" cy="75" r="2" fill="white" />
          <circle cx="80" cy="70" r="2" fill="white" />
          <circle cx="90" cy="85" r="2" fill="white" />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#764ba2" />
              <stop offset="100%" stopColor="#667eea" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <div className="logo-text">
          <span className="logo-text-main">Budget</span>
          <span className="logo-text-go">Go</span>
        </div>
      )}
    </div>
  )
}

export default Logo


import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const OAuthCallback = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { loginWithToken } = useAuth()

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const token = params.get('token')
        const error = params.get('error')

        if (token) {
            if (loginWithToken) {
                loginWithToken(token)
                // Force full reload to ensure AuthContext picks up everything cleanly
                window.location.href = '/dashboard'
            } else {
                // Fallback if context not updated yet
                localStorage.setItem('token', token)
                // Force reload or redirect
                window.location.href = '/dashboard'
            }
        } else {
            console.error('OAuth Error:', error)
            navigate('/login?error=OAuthFailed')
        }
    }, [location, navigate, loginWithToken])

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column'
        }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>Authenticating with Google...</p>
        </div>
    )
}

export default OAuthCallback

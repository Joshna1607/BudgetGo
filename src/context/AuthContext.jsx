import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../config/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token and user on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const result = await api.request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Login failed' }
      }

      // Backend returns: { id, name, email, role, token } or nested { user: {...}, token: ... }
      let userData, authToken
      if (result.data.user) {
        // Registration response with nested user
        userData = result.data.user
        authToken = result.data.token || result.data.user.token
      } else {
        // Direct response
        const { id, name, email: userEmail, role, token: tokenFromData } = result.data
        userData = {
          id,
          name,
          email: userEmail,
          role: role || 'user'
        }
        authToken = tokenFromData
      }

      setToken(authToken)
      setUser(userData)
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')

      return { success: true, user: userData, tripId: result.data.tripId }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed. Please check if the backend is running.' }
    }
  }

  const register = async (name, email, password, role = 'user', otp) => {
    try {
      const result = await api.request('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, otp }),
        skipAuth: true
      })

      if (!result.success) {
        return { success: false, error: result.error || 'Registration failed' }
      }

      // Backend returns: { id, name, email, role, token } or nested { user: {...}, tripId, message }
      let userData, authToken

      if (result.data.user) {
        // Response with nested user (when invitation token is present)
        const userObj = result.data.user
        userData = {
          id: userObj.id,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role || 'user'
        }
        authToken = userObj.token || result.data.token
      } else {
        // Direct response
        const { id, name: userName, email: userEmail, role: userRole, token: tokenFromData } = result.data
        userData = {
          id,
          name: userName,
          email: userEmail,
          role: userRole || 'user'
        }
        authToken = tokenFromData
      }

      // Store user data and token for auto-login
      setToken(authToken)
      setUser(userData)
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')

      return { success: true, user: userData, tripId: result.data.tripId }
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed. Please check if the backend is running.' }
    }
  }

  const loginDemo = (demoUser) => {
    setToken('demo-token')
    setUser(demoUser)
    localStorage.setItem('token', 'demo-token')
    localStorage.setItem('user', JSON.stringify(demoUser))
    localStorage.setItem('isAuthenticated', 'true')
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const loginWithToken = async (token) => {
    localStorage.setItem('token', token)
    setToken(token)
    // Fetch user profile immediately
    try {
      // We assume an endpoint /api/users/profile exists (or /me) 
      // If not, we might need to rely on what OAuth callback passed or fetch from a known endpoint.
      // Assuming /api/auth/me or similar is common, but looking at AuthController I don't see it?
      // Let's rely on basic validation if no endpoint, or better, try to fetch user info.

      // Actually, let's use a safe endpoint or just set authenticated for now if token is valid (JWT expiry check?)
      // But the previous implementation logic was trying to fetch profile.
      // Let's assume the success handler passed a role too?
      // For now, let's just Decode the token client side? Or trust it.

      // Better: Use `api` to fetch something that requires auth.
      // Let's try fetching `/trips` (as per fetching default trip in Chat.jsx).
      // Or if there is a `/users/{id}` endpoint.
      // But we don't have ID yet.

      // Wait, `OAuthCallback` can just decode the JWT if we had a library?
      // Or the backend can return user info in the redirect URL? Security risk?
      // The Plan said: Redirects to Frontend `url?token=XYZ&role=USER`.

      // OAuth2SuccessHandler sends token & role.
      // So we might not need to fetch profile immediately if we trust the role param, 
      // OR we decode the token (it usually has sub=email).

      // For robustness, let's just Set Token. The Layout/App might fetch user data if missing.
      // But `user` state needs to be populated.

      // Let's create a minimal user object from what we have or placeholder.
      const urlParams = new URLSearchParams(window.location.search);
      const role = urlParams.get('role') || 'user';
      const name = urlParams.get('name') ? decodeURIComponent(urlParams.get('name')) : 'Google User';
      const email = urlParams.get('email') ? decodeURIComponent(urlParams.get('email')) : 'google@user.com';
      const id = urlParams.get('id');

      const minimalUser = {
        id: id,
        name: name,
        email: email,
        role: role
      }

      setUser(minimalUser)
      localStorage.setItem('user', JSON.stringify(minimalUser))
      localStorage.setItem('isAuthenticated', 'true')

      return { success: true }
    } catch (e) {
      console.error("Failed to login with token", e)
      return { success: false }
    }
  }

  const value = {
    user,
    token,
    login,
    loginDemo,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    loginWithToken,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

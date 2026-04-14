import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { FiMail, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import './InviteAccept.css'

const InviteAccept = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [registerLoading, setRegisterLoading] = useState(false)

  useEffect(() => {
    if (token) {
      loadInvitation()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [token])

  const loadInvitation = async () => {
    try {
      const result = await api.get(`/invitations/token/${token}`)
      if (result.success) {
        setInvitation(result.data)
        // If user is already logged in and email matches, auto-accept
        if (user && user.email && user.email.toLowerCase() === result.data.email.toLowerCase()) {
          acceptInvitation()
        } else if (user) {
          setError('This invitation is for a different email address. Please logout and register with the invited email.')
        } else {
          setShowRegister(result.data.email)
          setFormData(prev => ({ ...prev, email: result.data.email }))
        }
      } else {
        setError(result.error || 'Invalid invitation link')
      }
    } catch (err) {
      setError('Failed to load invitation. Please check your link.')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!invitation) return

    try {
      const result = await api.post('/invitations/accept', {
        token: token,
        email: invitation.email
      })

      if (result.success) {
        navigate(`/dashboard`)
      } else {
        setError(result.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError('Failed to accept invitation. Please try again.')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.email.toLowerCase() !== invitation.email.toLowerCase()) {
      setError('Email must match the invitation email')
      return
    }

    setRegisterLoading(true)

    try {
      const result = await api.post('/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        invitationToken: token
      })

      if (result.success) {
        // Auto login after registration
        const loginResult = await login(formData.email, formData.password)
        if (loginResult.success) {
          navigate('/dashboard')
        } else {
          setError('Registration successful. Please login.')
          navigate('/login')
        }
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setRegisterLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="invite-accept">
        <div className="loading-container">
          <FiLoader className="spinner" />
          <p>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="invite-accept">
        <div className="error-container">
          <FiAlertCircle />
          <h2>Invalid Invitation</h2>
          <p>{error}</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="invite-accept">
      <div className="invite-container">
        <div className="invite-header">
          <FiMail className="invite-icon" />
          <h1>You've been invited!</h1>
          <p>{invitation.invitedBy} has invited you to join the trip: <strong>{invitation.tripName}</strong></p>
        </div>

        {error && (
          <div className="alert alert-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        {showRegister && !user && (
          <div className="register-form card">
            <h2>Create Your Account</h2>
            <p>Register to join this trip</p>
            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  disabled
                />
                <small>This email is pre-filled from your invitation</small>
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={registerLoading}>
                {registerLoading ? 'Creating Account...' : 'Register & Join Trip'}
              </button>
            </form>
            <p className="login-link">
              Already have an account? <Link to={`/login?invite=${token}`}>Login here</Link>
            </p>
          </div>
        )}

        {user && user.email.toLowerCase() === invitation.email.toLowerCase() && (
          <div className="accept-section">
            <p>You're logged in as {user.email}</p>
            <button onClick={acceptInvitation} className="btn btn-primary btn-full">
              <FiCheckCircle /> Accept Invitation & Join Trip
            </button>
          </div>
        )}

        {user && user.email.toLowerCase() !== invitation.email.toLowerCase() && (
          <div className="error-container">
            <FiAlertCircle />
            <p>This invitation is for {invitation.email}, but you're logged in as {user.email}</p>
            <Link to="/login" className="btn btn-secondary">Logout</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default InviteAccept


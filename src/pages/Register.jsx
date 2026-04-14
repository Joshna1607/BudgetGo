import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { validateEmail } from '../utils/emailUtils'
import './Login.css'

const Register = () => {
  const [searchParams] = useSearchParams()
  const invitationToken = searchParams.get('invite')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register, login } = useAuth()
  const [result, setResult] = useState(null)

  useEffect(() => {
    // Load invitation details if token exists
    if (invitationToken) {
      loadInvitationDetails()
    }
  }, [invitationToken])

  const loadInvitationDetails = async () => {
    try {
      const api = (await import('../config/api')).default
      const result = await api.get(`/invitations/token/${invitationToken}`)
      if (result.success) {
        setFormData(prev => ({ ...prev, email: result.data.email }))
      }
    } catch (err) {
      console.error('Failed to load invitation:', err)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')


    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Email validation using shared utility
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      setError(emailValidation.error)
      return
    }

    // OTP Validation Removed
    /*
    if (!invitationToken && !formData.otp) {
      setError('Please verify your email with OTP')
      return
    }
    */

    setLoading(true)

    const registerResult = await register(
      formData.name,
      formData.email,
      formData.password,
      'user',
      formData.otp
    )

    setResult(registerResult)

    if (registerResult.success) {
      // Auto-login successful - user is already logged in
      // Show success message briefly, then navigate
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } else {
      setError(registerResult.error || 'Registration failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Logo size="large" showText={true} />
            <p>Create your account</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={!!invitationToken}
                  style={{ flex: 1 }}
                />
                {!invitationToken && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={async () => {
                      if (!formData.email) {
                        setError("Please enter email first");
                        return;
                      }
                      try {
                        const api = (await import('../config/api')).default;
                        const res = await api.post('/send-otp', { email: formData.email });
                        if (res.success || res.message) alert("OTP Sent!");
                        else setError(res.error || "Failed to send OTP");
                      } catch (e) {
                        setError("Failed to send OTP");
                      }
                    }}
                    style={{ padding: '0 15px', whiteSpace: 'nowrap' }}
                  >
                    Send OTP
                  </button>
                )}
              </div>
              {invitationToken && (
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Email is pre-filled from your invitation
                </small>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="otp">OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp || ''}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>
            {error && (
              <div className="error-message" style={{
                color: '#dc3545',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#f8d7da',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            {result && result.success && (
              <div className="success-message" style={{
                color: '#28a745',
                padding: '10px',
                marginTop: '10px',
                backgroundColor: '#d4edda',
                borderRadius: '4px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                ✓ Account created successfully! You are now logged in.
              </div>
            )}
            <div className="login-footer">
              <Link to="/login" className="link">Already have an account? Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register


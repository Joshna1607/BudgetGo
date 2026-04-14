import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { DEMO_USER } from '../data/demoData'
import { validateEmail } from '../utils/emailUtils'
import './Login.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginDemo } = useAuth()

  const from = location.state?.from?.pathname

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

    // Email validation
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      setError(emailValidation.error)
      return
    }

    setLoading(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      const role = result.user?.role?.toLowerCase()
      const fallback = role === 'admin' ? '/admin' : '/dashboard'
      navigate(from || fallback, { replace: true })
    } else {
      setError(result.error || 'Login failed. Please try again.')
    }
    setLoading(false)
  }

  const handleDemoLogin = () => {
    if (loginDemo) {
      loginDemo(DEMO_USER)
      navigate('/dashboard')
    } else {
      setError('Demo login not available. Please refresh.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Logo size="large" showText={true} />
            <p>Your Smart Trip Planner</p>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="social-login" style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn btn-google btn-full"
                onClick={() => window.location.href = 'http://localhost:4001/oauth2/authorization/google'}
                style={{
                  backgroundColor: '#fff',
                  color: '#757575',
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '10px'
                }}
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                Continue with Google
              </button>
            </div>

            <div className="divider" style={{ margin: '1rem 0', textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>OR</div>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleDemoLogin}
              style={{ backgroundColor: '#fff', color: '#333', border: '1px solid #ccc' }}
            >
              🚀 Try Demo Account
            </button>

            <div className="login-footer">
              <Link to="/forgot-password" className="link">Forgot Password?</Link>
              <Link to="/register" className="link">Don't have an account? Sign Up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login


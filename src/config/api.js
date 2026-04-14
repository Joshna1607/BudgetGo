// API Configuration
const API_BASE_URL = '/api'

export const api = {
  baseURL: API_BASE_URL,

  // Auth endpoints
  login: `${API_BASE_URL}/login`,
  register: `${API_BASE_URL}/register`,
  sendOtp: `${API_BASE_URL}/auth/send-otp`,

  // Helper function to make API calls
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available, unless skipAuth is requested
    const token = localStorage.getItem('token')
    if (token && !options.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Handle body serialization
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)

      // Handle empty responses or non-JSON responses
      const text = await response.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        // If response is not JSON, use text as data or error message
        data = { error: text || response.statusText }
      }

      if (!response.ok) {
        // Backend returns error in { error: "message" } format
        const errorMessage = data.error || `HTTP error! status: ${response.status}`
        return { success: false, error: errorMessage }
      }

      // Backend returns data directly (e.g., LoginResponse object or array)
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Network error. Please check if the backend is running on port 4000.'
      }
    }
  },

  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  },

  async post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body })
  },

  async put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body })
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

export default api


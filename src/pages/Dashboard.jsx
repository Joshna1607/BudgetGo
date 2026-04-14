import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiPlusCircle, FiCalendar, FiDollarSign, FiMapPin, FiMap, FiAlertTriangle, FiX, FiTrash2 } from 'react-icons/fi'
import { formatINR, formatINRNumber } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import './Dashboard.css'


const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState([])
  const [expenses, setExpenses] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'ADMIN')) {
      navigate('/admin')
      return
    }
    loadData()
  }, [user, navigate])

  const loadData = async () => {
    if (!user || !user.id) {
      setLoading(false)
      return
    }

    // DEMO MODE CHECK
    if (user.isDemo) {
      const { DEMO_DATA } = await import('../data/demoData')
      setTrips(DEMO_DATA.trips)
      setExpenses(DEMO_DATA.expenses)
      if (DEMO_DATA.trips.length > 0) {
        setActiveTrip(DEMO_DATA.trips[0])
      }
      setLoading(false)
      return
    }

    try {
      // Load trips
      const tripsResult = await api.get(`/trips?userId=${user.id}`)
      if (tripsResult.success) {
        setTrips(tripsResult.data || [])
        if (tripsResult.data && tripsResult.data.length > 0) {
          setActiveTrip(tripsResult.data[0])
        }
      }

      // Load expenses
      const expensesResult = await api.get(`/expenses?userId=${user.id}`)
      if (expensesResult.success) {
        setExpenses(expensesResult.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total spent from expenses
  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

  // Calculate budget health
  const remainingBudget = activeTrip ? (activeTrip.budget || 0) - totalSpent : 0
  const budgetPercentage = activeTrip && activeTrip.budget ? (totalSpent / activeTrip.budget) * 100 : 0
  const daysRemaining = activeTrip && activeTrip.endDate
    ? Math.ceil((new Date(activeTrip.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0
  const dailyBudget = daysRemaining > 0 ? remainingBudget / daysRemaining : 0

  // Get budget health color
  const getBudgetColor = () => {
    if (budgetPercentage >= 90) return '#dc3545' // Red - Critical
    if (budgetPercentage >= 70) return '#ffc107' // Yellow - Warning
    if (budgetPercentage >= 50) return '#ff9800' // Orange - Caution
    return '#28a745' // Green - Good
  }

  // Check for budget warnings
  useEffect(() => {
    if (!activeTrip) return

    const newNotifications = []

    // Check for overall budget warning
    if (budgetPercentage >= 80) {
      newNotifications.push({
        id: 'overall-budget-warning',
        type: 'warning',
        message: `💰 Budget Alert: You've used ${budgetPercentage.toFixed(0)}% of your trip budget. Only ${formatINR(remainingBudget)} remaining.`,
        timestamp: new Date()
      })
    }

    setNotifications(newNotifications)
  }, [budgetPercentage, remainingBudget, activeTrip])

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const handleTripClick = (tripId) => {
    const trip = trips.find(t => t.id === tripId)
    if (trip) {
      setActiveTrip(trip)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDeleteTrip = async (e, tripId) => {
    e.stopPropagation()
    if (!window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) return

    try {
      // Optimistic update
      const newTrips = trips.filter(t => t.id !== tripId)
      setTrips(newTrips)

      if (activeTrip && activeTrip.id === tripId) {
        setActiveTrip(newTrips.length > 0 ? newTrips[0] : null)
      }

      await api.delete(`/trips/${tripId}`)
    } catch (error) {
      console.error("Failed to delete trip:", error)
      alert("Failed to delete trip")
      loadData() // Revert on failure
    }
  }

  const stats = [
    { label: 'Total Trips', value: trips.length.toString(), icon: FiMapPin, color: '#667eea' },
    { label: 'Upcoming Trips', value: trips.filter(t => t.status === 'Planning' || t.status === 'Upcoming').length.toString(), icon: FiCalendar, color: '#28a745' },
    { label: 'Total Spent', value: formatINR(totalSpent), icon: FiDollarSign, color: '#dc3545' },
    { label: 'Active Plans', value: trips.filter(t => t.status === 'Planning').length.toString(), icon: FiPlusCircle, color: '#ffc107' },
  ]

  const recentTrips = trips.slice(0, 5).map(trip => ({
    id: trip.id,
    name: trip.tripName,
    date: trip.startDate,
    status: trip.status || 'Planning',
    budget: formatINR(trip.budget || 0)
  }))

  if (loading) {
    return (
      <div className="dashboard">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name || 'Traveler'}! 👋</h1>
        <p>Here's an overview of your trips and expenses</p>
      </div>

      {/* Budget Health Bar */}
      {activeTrip && (
        <div className="budget-health-card">
          <div className="budget-header">
            <div>
              <h2>Budget Health - {activeTrip.tripName}</h2>
              <p className="budget-subtitle">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Trip completed'}
              </p>
            </div>
            <div className="budget-amounts">
              <div className="budget-remaining">
                <span className="budget-label">Remaining</span>
                <span className="budget-value" style={{ color: getBudgetColor() }}>
                  {formatINR(remainingBudget)}
                </span>
              </div>
            </div>
          </div>

          <div className="budget-progress-container">
            <div className="budget-progress-bar">
              <div
                className="budget-progress-fill"
                style={{
                  width: `${Math.min(budgetPercentage, 100)}%`,
                  backgroundColor: getBudgetColor()
                }}
              ></div>
            </div>
            <div className="budget-stats">
              <span>Spent: {formatINR(totalSpent)}</span>
              <span>Budget: {formatINR(activeTrip.budget || 0)}</span>
              <span className="budget-percentage">{budgetPercentage.toFixed(1)}%</span>
            </div>
          </div>

          {dailyBudget > 0 && (
            <div className="daily-budget-info">
              <span>Recommended daily budget: <strong>{formatINR(dailyBudget)}/day</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification notification-${notification.type}`}>
              <div className="notification-icon">
                <FiAlertTriangle />
              </div>
              <div className="notification-content">
                <p>{notification.message}</p>
              </div>
              <button
                className="notification-close"
                onClick={() => dismissNotification(notification.id)}
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                <Icon />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Expenses */}
      {expenses.length > 0 && (
        <div className="daily-spending-card">
          <h3>Recent Expenses</h3>
          <div className="daily-spending-list">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="daily-spending-item">
                <div className="daily-spending-header">
                  <div className="daily-date">
                    <FiCalendar />
                    <span>{new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="daily-amounts">
                    <span className="daily-spent">{formatINR(expense.amount)}</span>
                    <span className="daily-budget" style={{ fontSize: '0.875rem', color: '#666' }}>
                      {expense.category}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                  {expense.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Trips</h2>
            <Link to="/trip-creation" className="btn btn-primary">
              <FiPlusCircle /> Create New Trip
            </Link>
          </div>
          <div className="trips-list">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className={`trip-card ${activeTrip && activeTrip.id === trip.id ? 'active-trip' : ''}`}
                onClick={() => handleTripClick(trip.id)}
                style={{ cursor: 'pointer', border: activeTrip && activeTrip.id === trip.id ? '2px solid #667eea' : '1px solid #eee' }}
              >
                <div className="trip-info">
                  <h3>{trip.name}</h3>
                  <p className="trip-date">{trip.date}</p>
                </div>
                <div className="trip-meta">
                  <span className={`status-badge status-${trip.status.toLowerCase()}`}>
                    {trip.status}
                  </span>
                  <span className="trip-budget">{trip.budget}</span>
                  <button
                    className="delete-trip-btn"
                    onClick={(e) => handleDeleteTrip(e, trip.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      padding: '4px',
                      marginLeft: '8px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Delete Trip"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/trip-creation" className="action-card">
              <FiPlusCircle />
              <span>Create Trip</span>
            </Link>
            <Link to="/expense-manager" className="action-card">
              <FiDollarSign />
              <span>Add Expense</span>
            </Link>
            <Link to="/itinerary" className="action-card">
              <FiCalendar />
              <span>View Itinerary</span>
            </Link>
            <Link to="/booking" className="action-card">
              <FiMapPin />
              <span>Bookings</span>
            </Link>
            <Link to="/nearby-locations" className="action-card">
              <FiMap />
              <span>Nearby Places</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard



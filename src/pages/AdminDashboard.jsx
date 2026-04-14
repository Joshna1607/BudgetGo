import React, { useState, useEffect } from 'react'
import { FiUsers, FiMapPin, FiDollarSign, FiCreditCard, FiTrendingUp, FiShield } from 'react-icons/fi'
import { formatINR } from '../utils/currency'
import api from '../config/api'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    totalBookings: 0,
    totalRevenue: 0
  })
  const [users, setUsers] = useState([])
  const [trips, setTrips] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/admin/stats');
      if (statsRes.success) {
        setStats({
          totalUsers: statsRes.data.totalUsers || 0,
          totalTrips: statsRes.data.totalTrips || 0,
          totalBookings: statsRes.data.totalBookings || 0,
          totalRevenue: statsRes.data.totalRevenue || 0
        });
      } else {
        throw new Error(statsRes.error || 'Failed to fetch stats');
      }

      // 2. Fetch Users
      const usersRes = await api.get('/admin/users');
      if (usersRes.success) {
        setUsers(usersRes.data);
      } else {
        console.warn("Failed to fetch users", usersRes.error);
      }

      // 3. Fetch Trips
      const tripsRes = await api.get('/admin/trips');
      if (tripsRes.success) {
        setTrips(tripsRes.data);
      } else {
        // If this specific endpoint fails (e.g. 404 because server old), we should know
        console.warn("Failed to fetch trips", tripsRes.error);
        if (tripsRes.error && tripsRes.error.includes("404")) {
          throw new Error("Backend endpoints missing. Please restart the server.");
        }
      }

    } catch (error) {
      console.error("Failed to load admin data", error);
      setError(error.message || "Failed to load dashboard data. Is the backend running?");
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'block' : 'activate'} this user?`)) {
      try {
        const result = await api.put(`/admin/users/${userId}/status`);
        if (result.success) {
          // Update local state
          setUsers(users.map(u => u.id === userId ? { ...u, active: result.active } : u));
          alert('User status updated successfully');
        } else {
          alert('Failed to update status');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred');
      }
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to DELETE this user? This action cannot be undone.')) {
      try {
        const result = await api.delete(`/admin/users/${userId}`);
        if (result.success) {
          setUsers(users.filter(u => u.id !== userId));
          alert('User deleted successfully');
        } else {
          alert('Failed to delete user');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred');
      }
    }
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: '#667eea'
    },
    {
      label: 'Total Trips',
      value: stats.totalTrips,
      icon: FiMapPin,
      color: '#28a745'
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: FiCreditCard,
      color: '#ffc107'
    },
    {
      label: 'Total Revenue',
      value: formatINR(stats.totalRevenue),
      icon: FiDollarSign,
      color: '#dc3545'
    },
  ]

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <h1>
            <FiShield /> Admin Dashboard
          </h1>
          <p>Manage users, trips, bookings, and system activities</p>
        </div>
        <button onClick={loadAdminData} className="btn btn-primary" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1rem 0', padding: '1rem', background: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tab ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          Trips
        </button>
        <button
          className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={`admin-tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="admin-content">
          <div className="stats-grid">
            {statCards.map((stat, index) => {
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

          <div className="analytics-sections" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3><FiTrendingUp /> Popular Destinations</h3>
              <div style={{ marginTop: '1rem' }}>
                {/* Mocked Popular Destinations based on Trips Data */}
                {Object.entries(trips.reduce((acc, trip) => {
                  acc[trip.destination] = (acc[trip.destination] || 0) + 1;
                  return acc;
                }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([dest, count], idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <span>{dest}</span>
                    <span style={{ fontWeight: 'bold' }}>{count} trips</span>
                  </div>
                ))}
                {trips.length === 0 && <p style={{ color: '#888' }}>No trip data available yet.</p>}
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3><FiCreditCard /> Revenue Overview</h3>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ color: '#666' }}>Monthly Revenue Chart Placeholder</p>
                {/* In a real app, use Recharts or Chart.js here */}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="admin-section card">
            <h2>All Users</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.active ? 'status-active' : 'status-blocked'}`}
                          style={{
                            background: user.active ? '#d4edda' : '#f8d7da',
                            color: user.active ? '#155724' : '#721c24',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}>
                          {user.active ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                      <td>{new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.active)}
                            className="action-btn"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              background: user.active ? '#ffc107' : '#28a745',
                              color: user.active ? '#000' : '#fff'
                            }}>
                            {user.active ? 'Block' : 'Unblock'}
                          </button>
                          <button
                            onClick={async () => {
                              const newRole = user.role === 'admin' ? 'user' : 'admin';
                              if (window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole.toUpperCase()}?`)) {
                                try {
                                  const res = await api.put(`/admin/users/${user.id}/role`, { role: newRole });
                                  if (res.success) {
                                    setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
                                    alert(`Role updated to ${newRole}`);
                                  } else {
                                    alert('Failed to update role');
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert('Error updating role');
                                }
                              }
                            }}
                            className="action-btn"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              background: '#17a2b8',
                              color: '#fff'
                            }}>
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="action-btn"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              background: '#dc3545',
                              color: '#fff'
                            }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="admin-content">
          <div className="admin-section card">
            <h2>All Trips</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Trip Name</th>
                    <th>Created By</th>
                    <th>Destination</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Budget</th>
                    <th>Travelers</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(trip => (
                    <tr key={trip.id}>
                      <td>{trip.tripName}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                            <FiUsers size={12} />
                          </div>
                          {trip.createdBy || 'Unknown'}
                        </div>
                      </td>
                      <td>{trip.destination}</td>
                      <td>{trip.startDate}</td>
                      <td>{trip.endDate}</td>
                      <td>{formatINR(trip.budget || 0)}</td>
                      <td>{trip.travelers || 1}</td>
                      <td>
                        <span className={`status-badge status-${trip.status?.toLowerCase() || 'planning'}`}>
                          {trip.status || 'Planning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="admin-content">
          <div className="admin-section card">
            <h2>All Bookings</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{booking.type}</td>
                      <td>{booking.name}</td>
                      <td>{booking.location}</td>
                      <td>{booking.checkIn}</td>
                      <td>{formatINR(booking.price || 0)}</td>
                      <td>
                        <span className={`status-badge status-${booking.status?.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="admin-content">
          <div className="admin-section card">
            <h2>Payment History</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>{formatINR(payment.amount || 0)}</td>
                      <td>{payment.method || 'Card'}</td>
                      <td>
                        <span className={`status-badge status-${payment.status?.toLowerCase() || 'success'}`}>
                          {payment.status || 'Success'}
                        </span>
                      </td>
                      <td>{new Date(payment.date || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard


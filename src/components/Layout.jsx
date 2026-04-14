import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import {
  FiHome,
  FiPlusCircle,
  FiCalendar,
  FiBookOpen,
  FiDollarSign,
  FiMessageCircle,
  FiImage,
  FiCreditCard,
  FiFileText,
  FiMap,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield
} from 'react-icons/fi'
import Logo from './Logo'
import './Layout.css'

import AddMemberModal from './AddMemberModal'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [showChat, setShowChat] = useState(false)
  const [tripId, setTripId] = useState(null)

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)

  useEffect(() => {
    const fetchDefaultTrip = async () => {
      // Extract tripId from URL if present (e.g., /trips/123/...)
      const match = location.pathname.match(/\/trips\/(\d+)/)
      if (match) {
        setTripId(match[1])
        return
      }

      // If no ID in URL and user is logged in, fetch latest trip
      if (user && user.id) {
        try {
          const response = await api.get(`/trips?userId=${user.id}`)
          if (response.success && response.data && response.data.length > 0) {
            setTripId(response.data[0].id)
          }
        } catch (e) {
          console.error("Failed to fetch default trip for chat", e)
        }
      }
    }

    fetchDefaultTrip()
  }, [location.pathname, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAddMember = async (emailToAdd) => {
    try {
      if (!tripId) return;
      const result = await api.post('/trip-members/add', {
        tripId: parseInt(tripId),
        email: emailToAdd
      })
      if (result.success || result.id) {
        alert(`Member added successfully: ${emailToAdd}`) // Simple feedback for global modal
        setShowAddMemberModal(false)
      } else {
        alert(result.error || 'Failed to add member')
      }
    } catch (err) {
      console.error("Add member failed", err)
      alert('Failed to add member')
    }
  }

  let menuItems = []

  if (isAdmin()) {
    menuItems = [
      { path: '/admin', icon: FiShield, label: 'Admin Dashboard' }
    ]
  } else {
    menuItems = [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
      { path: '/trip-creation', icon: FiPlusCircle, label: 'Create Trip' },
      { path: '/itinerary', icon: FiCalendar, label: 'Itinerary' },
      { path: '/booking', icon: FiBookOpen, label: 'Booking' },
      { path: '/expense-manager', icon: FiDollarSign, label: 'Expenses' },
      { path: '/nearby-locations', icon: FiMap, label: 'Nearby Locations' },
      { path: '/chat', icon: FiMessageCircle, label: 'Chat' },
      { path: '/photo-gallery', icon: FiImage, label: 'Gallery' },
      { path: '/payment', icon: FiCreditCard, label: 'Payment' },
      { path: '/trip-summary', icon: FiFileText, label: 'Trip Summary' },
    ]
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginRight: '1rem' }}>
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
            <Link to="/dashboard" className="nav-logo-link">
              <Logo size="medium" showText={true} className="logo-white" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="layout-content">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Logo size="small" showText={false} />
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>BudgetGo</h2>
            </Link>
          </div>

          {user && (
            <div className="sidebar-user">
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                {user.role === 'admin' && <span className="user-role-badge">ADMIN</span>}
              </div>
            </div>
          )}

          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <button className="sidebar-item logout-btn" onClick={handleLogout}>
              <FiLogOut />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>

      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        isLoading={false}
      />
    </div>
  )
}

export default Layout


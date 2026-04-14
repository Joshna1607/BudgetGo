import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import OAuthCallback from './pages/OAuthCallback'
import TripCreation from './pages/TripCreation'
import Itinerary from './pages/Itinerary'
import Booking from './pages/Booking'
import ExpenseManager from './pages/ExpenseManager'
import Chat from './pages/Chat'
import PhotoGallery from './pages/PhotoGallery'
import Payment from './pages/Payment'
import TripSummary from './pages/TripSummary'
import NearbyLocations from './pages/NearbyLocations'
import AdminDashboard from './pages/AdminDashboard'
import TripMembers from './pages/TripMembers'
import InviteAccept from './pages/InviteAccept'
import ForgotPassword from './pages/ForgotPassword'
import Layout from './components/Layout'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-creation"
            element={
              <ProtectedRoute>
                <Layout>
                  <TripCreation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary"
            element={
              <ProtectedRoute>
                <Layout>
                  <Itinerary />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Layout>
                  <Booking />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expense-manager"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExpenseManager />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <Chat />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/photo-gallery"
            element={
              <ProtectedRoute>
                <Layout>
                  <PhotoGallery />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Layout>
                  <Payment />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip-summary"
            element={
              <ProtectedRoute>
                <Layout>
                  <TripSummary />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nearby-locations"
            element={
              <ProtectedRoute>
                <Layout>
                  <NearbyLocations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/invite/accept" element={<InviteAccept />} />
          <Route
            path="/trips/:tripId/members"
            element={
              <ProtectedRoute>
                <Layout>
                  <TripMembers />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App


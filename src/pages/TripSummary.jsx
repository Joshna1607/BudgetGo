import React, { useState, useEffect } from 'react'
import { FiMapPin, FiCalendar, FiDollarSign, FiUsers, FiCheckCircle, FiDownload, FiShare2 } from 'react-icons/fi'
import { formatINR } from '../utils/currency'
import { generateTripSummaryPDF } from '../utils/pdfGenerator'
import './TripSummary.css'

import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import { DEMO_DATA } from '../data/demoData'

const TripSummary = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTrip, setActiveTrip] = useState(null)

  const [tripData, setTripData] = useState({
    tripName: '',
    destination: '',
    startDate: '',
    endDate: '',
    duration: '0 days',
    travelers: 1,
    budget: 0,
    totalSpent: 0,
    remaining: 0,
    travelBudget: 0,
    hotelBudget: 0,
    foodBudget: 0,
    activitiesBudget: 0,
    miscBudget: 0
  })

  // State for dynamic lists
  const [expensesList, setExpensesList] = useState([])
  const [itinerary, setItinerary] = useState([])

  // Calculate category breakdown dynamically
  const expensesByCategory = React.useMemo(() => {
    const breakdown = {}
    let total = 0
    expensesList.forEach(exp => {
      breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount
      total += exp.amount
    })

    return Object.keys(breakdown).map(cat => ({
      category: cat,
      amount: breakdown[cat],
      percentage: total > 0 ? Math.round((breakdown[cat] / total) * 100) : 0
    })).sort((a, b) => b.amount - a.amount)
  }, [expensesList])

  useEffect(() => {
    fetchTripData()
  }, [user])

  const fetchTripData = async () => {
    if (!user || !user.id) {
      setLoading(false)
      return
    }

    // DEMO MODE CHECK
    if (user.isDemo) {
      if (DEMO_DATA.trips.length > 0) {
        const demoTrip = DEMO_DATA.trips[0]
        const demoExpenses = DEMO_DATA.expenses
        // ... (rest of logic)

        setExpensesList(demoExpenses)
        setActiveTrip(demoTrip)

        const totalSpent = demoExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

        setTripData({
          tripName: demoTrip.tripName,
          destination: demoTrip.destination,
          startDate: demoTrip.startDate,
          endDate: demoTrip.endDate,
          duration: `${demoTrip.days} days`,
          travelers: demoTrip.travelers,
          budget: demoTrip.budget,
          totalSpent: totalSpent,
          remaining: demoTrip.budget - totalSpent
        })
        if (demoTrip.itinerary) {
          setItinerary(demoTrip.itinerary)
        }
      }
      setLoading(false)
      return
    }

    try {
      // 1. Fetch Trips to get active one
      const tripsRes = await api.get(`/trips?userId=${user.id}`)
      let currentTrip = null
      if (tripsRes.success && tripsRes.data && tripsRes.data.length > 0) {
        currentTrip = tripsRes.data[0] // Active trip
        setActiveTrip(currentTrip)
      }

      // 2. Fetch Expenses
      const expensesRes = await api.get(`/expenses?userId=${user.id}`) // In real app, filter by tripId
      const fetchedExpenses = expensesRes.success ? (expensesRes.data || []) : []
      setExpensesList(fetchedExpenses)

      // 3. Calculate Totals
      const totalSpent = fetchedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

      if (currentTrip) {
        setTripData({
          tripName: currentTrip.tripName,
          destination: currentTrip.destination,
          startDate: currentTrip.startDate,
          endDate: currentTrip.endDate,
          duration: currentTrip.days ? `${currentTrip.days} days` : 'N/A',
          travelers: currentTrip.travelers || 1, // Fallback
          budget: currentTrip.budget || 0,
          totalSpent: totalSpent,
          totalSpent: totalSpent,
          remaining: (currentTrip.budget || 0) - totalSpent,
          travelBudget: currentTrip.travelBudget || 0,
          hotelBudget: currentTrip.hotelBudget || 0,
          foodBudget: currentTrip.foodBudget || 0,
          activitiesBudget: currentTrip.activitiesBudget || 0,
          miscBudget: currentTrip.miscBudget || 0
        })
      }

    } catch (e) {
      console.error("Failed to fetch summary data", e)
    } finally {
      setLoading(false)
    }
  }

  // Placeholder for Itinerary/Bookings until backend supports them fully
  // Keeping constants but could be emptied if preferred.
  // For now, I'll keep them as "Sample" or empty them if requested "only user's".
  // The request says "give the user's trip summary ONLY". 
  // So I should probably clear the hardcoded lists if I can't fetch real ones.
  // But to avoid an empty-looking page, I might keep them as empty arrays or mocked if no data.
  // Let's rely on what we fetched.


  const handleDownloadPDF = () => {
    // Load actual data
    const storedExpenses = JSON.parse(localStorage.getItem('expenses') || '[]')
    const storedBookings = JSON.parse(localStorage.getItem('bookings') || bookings)
    const storedItinerary = JSON.parse(localStorage.getItem('itinerary') || '[]')

    generateTripSummaryPDF(tripData, storedExpenses, storedBookings, storedItinerary)
  }

  const handleShareTrip = () => {
    if (navigator.share) {
      navigator.share({
        title: `Trip: ${tripData.tripName || 'My Trip'}`,
        text: `Check out my trip to ${tripData.destination || 'destination'}!`,
        url: window.location.href
      }).catch(err => console.log('Error sharing', err))
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Trip link copied to clipboard!')
    }
  }

  const bookings = []

  return (
    <div className="trip-summary">
      <div className="page-header">
        <h1>Trip Summary</h1>
        <p>Complete overview of your trip</p>
      </div>

      <div className="summary-header card">
        <div className="trip-title">
          <h2>{tripData.tripName || tripData.name}</h2>
          <div className="trip-location">
            <FiMapPin /> {tripData.destination}
          </div>
        </div>
        <div className="trip-stats">
          <div className="stat-item">
            <FiCalendar />
            <div>
              <span className="stat-label">Duration</span>
              <span className="stat-value">{tripData.duration}</span>
            </div>
          </div>
          <div className="stat-item">
            <FiUsers />
            <div>
              <span className="stat-label">Travelers</span>
              <span className="stat-value">{tripData.travelers}</span>
            </div>
          </div>
          <div className="stat-item">
            <FiDollarSign />
            <div>
              <span className="stat-label">Total Budget</span>
              <span className="stat-value">{formatINR(tripData.budget)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 7: Final Budget Summary Card */}
      <div className="card" style={{ marginBottom: '2rem', borderLeft: '5px solid #667eea' }}>
        <h3 style={{ marginTop: 0, color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>💰 Budget Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Transport Budget:</span>
              <strong>{formatINR(tripData.travelBudget)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Stay Budget:</span>
              <strong>{formatINR(tripData.hotelBudget)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Food Budget:</span>
              <strong>{formatINR(tripData.foodBudget)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Activities Budget:</span>
              <strong>{formatINR(tripData.activitiesBudget)}</strong>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              <span>Total Used:</span>
              <strong style={{ color: '#e53e3e' }}>{formatINR(tripData.totalSpent)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1.2rem', marginTop: '1rem' }}>
              <span>Remaining:</span>
              <strong style={{ color: tripData.remaining < 0 ? '#e53e3e' : '#38a169' }}>{formatINR(tripData.remaining)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-content">
        <div className="summary-section">
          <div className="section-header">
            <h3>Itinerary Overview</h3>
          </div>
          <div className="itinerary-timeline">
            {itinerary.length > 0 ? (
              itinerary.map((day, index) => (
                <div key={index} className="timeline-day">
                  <div className="day-header">
                    <h4>{day.day}</h4>
                    <span className="day-date">{day.date}</span>
                  </div>
                  <ul className="day-activities">
                    {day.activities.map((activity, actIndex) => (
                      <li key={actIndex}>
                        <FiCheckCircle /> {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No itinerary details available.</p>
            )}
          </div>
        </div>

        <div className="summary-section">
          <div className="section-header">
            <h3>Budget Allocation & Status</h3>
          </div>
          <div className="budget-status-list" style={{ display: 'grid', gap: '1rem' }}>
            {['Travel', 'Accommodation', 'Food', 'Activities'].map(cat => {
              let budgetAmount = 0;
              let spentAmount = 0;
              let catKey = '';

              switch (cat) {
                case 'Travel':
                  budgetAmount = tripData.travelBudget;
                  catKey = 'Transportation';
                  break;
                case 'Accommodation':
                  budgetAmount = tripData.hotelBudget;
                  catKey = 'Accommodation';
                  break;
                case 'Food':
                  budgetAmount = tripData.foodBudget;
                  catKey = 'Food';
                  break;
                case 'Activities':
                  budgetAmount = tripData.activitiesBudget;
                  catKey = 'Activities';
                  break;
                case 'Miscellaneous':
                  budgetAmount = tripData.miscBudget;
                  catKey = 'Other'; // Approx mapping
                  spentAmount += (expensesList.filter(e => e.category === 'Shopping').reduce((acc, curr) => acc + curr.amount, 0));
                  break;
                default: break;
              }

              // Sum actual expenses matching this category
              spentAmount += expensesList.filter(e => e.category === catKey).reduce((acc, curr) => acc + curr.amount, 0);

              const percent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
              const isOver = spentAmount > budgetAmount;

              return (
                <div key={cat} className="budget-status-item" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{cat}</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {formatINR(spentAmount)} / {formatINR(budgetAmount)}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px', background: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(percent, 100)}%`,
                      height: '100%',
                      background: isOver ? '#dc3545' : '#28a745',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  {isOver && <div style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '0.25rem' }}>Over budget by {formatINR(spentAmount - budgetAmount)}</div>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="summary-section">
          <div className="section-header">
            <h3>Expense Breakdown</h3>
          </div>
          <div className="expense-breakdown">
            <div className="expense-total">
              <div>
                <span className="total-label">Total Spent</span>
                <span className="total-amount">{formatINR(tripData.totalSpent)}</span>
              </div>
              <div>
                <span className="total-label">Remaining</span>
                <span className="total-remaining">{formatINR(tripData.remaining)}</span>
              </div>
            </div>
            <div className="expense-categories">
              {expensesByCategory.length > 0 ? (
                expensesByCategory.map((expense, index) => (
                  <div key={index} className="expense-category">
                    <div className="category-header">
                      <span className="category-name">{expense.category}</span>
                      <span className="category-amount">{formatINR(expense.amount)}</span>
                    </div>
                    <div className="category-bar">
                      <div
                        className="category-fill"
                        style={{ width: `${expense.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No expenses recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="summary-section">
          <div className="section-header">
            <h3>Bookings</h3>
          </div>
          <div className="bookings-list">
            {bookings.length > 0 ? (
              bookings.map((booking, index) => (
                <div key={index} className="booking-summary-item">
                  <div className="booking-type-badge">{booking.type}</div>
                  <div className="booking-details">
                    <h4>{booking.name}</h4>
                    <span className="booking-status">
                      <FiCheckCircle /> {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No bookings found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="summary-actions">
        <button className="btn btn-secondary" onClick={handleDownloadPDF}>
          <FiDownload /> Download PDF
        </button>
        <button className="btn btn-primary" onClick={handleShareTrip}>
          <FiShare2 /> Share Trip
        </button>
      </div>
    </div>
  )
}

export default TripSummary


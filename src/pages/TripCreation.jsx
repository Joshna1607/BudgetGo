import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiDollarSign, FiUsers, FiCpu, FiCheck } from 'react-icons/fi'
import { tripMoods } from '../utils/tripMoods'
import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import './TripCreation.css'
import PlaceAutocomplete from '../components/PlaceAutocomplete'

const TripCreation = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'ADMIN')) {
      navigate('/admin')
    }
  }, [user, navigate])
  const [formData, setFormData] = useState({
    tripName: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '',
    description: '',
    mood: ''
  })
  const [savedTripId, setSavedTripId] = useState(null)
  const [aiPlan, setAiPlan] = useState(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const calculateBudgetSplit = (totalBudget) => {
    const budget = parseFloat(totalBudget) || 0
    return {
      travel: Math.round(budget * 0.30),
      accommodation: Math.round(budget * 0.35),
      food: Math.round(budget * 0.25),
      activities: Math.round(budget * 0.10),
      miscellaneous: 0
    }
  }

  const budgetSplit = formData.budget ? calculateBudgetSplit(formData.budget) : null

  const handleGenerateAIPlan = async () => {
    if (!formData.origin || !formData.destination || !formData.budget || !formData.startDate || !formData.endDate) {
      alert("Please fill in Origin, Destination, Dates, and Budget first.");
      return;
    }

    setGeneratingPlan(true);
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const payload = {
        origin: formData.origin,
        destination: formData.destination,
        days: days,
        budget: parseFloat(formData.budget),
        travelers: parseInt(formData.travelers),
        mood: tripMoods.find(m => m.id === formData.mood)?.name || 'General'
      };

      const res = await api.post('/trips/generate-plan', payload);

      // Handle the new response structure or legacy/wrapper structure
      const planData = res.data || res;

      if (planData) {
        if (planData.is_feasible === false) {
          // Don't clear plan, set it so we can show alternatives
          setAiPlan(planData);
        } else if (res.success || planData.transport_options) {
          setAiPlan(planData);
        } else {
          alert("Failed to generate plan. Server response: " + JSON.stringify(planData));
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error: " + (e.response?.data?.message || e.message));
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!user || !user.id) {
      setError('Please login to create a trip')
      setLoading(false)
      return
    }

    try {
      const tripData = {
        tripName: formData.tripName,
        origin: formData.origin,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget),
        travelers: parseInt(formData.travelers),
        description: formData.description || '',
        mood: formData.mood || '',
        userId: user.id,
        status: 'Planning'
      }

      const result = await api.post('/trips', tripData)

      if (result.success) {
        setSavedTripId(result.data.id) // Save ID
        alert("Trip saved successfully! You can now book items below.")
        // navigate('/itinerary') // REMOVED auto-nav
      } else {
        setError(result.error || 'Failed to create trip')
      }
    } catch (err) {
      setError('Failed to create trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async (type, name, cost) => {
    if (!savedTripId) return alert("Please 'Save Trip' first to enable booking.");

    const payload = {
      tripId: savedTripId,
      userId: user.id,
      type: type,
      name: name,
      cost: cost || 0,
      providerUrl: "https://booking.com"
    }

    try {
      const res = await api.post('/bookings/simulate', payload)

      if (res.success || res.booking) {
        alert(`✅ Booking Confirmed for ${name}!\nBudget updated.`)
      } else {
        if (res.error) alert(`❌ Booking Failed: ${res.error}`)
        else alert("Booking simulated (check summary)")
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Booking failed"
      alert(`❌ ${msg}`)
    }
  }

  const selectedMood = tripMoods.find(m => m.id === formData.mood)

  return (
    <div className="trip-creation">
      <div className="page-header">
        <h1>Create New Trip</h1>
        <p>Plan your next adventure with BudgetGo</p>
      </div>

      <form onSubmit={handleSubmit} className="trip-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="tripName">
                <FiMapPin /> Trip Name
              </label>
              <input
                type="text"
                id="tripName"
                name="tripName"
                value={formData.tripName}
                onChange={handleChange}
                placeholder="e.g., Paris Adventure"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="origin">
                <FiMapPin /> Origin
              </label>
              <PlaceAutocomplete
                value={formData.origin}
                onChange={handleChange}
                placeholder="e.g., Delhi, India"
                required
                name="origin"
              />
            </div>
            <div className="input-group">
              <label htmlFor="destination">
                <FiMapPin /> Destination
              </label>
              <PlaceAutocomplete
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., Paris, France"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Trip Dates</h2>
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="startDate">
                <FiCalendar /> Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="endDate">
                <FiCalendar /> End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Trip Mood & Type</h2>
          <div className="input-group">
            <label htmlFor="mood">Select Trip Mood</label>
            <p className="mood-description">Choose a mood to get personalized itinerary suggestions</p>
            <div className="mood-grid">
              {tripMoods.map((mood) => (
                <div
                  key={mood.id}
                  className={`mood-card ${formData.mood === mood.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, mood: mood.id })}
                >
                  <div className="mood-icon">{mood.icon}</div>
                  <div className="mood-info">
                    <h4>{mood.name}</h4>
                    <p>{mood.description}</p>
                  </div>
                  {formData.mood === mood.id && (
                    <div className="mood-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Budget & Travelers</h2>
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="budget">
                <FiDollarSign /> Budget (₹)
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="1"
                required
              />
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                Budget will be automatically split across categories
              </small>
            </div>
            <div className="input-group">
              <label htmlFor="travelers">
                <FiUsers /> Number of Travelers
              </label>
              <input
                type="number"
                id="travelers"
                name="travelers"
                value={formData.travelers}
                onChange={handleChange}
                placeholder="1"
                min="1"
                required
              />
            </div>
          </div>

          {budgetSplit && (
            <div className="budget-split-preview card" style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#333' }}>
                💰 Automatic Budget Allocation
              </h3>
              <div className="budget-split-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                <div className="budget-category">
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Travel
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                    ₹{budgetSplit.travel.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>30%</div>
                </div>
                <div className="budget-category">
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Accommodation
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#28a745' }}>
                    ₹{budgetSplit.accommodation.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>35%</div>
                </div>
                <div className="budget-category">
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Food
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffc107' }}>
                    ₹{budgetSplit.food.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>20%</div>
                </div>
                <div className="budget-category">
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                    Activities
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc3545' }}>
                    ₹{budgetSplit.activities.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>10%</div>
                </div>
              </div>
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 'bold' }}>Total Budget:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                  ₹{parseFloat(formData.budget || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}


          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleGenerateAIPlan}
              disabled={generatingPlan}
              className="btn btn-secondary"
              style={{
                background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <FiCpu /> {generatingPlan ? 'Asking AI Agent...' : 'Generate Real-Time Travel Options'}
            </button>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              Get realistic Train, Bus & Flight prices based on your budget
            </p>
          </div>

          {aiPlan && aiPlan.is_feasible === false && (
            <div className="form-section fade-in" style={{ marginTop: '2rem', borderTop: '1px dashed #dc3545', paddingTop: '2rem' }}>
              <div style={{
                backgroundColor: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h2 style={{ color: '#c53030', marginTop: 0 }}>⚠️ Budget Alert</h2>
                <p style={{ fontSize: '1.1rem', color: '#742a2a' }}>{aiPlan.feasibility_message}</p>

                {aiPlan.alternatives && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#2d3748', marginBottom: '1rem' }}>✅ Smart Alternatives</h3>

                    {aiPlan.alternatives.budget_recommendation && (
                      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'white', borderRadius: '6px', borderLeft: '4px solid #48bb78' }}>
                        <strong>💰 Recommendation:</strong> {aiPlan.alternatives.budget_recommendation}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      {aiPlan.alternatives.nearby_destinations?.length > 0 && (
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <h4 style={{ color: '#2b6cb0', marginBottom: '0.5rem' }}>📍 Nearby Destinations</h4>
                          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                            {aiPlan.alternatives.nearby_destinations.map((dest, i) => (
                              <li key={i} style={{ marginBottom: '0.25rem', cursor: 'pointer', color: '#3182ce', textDecoration: 'underline' }}
                                onClick={() => setFormData({ ...formData, destination: dest })}>
                                {dest}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiPlan.alternatives.trip_scope_adjustments?.length > 0 && (
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <h4 style={{ color: '#d69e2e', marginBottom: '0.5rem' }}>⚡ Adjust Trip Scope</h4>
                          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                            {aiPlan.alternatives.trip_scope_adjustments.map((adj, i) => (
                              <li key={i} style={{ marginBottom: '0.25rem' }}>{adj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {aiPlan && aiPlan.is_feasible !== false && (
            <div className="form-section fade-in" style={{ marginTop: '2rem', borderTop: '1px dashed #e2e8f0', paddingTop: '2rem' }}>
              <h2>✨ Recommended Transport Options</h2>
              <div className="transport-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {aiPlan.transport_options?.map((opt, idx) => (
                  <div key={idx} style={{
                    padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '16px',
                    background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{opt.type}</span>
                      <span style={{ fontWeight: 'bold', color: '#667eea' }}>₹{opt.price_per_person}/pax</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{opt.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#718096', display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <span>⏱ {opt.duration}</span>
                      <span>🕒 {opt.time}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.9rem' }}
                      onClick={async () => {
                        if (!user?.id) return alert("Please login to book");
                        if (!formData.tripName) return alert("Please create the trip first or wait for it to be saved");

                        // Note: In this flow, trip might not be created yet in DB if they are just planning. 
                        // Ideally, "Book" should only differ to real booking if trip exists. 
                        // For this simulation, we'll alert if trip ID is missing, or auto-save.
                        alert("To book, please click 'Create Trip' first to save this plan to your dashboard. Then you can book from there.");
                      }}
                    >
                      Book Now ↗
                    </button>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.2rem', color: '#2d3748' }}>🏨 Estimated AI Breakdown</h3>
              <div className="transport-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {aiPlan.hotels?.map((hotel, idx) => (
                  <div key={idx} style={{
                    padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '16px',
                    background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{hotel.type || 'Hotel'}</span>
                      <span style={{ fontWeight: 'bold', color: '#28a745' }}>₹{hotel.price_per_night}/night</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{hotel.name}</div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.9rem', marginTop: '1rem' }}
                      onClick={() => alert("Please 'Create Trip' first to start booking capabilities on your dashboard.")}
                    >
                      View & Book ↗
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f7fafc', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem' }}>
                <p><strong>Total Estimate:</strong> ₹{aiPlan.estimated_costs?.total}</p>
                <small style={{ color: '#718096' }}>*Prices are real-time estimates generated by Gemini AI</small>
              </div>
            </div>
          )}
        </div>

        {selectedMood && (
          <div className="mood-preview card">
            <div className="mood-preview-header">
              <span className="mood-preview-icon">{selectedMood.icon}</span>
              <div>
                <h3>Selected: {selectedMood.name} Trip</h3>
                <p>{selectedMood.description}</p>
              </div>
            </div>
            <p className="mood-preview-note">
              ✨ Based on your selection, we'll generate a personalized {selectedMood.name.toLowerCase()} itinerary for your trip!
            </p>
          </div>
        )}

        <div className="form-section">
          <h2>Description</h2>
          <div className="input-group">
            <label htmlFor="description">Trip Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your trip plans..."
              rows="5"
            />
          </div>
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
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TripCreation


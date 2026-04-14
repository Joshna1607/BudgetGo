import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiClock, FiMapPin, FiPlus, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { generateItineraryByMood, tripMoods, getMoodRecommendations } from '../utils/tripMoods'
import { generateTransportOptions } from '../utils/transportGenerator'
import { placesService } from '../utils/placesService'
import api from '../config/api'
import { DEMO_DATA } from '../data/demoData'
import { useAuth } from '../context/AuthContext'
import './Itinerary.css'

const Itinerary = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState('')
  const [tripData, setTripData] = useState(null)
  const [transportOptions, setTransportOptions] = useState([])
  const [hotels, setHotels] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [itineraryItems, setItineraryItems] = useState([])
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [delays, setDelays] = useState({}) // Track delays for activities
  const [showDelayForm, setShowDelayForm] = useState(false)
  const [delayFormData, setDelayFormData] = useState({ itemId: '', delayMinutes: 0 })

  const { user } = useAuth()

  useEffect(() => {
    const fetchTripsAndGenerate = async () => {
      if (!user || !user.id) return;

      // DEMO MODE LOGIC
      if (user.isDemo) {
        const demoTrip = DEMO_DATA.trips.length > 0 ? DEMO_DATA.trips[0] : null
        if (demoTrip) {
          setTripData(demoTrip)

          const items = []
          if (demoTrip.itinerary) {
            const startDate = new Date(demoTrip.startDate)
            demoTrip.itinerary.forEach((day, dayIndex) => {
              const currentDate = new Date(startDate)
              currentDate.setDate(startDate.getDate() + dayIndex)
              const dateStr = currentDate.toISOString().split('T')[0]

              day.activities.forEach((activity, actIndex) => {
                const times = ['09:00', '12:00', '15:00', '18:00', '20:00']
                items.push({
                  id: `${dayIndex}-${actIndex}`,
                  date: dateStr,
                  time: times[actIndex % times.length] || '10:00',
                  title: activity,
                  location: demoTrip.destination,
                  description: `${day.day} Activity`,
                  mood: 'Exploration',
                  icon: '📍'
                })
              })
            })
          }
          setItineraryItems(items)
          if (items.length > 0) setSelectedDate(items[0].date)

          // Mock Transport
          if (demoTrip.origin && demoTrip.destination) {
            const transport = generateTransportOptions(demoTrip.origin, demoTrip.destination, demoTrip.startDate)
            setTransportOptions(transport)
          }
        }
        return
      }

      try {
        // Fetch trips from API instead of LocalStorage
        const response = await api.get(`/trips?userId=${user.id}`);
        const trips = response.success ? response.data : [];
        const latestTrip = trips.length > 0 ? trips[0] : null // API returns sorted by desc usually, or we sort

        // ... (rest of API logic)

        if (latestTrip && latestTrip.mood) {
          setTripData(latestTrip)
          // 1. Get Coordinates
          const coords = await placesService.getCoordinates(latestTrip.destination);
          let realAttractions = [];

          if (coords) {
            // 2. Fetch Real Data
            const [attractionsData, hotelsData, restaurantsData] = await Promise.all([
              placesService.getPlaces(coords.lat, coords.lon, 'attraction'),
              placesService.getPlaces(coords.lat, coords.lon, 'hotel'),
              placesService.getPlaces(coords.lat, coords.lon, 'restaurant')
            ]);

            // 3. Determine Budget Level
            const dailyBudget = (latestTrip.budget || 20000) / (latestTrip.days || 5);
            const start = new Date(latestTrip.startDate);
            const end = new Date(latestTrip.endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            const budgetLevel = dailyBudget < 3000 ? 1 : (dailyBudget > 8000 ? 3 : 2);

            // 4. Enrich & Filter
            realAttractions = placesService.enrichPlacesWithBudget(attractionsData, budgetLevel);
            setHotels(placesService.enrichPlacesWithBudget(hotelsData, budgetLevel));
            setRestaurants(placesService.enrichPlacesWithBudget(restaurantsData, budgetLevel));
          }

          // 5. Generate Itinerary
          const startDate = new Date(latestTrip.startDate)
          const end = new Date(latestTrip.endDate);
          const tripDuration = Math.max(1, Math.ceil((end - startDate) / (1000 * 60 * 60 * 24)) + 1);

          const generatedItinerary = generateItineraryByMood(
            latestTrip.mood,
            latestTrip.destination,
            tripDuration
          )

          // Convert to itinerary items format
          const items = []
          let attractionIndex = 0;

          generatedItinerary.forEach((day, dayIndex) => {
            const currentDate = new Date(startDate)
            currentDate.setDate(startDate.getDate() + dayIndex)
            const dateStr = currentDate.toISOString().split('T')[0]

            day.activities.forEach((activity, actIndex) => {
              const times = ['09:00', '12:00', '15:00', '18:00']

              // Try to replace generic activity with real attraction
              let displayTitle = activity;
              let displayDesc = `${day.mood} activity`;

              if ((activity.includes('Visit') || activity.includes('Explor') || activity.includes('Walk') || activity.includes('Tour')) && attractionIndex < realAttractions.length) {
                const place = realAttractions[attractionIndex++];
                displayTitle = `Visit ${place.name}`;
                displayDesc = `${place.name} - ${place.type ? place.type.replace('_', ' ') : 'Attraction'}. Est. Entry: ₹${Math.floor(place.price / 10)}`;
              }

              items.push({
                id: `${dayIndex}-${actIndex}`,
                date: dateStr,
                time: times[actIndex % times.length] || '10:00',
                title: displayTitle,
                location: latestTrip.destination,
                description: displayDesc,
                mood: latestTrip.mood,
                icon: day.icon
              })
            })
          })

          setItineraryItems(items)
          if (items.length > 0) setSelectedDate(items[0].date)

          // Transport Logic
          if (latestTrip.origin && latestTrip.destination) {
            const transport = generateTransportOptions(
              latestTrip.origin,
              latestTrip.destination,
              latestTrip.startDate
            )
            setTransportOptions(transport)
          }

        }
      } catch (error) {
        console.error("Failed to load itinerary", error);
      }
    }

    if (user) {
      fetchTripsAndGenerate();
    }
  }, [user])

  const dates = [...new Set(itineraryItems.map(item => item.date))]

  const handleRegenerate = () => {
    if (tripData && tripData.mood) {
      const generatedItinerary = generateItineraryByMood(
        tripData.mood,
        tripData.destination,
        tripData.days || 5
      )

      const startDate = new Date(tripData.startDate)
      const items = []
      generatedItinerary.forEach((day, dayIndex) => {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + dayIndex)
        const dateStr = currentDate.toISOString().split('T')[0]

        day.activities.forEach((activity, actIndex) => {
          const times = ['09:00', '12:00', '15:00', '18:00']
          items.push({
            id: `${dayIndex}-${actIndex}`,
            date: dateStr,
            time: times[actIndex % times.length] || '10:00',
            title: activity,
            location: tripData.destination,
            description: `${day.mood} activity`,
            mood: tripData.mood,
            icon: day.icon
          })
        })
      })

      setItineraryItems(items)
      if (items.length > 0) {
        setSelectedDate(items[0].date)
      }
    }
  }

  const recommendations = tripData && tripData.mood ? getMoodRecommendations(tripData.mood) : null
  const selectedMood = tripData ? tripMoods.find(m => m.id === tripData.mood) : null

  // Adjust itinerary times based on delays
  const adjustItineraryForDelays = (items) => {
    return items.map(item => {
      const delay = delays[item.id] || 0
      if (delay > 0) {
        const [hours, minutes] = item.time.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + delay
        const newHours = Math.floor(totalMinutes / 60)
        const newMinutes = totalMinutes % 60
        return {
          ...item,
          time: `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`,
          hasDelay: true,
          delayMinutes: delay
        }
      }
      return item
    })
  }

  const adjustedItems = adjustItineraryForDelays(itineraryItems)
  const filteredItems = adjustedItems.filter(item => item.date === selectedDate)

  // Fetch Delays from Backend
  useEffect(() => {
    const fetchDelays = async () => {
      if (tripData && tripData.id) {
        try {
          const res = await api.get(`/itinerary/delays/${tripData.id}`);
          if (res.success || Array.isArray(res)) { // Helper might return array directly or wrapped
            const fetchedDelays = {};
            // Assuming API returns array of objects { activityId, minutes }
            (Array.isArray(res) ? res : (res.data || [])).forEach(d => {
              fetchedDelays[d.activityId] = d.minutes;
            });
            setDelays(fetchedDelays);
          }
        } catch (e) {
          console.error("Failed to fetch delays", e);
        }
      }
    }
    fetchDelays();
  }, [tripData]);

  const handleDelayReport = (itemId) => {
    setDelayFormData({ itemId, delayMinutes: 0 })
    setShowDelayForm(true)
  }

  const handleDelaySubmit = async (e) => {
    e.preventDefault()
    const { itemId, delayMinutes } = delayFormData

    // Optimistic Update
    setDelays(prev => ({
      ...prev,
      [itemId]: parseInt(delayMinutes) || 0
    }))

    // Persist to Backend
    if (tripData && tripData.id) {
      try {
        await api.post('/itinerary/delay', {
          tripId: tripData.id,
          activityId: itemId,
          minutes: parseInt(delayMinutes)
        });
      } catch (err) {
        console.error("Failed to save delay", err);
        // Optionally revert state here
      }
    }

    // Auto-adjust subsequent activities on the same day
    const itemIndex = itineraryItems.findIndex(item => item.id === itemId)
    if (itemIndex !== -1) {
      const currentItem = itineraryItems[itemIndex]
      const sameDayItems = itineraryItems.filter(
        (item, idx) => item.date === currentItem.date && idx > itemIndex
      )

      // We might want to persist these cascading delays too, but for now visual is fine
      sameDayItems.forEach(nextItem => {
        const currentDelay = delays[nextItem.id] || 0
        setDelays(prev => ({
          ...prev,
          [nextItem.id]: currentDelay + parseInt(delayMinutes)
        }))
      })
    }

    setShowDelayForm(false)
    setDelayFormData({ itemId: '', delayMinutes: 0 })
  }

  return (
    <div className="itinerary">
      <div className="page-header">
        <div>
          <h1>Trip Itinerary</h1>
          <p>Your detailed travel schedule</p>
          {selectedMood && (
            <div className="mood-badge-header">
              <span className="mood-badge-icon">{selectedMood.icon}</span>
              <span className="mood-badge-text">{selectedMood.name} Trip</span>
            </div>
          )}
        </div>
        {tripData && tripData.mood && (
          <button className="btn btn-primary" onClick={handleRegenerate}>
            <FiRefreshCw /> Regenerate Itinerary
          </button>
        )}
      </div>

      {transportOptions.length > 0 && (
        <div className="transport-section card" style={{ marginBottom: '2rem' }}>
          <h3>🚆 Travel Options: {tripData.origin} ➝ {tripData.destination}</h3>
          <div className="transport-list">
            {transportOptions.map(option => (
              <div key={option.id} className="transport-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #eee'
              }}>
                <div className="transport-info">
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{option.name}</div>
                  <div style={{ color: '#666' }}>
                    {option.departure} ➝ {option.arrival} {option.nextDay && <span style={{ fontSize: '0.8rem', color: '#ff5722' }}> (+1 Day)</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#888' }}>
                    Duration: {option.duration} • Classes: {option.class}
                  </div>
                </div>
                <div className="transport-price" style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                  <span>₹{option.price}</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      try {
                        const isFlight = option.name.toLowerCase().includes('flight') || option.class.includes('Economy');
                        const type = isFlight ? 'Flight' : (option.name.toLowerCase().includes('bus') ? 'Bus' : 'Train');

                        await api.post('/bookings', {
                          type: 'Transportation',
                          name: option.name,
                          location: `${tripData.origin} -> ${tripData.destination}`,
                          price: option.price,
                          status: 'Confirmed',
                          checkIn: tripData.startDate,
                          checkOut: tripData.startDate,
                          tripId: tripData.id,
                          userId: user.id
                        });

                        await api.post('/expenses', {
                          title: `${type}: ${option.name}`,
                          amount: option.price,
                          category: 'Transportation',
                          date: new Date().toISOString().split('T')[0],
                          tripId: tripData.id,
                          userId: user.id
                        });

                        alert(`Booking confirmed for ${option.name}! Redirecting...`);

                        // Redirect logic
                        if (type === 'Flight') window.open(`https://www.google.com/travel/flights?q=flights+from+${tripData.origin}+to+${tripData.destination}`, '_blank');
                        else if (type === 'Bus') window.open(`https://www.redbus.in/bus-tickets/${tripData.origin}-to-${tripData.destination}`, '_blank');
                        else window.open(`https://www.irctc.co.in/nget/train-search`, '_blank');

                      } catch (e) {
                        console.error(e);
                        alert("Failed to record booking, but redirecting...");
                        window.open(`https://www.google.com/search?q=book+${option.name}+from+${tripData.origin}+to+${tripData.destination}`, '_blank');
                      }
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotels Section */}
      {hotels.length > 0 && (
        <div className="hotels-section card" style={{ marginBottom: '2rem' }}>
          <h3>🏨 Recommended Stays (Budget Aligned)</h3>
          <div className="places-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {hotels.map(place => (
              <div key={place.id} className="place-card" style={{
                border: '1px solid #eee',
                borderRadius: '8px',
                overflow: 'hidden',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{place.name}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    Estimated: ₹{place.price}/night
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem'
                  }}>
                    {place.rating} ★
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                  onClick={async () => {
                    // 1. Create Redirected Booking
                    try {
                      const bookingData = {
                        type: 'Hotel',
                        name: place.name,
                        location: tripData.destination,
                        price: place.price,
                        status: 'Redirected',
                        checkIn: tripData.startDate,
                        checkOut: tripData.endDate, // Or calculate +1 day
                        tripId: tripData.id,
                        userId: user.id,
                        image: '🏨'
                      };

                      // Save Booking
                      await api.post('/bookings', bookingData);

                      // 2. Create Expense
                      await api.post('/expenses', {
                        title: `Hotel: ${place.name}`,
                        amount: place.price,
                        category: 'Accommodation',
                        date: new Date().toISOString().split('T')[0],
                        tripId: tripData.id,
                        userId: user.id
                      });

                      // 3. Redirect
                      alert("Redirecting to booking... Expense added to budget.");
                      window.open(place.booking_url || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place.name)}`, '_blank');

                    } catch (e) {
                      console.error("Booking error", e);
                      // Fallback redirect
                      window.open(place.booking_url || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place.name)}`, '_blank');
                    }
                  }}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restaurants Section */}
      {restaurants.length > 0 && (
        <div className="restaurants-section card" style={{ marginBottom: '2rem' }}>
          <h3>🍽️ Recommended Dining</h3>
          <div className="places-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {restaurants.map(place => (
              <div key={place.id} className="place-card" style={{
                border: '1px solid #eee',
                borderRadius: '8px',
                overflow: 'hidden',
                padding: '1rem'
              }}>
                <div style={{ fontWeight: 'bold' }}>{place.name}</div>
                <div style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                  Avg cost: ₹{place.price} for two
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations && (
        <div className="itinerary-recommendations card">
          <div className="recommendations-header">
            <h3>💡 {selectedMood?.name} Trip Recommendations</h3>
            <button
              className="toggle-recommendations"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              {showRecommendations ? 'Hide' : 'Show'} Tips
            </button>
          </div>
          {showRecommendations && (
            <div className="recommendations-content">
              <div className="recommendations-section">
                <h4>📦 Packing Essentials</h4>
                <ul>
                  {recommendations.packing.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="recommendations-section">
                <h4>✨ Pro Tips</h4>
                <ul>
                  {recommendations.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="itinerary-content">
        <div className="itinerary-sidebar">
          <h3>Select Date</h3>
          <div className="date-list">
            {dates.map(date => (
              <button
                key={date}
                className={`date-item ${selectedDate === date ? 'active' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <FiCalendar />
                <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-full">
            <FiPlus /> Add Event
          </button>
        </div>

        <div className="itinerary-timeline">
          <div className="timeline-header">
            <h2>
              {selectedDate && !isNaN(new Date(selectedDate).getTime()) ? new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Select a Date'}
            </h2>
          </div>
          {filteredItems.length > 0 ? (
            <div className="timeline">
              {filteredItems.map((item, index) => (
                <div key={item.id} className={`timeline-item ${item.hasDelay ? 'delayed' : ''}`}>
                  <div className="timeline-marker">
                    {item.hasDelay && (
                      <div className="delay-indicator" title={`Delayed by ${item.delayMinutes} minutes`}>
                        <FiAlertCircle />
                      </div>
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-time">
                      <FiClock /> {item.time}
                      {item.hasDelay && (
                        <span className="delay-badge" style={{
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          background: '#ffc107',
                          color: '#000',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          +{item.delayMinutes} min
                        </span>
                      )}
                      {item.icon && <span className="timeline-mood-icon">{item.icon}</span>}
                    </div>
                    <h3>{item.title}</h3>
                    <div
                      className="timeline-location"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location + ' ' + item.title)}`, '_blank')}
                      style={{ cursor: 'pointer', color: '#667eea', textDecoration: 'underline' }}
                      title="View on Google Maps"
                    >
                      <FiMapPin /> {item.location}
                    </div>
                    <p>{item.description}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDelayReport(item.id)}
                      >
                        Report Delay
                      </button>
                      {(item.title.toLowerCase().includes('check-in') || item.title.toLowerCase().includes('hotel')) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/booking', {
                            state: {
                              type: 'hotel',
                              searchDestination: item.location,
                              searchDate: item.date
                            }
                          })}
                        >
                          Book Hotel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No events scheduled for this date</p>
              <button className="btn btn-primary">
                <FiPlus /> Add Event
              </button>
            </div>
          )}
        </div>
      </div>

      {showDelayForm && (
        <div className="delay-form-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="delay-form card" style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2>Report Delay</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Report a delay to automatically adjust subsequent activities
            </p>
            <form onSubmit={handleDelaySubmit}>
              <div className="input-group">
                <label>Delay (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={delayFormData.delayMinutes}
                  onChange={(e) => setDelayFormData({
                    ...delayFormData,
                    delayMinutes: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDelayForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiCheckCircle /> Update Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Itinerary


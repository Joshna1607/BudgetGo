import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FiSearch, FiMapPin, FiCalendar, FiDollarSign, FiCheck } from 'react-icons/fi'
import { formatINR } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import './Booking.css'

const Booking = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [bookingType, setBookingType] = useState('all') // all, hotel, flight, train, bus, cab
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [budgetFilter, setBudgetFilter] = useState('')
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')

  // Search State
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDestination, setSearchDestination] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get(`/bookings?userId=${user.id}`)
        console.log("Fetch bookings response:", response)
        if (response && (response.success || Array.isArray(response))) {
          // Handle both wrapper and direct list
          setBookings(Array.isArray(response) ? response : response.data || [])
        }
      } catch (err) {
        console.error("Failed to fetch bookings", err)
        setError('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user])

  // Reset search state when switching tabs
  useEffect(() => {
    setSearchResults(null)
    setSearchOrigin('')
    setSearchDestination('')
    setSearchDate('')
  }, [bookingType])

  // Get latest trip dates for default checkIn/checkOut
  const getTripDates = async () => {
    if (!user?.id) return { checkIn: new Date().toISOString().split('T')[0], checkOut: new Date().toISOString().split('T')[0] }

    try {
      const response = await api.get(`/trips?userId=${user.id}`)
      if (response && response.length > 0) {
        // Use most recent trip
        const latestTrip = response[0]
        return {
          checkIn: latestTrip.startDate || new Date().toISOString().split('T')[0],
          checkOut: latestTrip.endDate || new Date().toISOString().split('T')[0],
          tripId: latestTrip.id
        }
      }
    } catch (e) {
      console.error("Failed to fetch trips for dates", e)
    }

    const today = new Date().toISOString().split('T')[0]
    return { checkIn: today, checkOut: today, tripId: null }
  }

  const locationState = useLocation().state;

  useEffect(() => {
    if (locationState) {
      if (locationState.type) setBookingType(locationState.type);
      if (locationState.searchOrigin) setSearchOrigin(locationState.searchOrigin);
      if (locationState.searchDestination) setSearchDestination(locationState.searchDestination);
      if (locationState.searchDate) setSearchDate(locationState.searchDate);

      // Auto-trigger search if we have destination and date
      if (locationState.searchDestination && locationState.searchDate && locationState.type) {
        setShowBookingForm(true); // Open the form so results are visible
        // Small delay to ensure state updates
        setTimeout(() => {
          handleTransportSearch(locationState.type, locationState.searchDestination, locationState.searchDate);
        }, 500);
      }
    }
  }, []);

  const handleTransportSearch = async (type, destOverride, dateOverride) => {
    const origin = searchOrigin || 'Current Location';
    const destination = destOverride || searchDestination;
    const date = dateOverride || searchDate;

    if (!destination || !date) {
      alert("Please fill in Destination and Date");
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    try {
      const response = await api.post('/transport/search', {
        origin: origin,
        destination: destination,
        date: date,
        type: type
      });

      console.log("Transport search response:", response);

      if (response && response.success && response.data && response.data.results) {
        setSearchResults(response.data.results);
      } else {
        const msg = (response && (response.error || (response.data && response.data.error))) || "No results found. Please check your API Key configuration.";
        alert(msg);
      }
    } catch (e) {
      console.error("Search error", e);
      alert("Failed to search: " + e.message);
    } finally {
      setIsSearching(false);
    }
  }

  // Available transport options for booking
  const availableFlights = [
    { id: 'f1', name: 'Air France AF 123', from: 'New York', to: 'Paris', price: 15800, duration: '8h 30m', departure: '10:00 AM', arrival: '6:30 PM', booking_url: 'https://www.skyscanner.co.in/transport/flights/NYCA/PARI/260312/260315/?adults=1' },
    { id: 'f2', name: 'Emirates EK 456', from: 'New York', to: 'Paris', price: 18200, duration: '9h 15m', departure: '2:00 PM', arrival: '11:15 PM', booking_url: 'https://www.skyscanner.co.in/transport/flights/NYCA/PARI/260312/260315/?adults=1' },
    { id: 'f3', name: 'Lufthansa LH 789', from: 'New York', to: 'Paris', price: 14900, duration: '8h 45m', departure: '6:00 PM', arrival: '2:45 AM', booking_url: 'https://www.skyscanner.co.in/transport/flights/NYCA/PARI/260312/260315/?adults=1' },
  ]

  const availableTrains = [
    { id: 't1', name: 'TGV High Speed', from: 'Paris', to: 'Lyon', price: 1200, duration: '2h 15m', departure: '9:00 AM', arrival: '11:15 AM', booking_url: 'https://www.confirmtkt.com/rbooking-d/trains/from/PARIS/to/LYON/date/12-03-2026' },
    { id: 't2', name: 'Eurostar', from: 'Paris', to: 'London', price: 2500, duration: '2h 30m', departure: '10:30 AM', arrival: '1:00 PM', booking_url: 'https://www.confirmtkt.com/rbooking-d/trains/from/PARIS/to/LONDON/date/12-03-2026' },
  ]

  const availableBuses = [
    { id: 'b1', name: 'FlixBus', from: 'Paris', to: 'Brussels', price: 800, duration: '4h 30m', departure: '8:00 AM', arrival: '12:30 PM', booking_url: 'https://www.redbus.in/bus-tickets/paris-to-brussels?date=12-Mar-2026' },
    { id: 'b2', name: 'Eurolines', from: 'Paris', to: 'Amsterdam', price: 1100, duration: '6h 00m', departure: '7:00 AM', arrival: '1:00 PM', booking_url: 'https://www.redbus.in/bus-tickets/paris-to-amsterdam?date=12-Mar-2026' },
  ]

  const availableCabs = [
    { id: 'c1', name: 'Uber Intercity', from: 'Current Location', to: 'Hotel', price: 300, duration: '30m', type: 'Sedan', booking_url: 'https://m.uber.com/ul' },
    { id: 'c2', name: 'Ola Outstation', from: 'City A', to: 'City B', price: 1500, duration: '4h', type: 'SUV', booking_url: 'https://book.olacabs.com/' },
    { id: 'c3', name: 'Airport Taxi', from: 'Airport', to: 'City Center', price: 500, duration: '45m', type: 'Hatchback', booking_url: 'https://www.google.com/maps/dir/?api=1&destination=City+Center' },
  ]

  const availableHotels = [
    { id: 'h1', name: 'Grand Paris Hotel', location: 'Paris, France', price: 4500, rating: 4.5, amenities: ['WiFi', 'Pool', 'Spa'], booking_url: 'https://www.booking.com/searchresults.html?ss=Paris' },
    { id: 'h2', name: 'Budget Inn Paris', location: 'Paris, France', price: 1200, rating: 3.8, amenities: ['WiFi', 'Breakfast'], booking_url: 'https://www.booking.com/searchresults.html?ss=Paris' },
    { id: 'h3', name: 'Luxury Suites', location: 'Paris, France', price: 6000, rating: 4.8, amenities: ['WiFi', 'Pool', 'Spa', 'Gym'], booking_url: 'https://www.booking.com/searchresults.html?ss=Paris' },
  ]

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || booking.status.toLowerCase() === filter.toLowerCase()
    const matchesType = bookingType === 'all' || booking.type.toLowerCase() === bookingType.toLowerCase()
    const matchesBudget = !budgetFilter || booking.price <= parseFloat(budgetFilter)
    return matchesSearch && matchesFilter && matchesType && matchesBudget
  })

  const handleCreateBooking = async (bookingDetails) => {
    if (!user?.id) {
      alert("Please login to book")
      return
    }

    try {
      const dates = await getTripDates()

      // DEEP LINK REDIRECTION LOGIC
      if (bookingDetails.booking_url) {
        // 1. Save Booking as "Redirected" logic
        const newBooking = {
          ...bookingDetails,
          userId: user.id,
          tripId: dates.tripId || null,
          status: 'Redirected', // Mark as redirected
          checkIn: dates.checkIn,
          checkOut: bookingDetails.checkOut || dates.checkOut
        };

        // Create booking in DB for history
        api.post('/bookings', newBooking).then(res => {
          if (res && (res.success || res.id)) {
            setBookings([res, ...bookings]);
          }
        }).catch(err => console.error("Failed to save redirected booking", err));



        // 3. Redirect
        alert(`Redirection to booking page... Estimated cost: ${formatINR(bookingDetails.price)} added to expenses.`);
        window.open(bookingDetails.booking_url, '_blank');
        return;
      }

      // Fallback to old logic if no booking_url (e.g. internal mock)
      // IRCTC Redirection for Trains (Legacy fallback)
      if (bookingDetails.type === 'Train' && !bookingDetails.booking_url) {
        // ... existing IRCTC logic ...
        const confirmRedirect = window.confirm(
          "You are about to be redirected to the IRCTC website to complete your train booking.\n\n" +
          "After you finish booking on IRCTC, click OK here to save this trip to your dashboard."
        );
        if (confirmRedirect) {
          window.open('https://www.irctc.co.in/nget/train-search', '_blank');
        } else {
          return;
        }
      }

      const newBooking = {
        ...bookingDetails,
        userId: user.id,
        tripId: dates.tripId || null,
        status: 'Confirmed',
        checkIn: dates.checkIn,
        checkOut: bookingDetails.checkOut || dates.checkOut // Use provided checkOut or default
      }

      const response = await api.post('/bookings', newBooking)
      if (response && (response.success || response.id)) {
        setBookings([response, ...bookings])
        setShowBookingForm(false)
        alert("Booking confirmed!")
      } else {
        alert("Failed to create booking")
      }
    } catch (e) {
      console.error("Booking error", e)
      alert("Failed to create booking")
    }
  }

  return (
    <div className="booking">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Manage your trip reservations</p>
      </div>

      {/* Unified Control Bar */}
      <div className="booking-controls">
        <div className="control-group left">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="type-filters">
            {['all', 'hotel', 'flight', 'train', 'bus', 'cab'].map(type => (
              <button
                key={type}
                className={`type-tab ${bookingType === type ? 'active' : ''}`}
                onClick={() => setBookingType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </button>
            ))}
          </div>
        </div>

        <div className="control-group right">
          <button className="btn btn-primary new-booking-trigger" onClick={() => setShowBookingForm(!showBookingForm)}>
            + New Booking
          </button>
        </div>
      </div>

      {showBookingForm && (
        <div className="booking-form">
          <h2>Book New Reservation</h2>
          <div className="booking-tabs">
            <button
              className={`btn ${bookingType === 'hotel' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBookingType('hotel')}
            >
              Hotels
            </button>
            <button
              className={`btn ${bookingType === 'flight' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBookingType('flight')}
            >
              Flights
            </button>
            <button
              className={`btn ${bookingType === 'train' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBookingType('train')}
            >
              Trains
            </button>
            <button
              className={`btn ${bookingType === 'bus' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBookingType('bus')}
            >
              Buses
            </button>
            <button
              className={`btn ${bookingType === 'cab' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBookingType('cab')}
            >
              Cabs
            </button>
          </div>

          {(bookingType === 'train' || bookingType === 'bus' || bookingType === 'flight' || bookingType === 'cab') && (
            <div className="transport-search-form card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#f8f9fa' }}>
              <h3 style={{ marginBottom: '1rem' }}>Search {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}s</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div className="input-group">
                  <label>From</label>
                  <input type="text" value={searchOrigin} onChange={(e) => setSearchOrigin(e.target.value)} placeholder="Origin city" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div className="input-group">
                  <label>To</label>
                  <input type="text" value={searchDestination} onChange={(e) => setSearchDestination(e.target.value)} placeholder="Destination city" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <div className="input-group">
                  <label>Date</label>
                  <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
                <button className="btn btn-primary" onClick={() => handleTransportSearch(bookingType)} disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Search Availability'}
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Search Results */}
          {searchResults && (bookingType === 'train' || bookingType === 'bus' || bookingType === 'flight' || bookingType === 'cab') && (
            <div className="available-options">
              <h3>Search Results</h3>
              <div className="options-grid">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="option-card option-card-flex" style={{ border: '2px solid #667eea' }}>
                    <div className="option-info">
                      <h4 style={{ color: '#2d3748' }}>{result.name} <span style={{ fontSize: '0.8rem', color: '#666', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{result.number}</span></h4>
                      <p>{searchOrigin} → {searchDestination}</p>
                      <p>{result.departure} - {result.arrival} ({result.duration})</p>
                      <p className="option-price">{formatINR(result.price)}</p>
                      {result.features && <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>{result.features.map(f => <span key={f} style={{ fontSize: '0.7rem', border: '1px solid #ddd', padding: '2px 4px', borderRadius: '4px' }}>{f}</span>)}</div>}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      handleCreateBooking({
                        type: result.type,
                        name: result.name,
                        location: `${searchOrigin} → ${searchDestination}`,
                        price: result.price,
                        image: result.type === 'Flight' ? '✈️' : (result.type === 'Train' ? '🚄' : (result.type === 'Bus' ? '🚌' : '🚖')),
                        duration: result.duration,
                        booking_url: result.booking_url
                      })
                    }}>
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookingType === 'hotel' && (
            <div className="available-options">
              <h3>{searchResults ? 'Search Results' : 'Recommended Hotels'}</h3>
              <div className="options-grid">
                {(searchResults || availableHotels).map(hotel => (
                  <div key={hotel.id} className="option-card">
                    <h4>{hotel.name}</h4>
                    <p>{hotel.location}</p>
                    <p>Rating: {hotel.rating} ⭐</p>
                    <p className="option-price">
                      {formatINR(hotel.price)}/night
                    </p>
                    {hotel.amenities && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {hotel.amenities.map(a => <span key={a} style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{a}</span>)}
                      </div>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      handleCreateBooking({
                        type: 'Hotel',
                        name: hotel.name,
                        location: hotel.location,
                        price: hotel.price,
                        image: '🏨',
                        rating: hotel.rating,
                        checkIn: searchDate || new Date().toISOString().split('T')[0],
                        booking_url: hotel.booking_url
                      })
                    }}>
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookingType === 'flight' && !searchResults && (
            <div className="available-options">
              <h3>Popular Flights</h3>
              <div className="options-grid">
                {availableFlights.map(flight => (
                  <div key={flight.id} className="option-card option-card-flex">
                    <div className="option-info">
                      <h4>{flight.name}</h4>
                      <p>{flight.from} → {flight.to}</p>
                      <p>{flight.departure} - {flight.arrival} ({flight.duration})</p>
                      <p className="option-price">
                        {formatINR(flight.price)}
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      handleCreateBooking({
                        type: 'Flight',
                        name: flight.name,
                        location: `${flight.from} → ${flight.to}`,
                        price: flight.price,
                        image: '✈️',
                        duration: flight.duration,
                        booking_url: flight.booking_url
                      })
                    }}>
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookingType === 'train' && !searchResults && (
            <div className="available-options">
              <h3>Popular Trains</h3>
              <div className="options-grid">
                {availableTrains.map(train => (
                  <div key={train.id} className="option-card option-card-flex">
                    <div className="option-info">
                      <h4>{train.name}</h4>
                      <p>{train.from} → {train.to}</p>
                      <p>{train.departure} - {train.arrival} ({train.duration})</p>
                      <p className="option-price">
                        {formatINR(train.price)}
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      handleCreateBooking({
                        type: 'Train',
                        name: train.name,
                        location: `${train.from} → ${train.to}`,
                        price: train.price,
                        image: '🚄',
                        duration: train.duration,
                        booking_url: train.booking_url
                      })
                    }}>
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookingType === 'bus' && !searchResults && (
            <div className="available-options">
              <h3>Popular Buses</h3>
              <div className="options-grid">
                {availableBuses.map(bus => (
                  <div key={bus.id} className="option-card option-card-flex">
                    <div className="option-info">
                      <h4>{bus.name}</h4>
                      <p>{bus.from} → {bus.to}</p>
                      <p>{bus.departure} - {bus.arrival} ({bus.duration})</p>
                      <p className="option-price">
                        {formatINR(bus.price)}
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      handleCreateBooking({
                        type: 'Bus',
                        name: bus.name,
                        location: `${bus.from} → ${bus.to}`,
                        price: bus.price,
                        image: '🚌',
                        duration: bus.duration,
                        booking_url: bus.booking_url
                      })
                    }}>
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookingType === 'cab' && !searchResults && (
            <div className="available-options">
              <h3>Popular Cabs</h3>
              <div className="options-grid">
                {availableCabs.map(cab => (
                  <div key={cab.id} className="option-card option-card-flex">
                    <div className="option-info">
                      <h4>{cab.name}</h4>
                      <p>{cab.from} → {cab.to}</p>
                      <p>{cab.type} • {cab.duration}</p>
                      <p className="option-price">
                        {formatINR(cab.price)}
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      handleCreateBooking({
                        type: 'Cab',
                        name: cab.name,
                        location: `${cab.from} → ${cab.to}`,
                        price: cab.price,
                        image: '🚖',
                        duration: cab.duration,
                        booking_url: cab.booking_url
                      })
                    }}>
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bookings-grid">
        {filteredBookings.map(booking => (
          <div key={booking.id} className="booking-card">
            <div className="booking-header">
              <div className="booking-icon">{booking.image}</div>
              <div className="booking-type">{booking.type}</div>
            </div>
            <div className="booking-body">
              <h3>{booking.name}</h3>
              <div className="booking-location">
                <FiMapPin /> {booking.location}
              </div>
              <div className="booking-dates">
                <div className="date-item">
                  <FiCalendar /> Check-in: {booking.checkIn}
                </div>
                {booking.checkIn !== booking.checkOut && (
                  <div className="date-item">
                    <FiCalendar /> Check-out: {booking.checkOut}
                  </div>
                )}
              </div>
              <div className="booking-price">
                <FiDollarSign /> {formatINR(booking.price)}
              </div>
            </div>
            <div className="booking-footer">
              <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                <FiCheck /> {booking.status}
              </span>
              <button className="btn btn-primary btn-sm">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {
        filteredBookings.length === 0 && (
          <div className="empty-state">
            <p>No bookings found</p>
          </div>
        )
      }
    </div >
  )
}

export default Booking

import React, { useState, useEffect } from 'react'
import {
  FiSearch, FiMapPin, FiStar, FiDollarSign, FiFilter, FiX, FiHeart,
  FiGrid, FiList, FiClock, FiPhone, FiGlobe, FiNavigation, FiShare2,
  FiTrendingUp, FiAward, FiUsers, FiCheckCircle, FiLoader
} from 'react-icons/fi'
import { formatINR } from '../utils/currency'
import { placesService } from '../utils/placesService'
import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import './NearbyLocations.css'

// Lazy load MapComponent to prevent page crash if map fails
const MapComponent = React.lazy(() => import('../components/MapComponent'))

const NearbyLocations = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [minRating, setMinRating] = useState(0)
  const [maxBudget, setMaxBudget] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('rating') // 'rating', 'price', 'distance'
  const [favorites, setFavorites] = useState(new Set())
  const [showFilters, setShowFilters] = useState(true)

  const [loading, setLoading] = useState(true)
  const [activeTrip, setActiveTrip] = useState(null)
  const [allPlaces, setAllPlaces] = useState([])
  const [destinationName, setDestinationName] = useState('')

  useEffect(() => {
    fetchTripAndPlaces()
  }, [user])

  const fetchTripAndPlaces = async () => {
    if (!user || !user.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // 1. Fetch active trip
      const tripsResult = await api.get(`/trips?userId=${user.id}`)
      if (tripsResult.success && tripsResult.data && tripsResult.data.length > 0) {
        const trip = tripsResult.data[0] // Use the most recent/active trip
        setActiveTrip(trip)
        setDestinationName(trip.destination)

        // 2. Get coords for destination
        const coords = await placesService.getCoordinates(trip.destination)
        if (coords) {
          // 3. Fetch places for each category
          const [hotels, restaurants, attractions] = await Promise.all([
            placesService.getPlaces(coords.lat, coords.lon, 'hotel'),
            placesService.getPlaces(coords.lat, coords.lon, 'restaurant'),
            placesService.getPlaces(coords.lat, coords.lon, 'attraction')
          ])

          // 4. Enrich and format data
          const enrichedHotels = placesService.enrichPlacesWithBudget(hotels, 2).map(p => ({
            ...p, category: 'hotels', icon: '🏨', location: p.name, distance: 'Nearby',
            reviews: Math.floor(Math.random() * 500) + 50
          }))
          const enrichedRestaurants = placesService.enrichPlacesWithBudget(restaurants, 2).map(p => ({
            ...p, category: 'restaurants', icon: '🍽️', location: p.name, distance: 'Nearby',
            reviews: Math.floor(Math.random() * 500) + 50,
            cuisine: 'Local'
          }))
          const enrichedAttractions = placesService.enrichPlacesWithBudget(attractions, 1).map(p => ({
            ...p, category: 'attractions', icon: '🗼', location: p.name, distance: 'Nearby',
            reviews: Math.floor(Math.random() * 500) + 50
          }))

          setAllPlaces([...enrichedHotels, ...enrichedRestaurants, ...enrichedAttractions])
        }
      }
    } catch (err) {
      console.error("Failed to load nearby places", err)
    } finally {
      setLoading(false)
    }
  }

  // Helper for mock data fallback if API fails or returns empty (optional, keeping clean for now)
  const recommendations = {
    hotels: [],
    restaurants: [],
    attractions: []
  }

  const toggleFavorite = (placeId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(placeId)) {
        newFavorites.delete(placeId)
      } else {
        newFavorites.add(placeId)
      }
      return newFavorites
    })
  }

  const getFilteredPlaces = () => {
    let filtered = allPlaces.filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.cuisine && place.cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = category === 'all' || place.category === category
      const matchesRating = place.rating >= minRating
      const matchesBudget = !maxBudget || place.price <= parseFloat(maxBudget)
      return matchesSearch && matchesCategory && matchesRating && matchesBudget
    })

    // Sort places
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'price':
          return a.price - b.price
        case 'distance':
          return getDistanceValue(a.distance) - getDistanceValue(b.distance)
        default:
          return 0
      }
    })

    return filtered
  }

  const getDistanceValue = (distance) => {
    return parseFloat(distance.replace(' km', ''))
  }

  const filteredPlaces = getFilteredPlaces()

  return (
    <div className="nearby-locations-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>📍 Nearby {destinationName ? destinationName : 'Places'}</h1>
            <p>Find the best hotels, restaurants, and attractions around your destination</p>
          </div>
          <div className="header-actions">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FiList />
            </button>
            <button
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              <FiFilter />
            </button>
          </div>
        </div>
      </div>

      <div className="recommendations-container">
        {showFilters && (
          <div className="recommendations-sidebar">
            <div className="search-filters card">
              <div className="filters-header">
                <h3>
                  <FiFilter /> Filters & Search
                </h3>
                <button className="clear-filters" onClick={() => {
                  setSearchQuery('')
                  setCategory('all')
                  setMinRating(0)
                  setMaxBudget('')
                }}>
                  Clear All
                </button>
              </div>

              <div className="filter-group">
                <label>Search</label>
                <div className="search-input">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search places..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Category</label>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${category === 'all' ? 'active' : ''}`}
                    onClick={() => setCategory('all')}
                  >
                    All
                  </button>
                  <button
                    className={`filter-btn ${category === 'hotels' ? 'active' : ''}`}
                    onClick={() => setCategory('hotels')}
                  >
                    Hotels
                  </button>
                  <button
                    className={`filter-btn ${category === 'restaurants' ? 'active' : ''}`}
                    onClick={() => setCategory('restaurants')}
                  >
                    Restaurants
                  </button>
                  <button
                    className={`filter-btn ${category === 'attractions' ? 'active' : ''}`}
                    onClick={() => setCategory('attractions')}
                  >
                    Attractions
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <label>Minimum Rating</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                />
                <span>{minRating.toFixed(1)} ⭐</span>
              </div>

              <div className="filter-group">
                <label>Max Budget (₹)</label>
                <input
                  type="number"
                  placeholder="Enter max budget"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="recommendations-main">
          <div className="results-header">
            <div className="results-info">
              <h2>
                {filteredPlaces.length} {filteredPlaces.length === 1 ? 'Place' : 'Places'} Found
              </h2>
              {favorites.size > 0 && (
                <span className="favorites-count">
                  <FiHeart style={{ color: '#e74c3c' }} /> {favorites.size} Saved
                </span>
              )}
            </div>
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="rating">Highest Rated</option>
                <option value="price">Price: Low to High</option>
                <option value="distance">Nearest First</option>
              </select>
            </div>
          </div>

          <div className={`recommendations-${viewMode}`}>
            {filteredPlaces.map(place => (
              <div
                key={place.id}
                className={`recommendation-card ${viewMode === 'list' ? 'list-view' : ''}`}
                onClick={() => setSelectedPlace(place)}
              >
                <div className="card-image-section">
                  <div className="place-icon-large">{place.icon}</div>
                  <button
                    className={`favorite-btn ${favorites.has(place.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(place.id)
                    }}
                    title={favorites.has(place.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <FiHeart />
                  </button>
                  {place.rating >= 4.5 && (
                    <div className="top-rated-badge">
                      <FiAward /> Top Rated
                    </div>
                  )}
                </div>
                <div className="recommendation-content">
                  <div className="recommendation-header">
                    <div className="place-info">
                      <h3>{place.name}</h3>
                      <div className="place-location">
                        <FiMapPin /> {place.location}
                      </div>
                    </div>
                  </div>
                  <div className="recommendation-body">
                    <div className="place-stats">
                      <div className="place-rating">
                        <FiStar className="star-icon" />
                        <span className="rating-value">{place.rating}</span>
                        <span className="reviews-count">({place.reviews?.toLocaleString() || 0})</span>
                        <span className="place-distance">
                          <FiNavigation /> {place.distance}
                        </span>
                      </div>
                    </div>
                    <div className="place-price-section">
                      {place.price === 0 ? (
                        <span className="free-badge">
                          <FiCheckCircle /> Free Entry
                        </span>
                      ) : (
                        <div className="price-info">
                          <span className="price-amount">{formatINR(place.price)}</span>
                          {place.budget && (
                            <span className={`budget-badge ${place.budget}`}>
                              {place.budget}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {place.cuisine && (
                      <div className="place-cuisine">
                        <span className="cuisine-tag">{place.cuisine}</span>
                      </div>
                    )}
                    {place.description && (
                      <p className="place-description">{place.description}</p>
                    )}
                    {place.amenities && place.amenities.length > 0 && (
                      <div className="place-amenities">
                        {place.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="amenity-tag">{amenity}</span>
                        ))}
                        {place.amenities.length > 3 && (
                          <span className="amenity-tag">+{place.amenities.length - 3} more</span>
                        )}
                      </div>
                    )}
                    <div className="card-actions">
                      <button className="action-btn primary" onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlace(place)
                      }}>
                        View Details
                      </button>
                      <button className="action-btn secondary" onClick={(e) => {
                        e.stopPropagation()
                        // Share functionality
                      }}>
                        <FiShare2 />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlaces.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No places found</h3>
              <p>Try adjusting your filters or search criteria</p>
              <button className="btn btn-primary" onClick={() => {
                setSearchQuery('')
                setCategory('all')
                setMinRating(0)
                setMaxBudget('')
              }}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedPlace && (
        <div className="place-modal-overlay" onClick={() => setSelectedPlace(null)}>
          <div className="place-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPlace(null)}>
              <FiX />
            </button>
            <div className="modal-header">
              <div className="modal-icon">{selectedPlace.icon}</div>
              <div className="modal-title-section">
                <h2>{selectedPlace.name}</h2>
                <div className="modal-location">
                  <FiMapPin /> {selectedPlace.location}
                </div>
                <div className="modal-rating">
                  <FiStar className="star-icon" />
                  <span className="rating-value">{selectedPlace.rating}</span>
                  <span className="reviews-count">({selectedPlace.reviews?.toLocaleString() || 0} reviews)</span>
                  <span className="place-distance">
                    <FiNavigation /> {selectedPlace.distance} away
                  </span>
                </div>
              </div>
              <button
                className={`favorite-btn-large ${favorites.has(selectedPlace.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(selectedPlace.id)}
              >
                <FiHeart />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-price-section">
                {selectedPlace.price === 0 ? (
                  <span className="free-badge-large">
                    <FiCheckCircle /> Free Entry
                  </span>
                ) : (
                  <div className="price-display">
                    <span className="price-label">Starting from</span>
                    <span className="price-large">{formatINR(selectedPlace.price)}</span>
                    {selectedPlace.budget && (
                      <span className={`budget-badge-large ${selectedPlace.budget}`}>
                        {selectedPlace.budget} budget
                      </span>
                    )}
                  </div>
                )}
              </div>
              {selectedPlace.description && (
                <div className="modal-section">
                  <h4>About</h4>
                  <p>{selectedPlace.description}</p>
                </div>
              )}
              <div className="modal-details-grid">
                {selectedPlace.openingHours && (
                  <div className="detail-item">
                    <FiClock />
                    <div>
                      <strong>Hours</strong>
                      <p>{selectedPlace.openingHours}</p>
                    </div>
                  </div>
                )}
                {selectedPlace.phone && (
                  <div className="detail-item">
                    <FiPhone />
                    <div>
                      <strong>Phone</strong>
                      <p>{selectedPlace.phone}</p>
                    </div>
                  </div>
                )}
                {selectedPlace.cuisine && (
                  <div className="detail-item">
                    <FiStar />
                    <div>
                      <strong>Cuisine</strong>
                      <p>{selectedPlace.cuisine}</p>
                    </div>
                  </div>
                )}
              </div>
              {selectedPlace.amenities && selectedPlace.amenities.length > 0 && (
                <div className="modal-section">
                  <h4>Amenities & Features</h4>
                  <div className="amenities-grid">
                    {selectedPlace.amenities.map((amenity, idx) => (
                      <div key={idx} className="amenity-item">
                        <FiCheckCircle />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedPlace.reviewsList && selectedPlace.reviewsList.length > 0 && (
                <div className="modal-section">
                  <h4>Recent Reviews</h4>
                  <div className="reviews-list">
                    {selectedPlace.reviewsList.map((review, idx) => (
                      <div key={idx} className="review-item">
                        <div className="review-header">
                          <span className="reviewer-name">{review.user}</span>
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={i < review.rating ? 'filled' : ''}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="review-text">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedPlace(null)}>
                Close
              </button>
              <button className="btn btn-primary">
                <FiNavigation /> Get Directions
              </button>
              <button className="btn btn-primary">
                <FiShare2 /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2d3748', marginBottom: '0.5rem' }}>🗺️ Interactive Map</h2>
          <p style={{ color: '#718096' }}>Explore hotels, restaurants, and attractions visually</p>
        </div>
      </div>

      <div className="map-section">
        <React.Suspense fallback={<div className="map-loading">Loading Map...</div>}>
          <MapComponent />
        </React.Suspense>
      </div>
    </div>
  )
}

export default NearbyLocations


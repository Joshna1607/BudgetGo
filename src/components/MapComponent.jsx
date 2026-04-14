import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { FiNavigation, FiSearch } from 'react-icons/fi'
import L from 'leaflet'
import { placesService } from '../utils/placesService'
import 'leaflet/dist/leaflet.css'
import './MapComponent.css'

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Sub-component to handle map centering logic
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15);
    }
  }, [center, map]);
  return null;
};

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState(null)
  const [center, setCenter] = useState({ lat: 28.6139, lon: 77.2090 }) // Default: Delhi
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [placeType, setPlaceType] = useState('restaurant')

  useEffect(() => {
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(loc);
          setCenter(loc);
          fetchNearbyPlaces(loc.lat, loc.lon, placeType);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLoading(false);
          setError("Could not get location. Showing default.");
          // Still fetch for default location
          fetchNearbyPlaces(center.lat, center.lon, placeType);
        }
      )
    } else {
      setLoading(false);
      setError("Geolocation not supported.");
      fetchNearbyPlaces(center.lat, center.lon, placeType);
    }
  }, []);

  const fetchNearbyPlaces = async (lat, lon, type) => {
    setLoading(true);
    try {
      // Mapping existing filter types to Overpass types expected by placesService
      // map component types: 'restaurant', 'lodging' (hotel), 'tourist_attraction', 'gas_station'
      // placesService types: 'restaurant', 'hotel', 'attraction'

      let serviceType = 'restaurant';
      if (type === 'lodging') serviceType = 'hotel';
      if (type === 'tourist_attraction') serviceType = 'attraction';
      if (type === 'gas_station') serviceType = 'restaurant'; // fallback or add support later

      const places = await placesService.getPlaces(lat, lon, serviceType);

      // Enrich with dummy data for display since Overpass gives minimal tags
      const enriched = placesService.enrichPlacesWithBudget(places, 2);
      setNearbyPlaces(enriched);
    } catch (err) {
      console.error("Error fetching places:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceTypeChange = (type) => {
    setPlaceType(type);
    if (center) {
      fetchNearbyPlaces(center.lat, center.lon, type);
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const coords = await placesService.getCoordinates(searchQuery);
    if (coords) {
      const loc = { lat: parseFloat(coords.lat), lon: parseFloat(coords.lon) };
      setCenter(loc);
      fetchNearbyPlaces(loc.lat, loc.lon, placeType);
    } else {
      alert('Location not found');
    }
    setLoading(false);
  }

  return (
    <div className="map-component-leaflet">
      <div className="map-sidebar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search city/place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Go</button>
        </div>
        <div className="place-type-filters">
          <button className={placeType === 'restaurant' ? 'active' : ''} onClick={() => handlePlaceTypeChange('restaurant')}>🍽️ Food</button>
          <button className={placeType === 'lodging' ? 'active' : ''} onClick={() => handlePlaceTypeChange('lodging')}>🏨 Stay</button>
          <button className={placeType === 'tourist_attraction' ? 'active' : ''} onClick={() => handlePlaceTypeChange('tourist_attraction')}>🗼 Visit</button>
        </div>

        <div className="places-list">
          {loading ? <p>Loading places...</p> : (
            nearbyPlaces.length > 0 ? nearbyPlaces.map(p => (
              <div key={p.id} className="place-item" onClick={() => setCenter({ lat: p.lat, lon: p.lon })}>
                <h4>{p.name}</h4>
                <p>{p.type}</p>
              </div>
            )) : <p>No places found nearby.</p>
          )}
        </div>
      </div>

      <div className="map-container">
        <MapContainer center={[center.lat, center.lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={[center.lat, center.lon]} />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lon]}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {/* Places Markers */}
          {nearbyPlaces.map(place => (
            <Marker key={place.id} position={[place.lat, place.lon]}>
              <Popup>
                <strong>{place.name}</strong><br />
                {place.type}
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <button className="center-btn" onClick={() => userLocation && setCenter(userLocation)}>
          <FiNavigation /> My Location
        </button>
      </div>
    </div>
  )
}

export default MapComponent

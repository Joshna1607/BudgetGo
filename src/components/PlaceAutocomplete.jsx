import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin } from 'react-icons/fi';

const PlaceAutocomplete = ({ value, onChange, placeholder, required, name }) => {
    const fieldName = name || 'destination';
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Update local query when value prop changes
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2 && showSuggestions) {
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                            query
                        )}&limit=5&addressdetails=1`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setSuggestions(data);
                    }
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                }
            } else if (query.length <= 2) {
                setSuggestions([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query, showSuggestions]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowSuggestions(true);
        onChange({ target: { name: fieldName, value: val } });
    };

    const handleSelect = (place) => {
        const displayName = place.display_name;
        setQuery(displayName);
        setSuggestions([]);
        setShowSuggestions(false);
        onChange({ target: { name: fieldName, value: displayName } });
    };

    return (
        <div className="place-autocomplete-wrapper" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                id={fieldName}
                name={fieldName}
                value={query}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '0 0 4px 4px',
                    listStyleType: 'none',
                    padding: 0,
                    margin: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {suggestions.map((place) => (
                        <li
                            key={place.place_id}
                            onClick={() => handleSelect(place)}
                            style={{
                                padding: '10px 15px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            <FiMapPin size={14} color="#666" />
                            <span>{place.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PlaceAutocomplete;

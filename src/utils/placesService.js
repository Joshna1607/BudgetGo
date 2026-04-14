// Service to fetch real places using OpenStreetMap APIs

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

export const placesService = {
    // Get coordinates for a city
    async getCoordinates(query) {
        try {
            const response = await fetch(
                `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: data[0].lat,
                    lon: data[0].lon,
                    displayName: data[0].display_name
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            return null;
        }
    },

    // Fetch real places (POIs) using Overpass API
    async getPlaces(lat, lon, category) {
        let query = '';

        switch (category) {
            case 'attraction':
                query = `
          [out:json][timeout:25];
          (
            node["tourism"="attraction"](around:5000,${lat},${lon});
            way["tourism"="attraction"](around:5000,${lat},${lon});
            node["historic"="monument"](around:5000,${lat},${lon});
            node["leisure"="park"](around:5000,${lat},${lon});
          );
          out body;
          >;
          out skel qt;
        `;
                break;
            case 'hotel':
                query = `
          [out:json][timeout:25];
          (
            node["tourism"="hotel"](around:5000,${lat},${lon});
            node["tourism"="guest_house"](around:5000,${lat},${lon});
          );
          out body;
        `;
                break;
            case 'restaurant':
                query = `
          [out:json][timeout:25];
          (
            node["amenity"="restaurant"](around:2000,${lat},${lon});
            node["amenity"="cafe"](around:2000,${lat},${lon});
          );
          out body;
        `;
                break;
            default:
                return [];
        }

        try {
            const response = await fetch(`${OVERPASS_BASE}?data=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error(`Overpass API Error: ${response.status}`);

            const data = await response.json();
            if (!data || !data.elements) return [];

            const results = data.elements.map(el => ({
                id: el.id,
                name: el.tags.name,
                type: el.tags.tourism || el.tags.amenity || el.tags.historic,
                lat: el.lat,
                lon: el.lon
            })).filter(item => item.name);

            if (results.length === 0) throw new Error("No results found");
            return results;

        } catch (error) {
            console.warn(`Error fetching ${category} (using fallback):`, error);
            // Fallback to MOCK logic if API fails
            const mockNames = category === 'hotel' ? ['Grand Hotel', 'City Stay', 'Budget Inn']
                : category === 'restaurant' ? ['Tasty Bites', 'City Cafe', 'Spicy Treat']
                    : ['City Museum', 'Central Park', 'Historic Fort'];

            return mockNames.map((name, i) => ({
                id: `mock-${i}`,
                name: `${name} (Demo)`,
                type: category,
                lat: lat + (Math.random() * 0.01 - 0.005),
                lon: lon + (Math.random() * 0.01 - 0.005)
            }));
        }
    },

    // Assign estimated prices based on names/types (Mock logic on real data)
    enrichPlacesWithBudget(places, budgetLevel) {
        return places.map(place => {
            let price = 0;
            let rating = (3.5 + Math.random() * 1.5).toFixed(1);

            // Simple heuristic for price
            if (place.name.includes('Grand') || place.name.includes('Plaza') || place.name.includes('Resort')) {
                price = 5000 + Math.floor(Math.random() * 10000);
            } else if (place.name.includes('Inn') || place.name.includes('Guest')) {
                price = 1000 + Math.floor(Math.random() * 2000);
            } else {
                price = 2000 + Math.floor(Math.random() * 3000);
            }

            // Adjust for "Restaurants"
            if (place.type === 'restaurant' || place.type === 'cafe') {
                price = 300 + Math.floor(Math.random() * 1000);
            }

            return {
                ...place,
                price,
                rating,
                image: `https://source.unsplash.com/400x300/?${place.type},${encodeURIComponent(place.name.split(' ')[0])}`,
                booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place.name)}`
            };
        }).sort((a, b) => {
            // Sort by how close the price is to a "target" based on budgetLevel
            // 1=Low, 2=Med, 3=High
            const target = budgetLevel === 1 ? 1500 : (budgetLevel === 3 ? 8000 : 3500);
            return Math.abs(a.price - target) - Math.abs(b.price - target);
        }).slice(0, 10); // Take top 10 relevant matches
    }
};

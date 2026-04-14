# Google Maps API Setup Guide

To use the live location and nearby places feature, you need to set up a Google Maps API key.

## Steps to Get Your API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select an existing one)
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "BudgetGo")
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable:
     - **Maps JavaScript API**
     - **Places API**
     - **Geocoding API** (optional, for address lookups)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

5. **Restrict Your API Key** (Recommended for production)
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:5173/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Choose: Maps JavaScript API, Places API, Geocoding API
   - Click "Save"

## Add API Key to Your App

1. Open `src/components/MapComponent.jsx`

2. Find this line (around line 18):
   ```javascript
   script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`
   ```

3. Replace `YOUR_API_KEY` with your actual API key:
   ```javascript
   script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places`
   ```

## Alternative: Use Environment Variable (Recommended)

For better security, use an environment variable:

1. Create a `.env` file in the root directory:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Update `MapComponent.jsx`:
   ```javascript
   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'
   script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
   ```

3. Add `.env` to `.gitignore` to keep your key secure

## Features Available

Once set up, you'll have access to:
- ✅ Your current location on the map
- ✅ Nearby restaurants, hotels, attractions
- ✅ Search for places
- ✅ Filter by place type
- ✅ View place details and ratings
- ✅ Get directions (when implemented)

## Free Tier Limits

Google Maps API has a free tier:
- $200 free credit per month
- Maps JavaScript API: $7 per 1,000 requests
- Places API: Various pricing based on request type

For development and small projects, the free tier is usually sufficient.

## Troubleshooting

**Map not loading?**
- Check browser console for errors
- Verify API key is correct
- Ensure required APIs are enabled
- Check API key restrictions

**"This page can't load Google Maps correctly"**
- API key might be invalid or restricted
- Billing might not be enabled (required even for free tier)
- Check API quotas in Google Cloud Console

**Location not working?**
- Browser may be blocking geolocation
- Check browser permissions for location access
- HTTPS is required for geolocation (localhost works without HTTPS)

## Note

The app includes fallback mock data if the Google Maps API is not configured, so you can still see the UI and functionality, but it won't show real locations.


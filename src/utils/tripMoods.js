/**
 * Trip Moods and Itinerary Generator
 * Generates day plans based on trip mood/type
 */

export const tripMoods = [
  {
    id: 'adventure',
    name: 'Adventure',
    icon: '🏔️',
    description: 'Thrilling activities, outdoor sports, and adrenaline-pumping experiences',
    color: '#dc3545'
  },
  {
    id: 'devotional',
    name: 'Devotional',
    icon: '🕉️',
    description: 'Spiritual journeys, temple visits, and religious sites',
    color: '#667eea'
  },
  {
    id: 'trekking',
    name: 'Trekking',
    icon: '🥾',
    description: 'Mountain trails, hiking, and nature exploration',
    color: '#28a745'
  },
  {
    id: 'beach',
    name: 'Beach',
    icon: '🏖️',
    description: 'Relaxing beach activities, water sports, and coastal experiences',
    color: '#17a2b8'
  },
  {
    id: 'cultural',
    name: 'Cultural',
    icon: '🏛️',
    description: 'Historical sites, museums, local traditions, and heritage',
    color: '#ffc107'
  },
  {
    id: 'romantic',
    name: 'Romantic',
    icon: '💑',
    description: 'Intimate experiences, scenic spots, and couple activities',
    color: '#e91e63'
  },
  {
    id: 'family',
    name: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Family-friendly activities, parks, and kid-friendly attractions',
    color: '#9c27b0'
  },
  {
    id: 'food',
    name: 'Food & Culinary',
    icon: '🍜',
    description: 'Local cuisine, food tours, cooking classes, and restaurants',
    color: '#ff9800'
  },
  {
    id: 'wildlife',
    name: 'Wildlife',
    icon: '🦁',
    description: 'Safaris, national parks, wildlife sanctuaries, and nature',
    color: '#795548'
  },
  {
    id: 'wellness',
    name: 'Wellness',
    icon: '🧘',
    description: 'Spa, yoga, meditation, and relaxation retreats',
    color: '#4caf50'
  }
]

/**
 * Generate itinerary suggestions based on mood and destination
 */
export const generateItineraryByMood = (mood, destination, days) => {
  const moodData = tripMoods.find(m => m.id === mood)
  if (!moodData) return []

  const baseActivities = {
    adventure: [
      'Paragliding or Skydiving',
      'Rock Climbing',
      'River Rafting',
      'Bungee Jumping',
      'Mountain Biking',
      'Zip-lining',
      'Scuba Diving',
      'ATV Rides',
      'Cave Exploration',
      'Water Sports'
    ],
    devotional: [
      'Temple Visit - Morning Darshan',
      'Attend Aarti Ceremony',
      'Meditation Session',
      'Pilgrimage Site Exploration',
      'Religious Museum Visit',
      'Spiritual Walk',
      'Charity/Seva Activity',
      'Evening Prayers',
      'Religious Festival (if applicable)',
      'Blessing Ceremony'
    ],
    trekking: [
      'Early Morning Trek Start',
      'Nature Photography',
      'Camping Setup',
      'Mountain Peak Climb',
      'Forest Trail Exploration',
      'Waterfall Visit',
      'Sunrise/Sunset Viewing',
      'Wildlife Spotting',
      'Rest at Base Camp',
      'Stargazing'
    ],
    beach: [
      'Beach Sunrise',
      'Swimming & Water Sports',
      'Beach Volleyball',
      'Snorkeling',
      'Beachside Relaxation',
      'Sunset Beach Walk',
      'Beach Bonfire',
      'Seafood Dinner',
      'Beach Games',
      'Island Hopping'
    ],
    cultural: [
      'Historical Monument Visit',
      'Museum Tour',
      'Local Market Exploration',
      'Traditional Art Workshop',
      'Cultural Show/Performance',
      'Heritage Walk',
      'Local Cuisine Tasting',
      'Traditional Craft Shopping',
      'Historical Site Photography',
      'Cultural Festival (if applicable)'
    ],
    romantic: [
      'Sunrise/Sunset Viewing',
      'Romantic Dinner',
      'Couple Spa Session',
      'Scenic Walk',
      'Boat Ride',
      'Photography Session',
      'Wine Tasting',
      'Stargazing',
      'Private Beach Time',
      'Romantic Candlelight Dinner'
    ],
    family: [
      'Theme Park Visit',
      'Zoo or Aquarium',
      'Family Picnic',
      'Interactive Museum',
      'Children\'s Park',
      'Family Games',
      'Kid-Friendly Restaurant',
      'Educational Tour',
      'Family Photo Session',
      'Evening Entertainment'
    ],
    food: [
      'Local Market Food Tour',
      'Cooking Class',
      'Street Food Exploration',
      'Fine Dining Experience',
      'Food Festival Visit',
      'Local Restaurant Hopping',
      'Food Photography',
      'Wine/Beer Tasting',
      'Dessert Tour',
      'Traditional Meal Experience'
    ],
    wildlife: [
      'Early Morning Safari',
      'Wildlife Photography',
      'Bird Watching',
      'Nature Walk',
      'Wildlife Documentary Session',
      'Evening Safari',
      'Conservation Center Visit',
      'Nature Photography',
      'Wildlife Spotting',
      'Campfire with Nature Sounds'
    ],
    wellness: [
      'Morning Yoga Session',
      'Meditation',
      'Spa Treatment',
      'Nature Walk',
      'Wellness Workshop',
      'Healthy Meal',
      'Aromatherapy Session',
      'Reiki/Healing Session',
      'Evening Relaxation',
      'Wellness Consultation'
    ]
  }

  const activities = baseActivities[mood] || []
  const itinerary = []

  for (let day = 1; day <= days; day++) {
    const dayActivities = []
    const activitiesPerDay = Math.min(3, Math.ceil(activities.length / days))

    // Select activities for this day
    const startIndex = ((day - 1) * activitiesPerDay) % activities.length
    for (let i = 0; i < activitiesPerDay && i < activities.length; i++) {
      const activityIndex = (startIndex + i) % activities.length
      dayActivities.push(activities[activityIndex])
    }

    // Add common activities
    if (day === 1) {
      // Add Arrival and Check-in at the beginning
      // Order: Arrival -> Check-in -> Other Activities
      dayActivities.unshift(`Arrival at ${destination}`, 'Hotel Check-in')
    }
    if (day === days) {
      dayActivities.push('Hotel Check-out')
      dayActivities.push(`Departure from ${destination}`)
    }

    itinerary.push({
      day: `Day ${day}`,
      activities: dayActivities,
      mood: moodData.name,
      icon: moodData.icon
    })
  }

  return itinerary
}

/**
 * Get mood-specific recommendations
 */
export const getMoodRecommendations = (mood) => {
  const recommendations = {
    adventure: {
      packing: ['Hiking boots', 'Adventure gear', 'First aid kit', 'Water bottle', 'Energy bars'],
      tips: ['Start early in the morning', 'Stay hydrated', 'Follow safety guidelines', 'Check weather conditions']
    },
    devotional: {
      packing: ['Traditional attire', 'Prayer items', 'Comfortable walking shoes', 'Water bottle'],
      tips: ['Respect local customs', 'Dress modestly', 'Check temple timings', 'Carry cash for donations']
    },
    trekking: {
      packing: ['Trekking shoes', 'Backpack', 'Trekking poles', 'Rain gear', 'First aid kit', 'Snacks'],
      tips: ['Start with easy trails', 'Carry sufficient water', 'Inform someone about your route', 'Check weather']
    },
    beach: {
      packing: ['Swimwear', 'Sunscreen', 'Beach towel', 'Sunglasses', 'Hat', 'Waterproof bag'],
      tips: ['Apply sunscreen regularly', 'Stay hydrated', 'Respect marine life', 'Check tide timings']
    },
    cultural: {
      packing: ['Comfortable shoes', 'Camera', 'Guidebook', 'Notebook', 'Cash for markets'],
      tips: ['Learn local customs', 'Respect photography rules', 'Try local cuisine', 'Interact with locals']
    },
    romantic: {
      packing: ['Camera', 'Comfortable clothes', 'Romantic accessories', 'Picnic items'],
      tips: ['Book in advance', 'Check weather', 'Plan surprises', 'Capture memories']
    },
    family: {
      packing: ['Kids essentials', 'First aid kit', 'Snacks', 'Entertainment items', 'Comfortable clothes'],
      tips: ['Plan kid-friendly activities', 'Keep snacks handy', 'Take breaks', 'Safety first']
    },
    food: {
      packing: ['Comfortable clothes', 'Camera', 'Notebook', 'Water bottle', 'Digestive aids'],
      tips: ['Try local specialties', 'Ask locals for recommendations', 'Stay hydrated', 'Pace yourself']
    },
    wildlife: {
      packing: ['Binoculars', 'Camera', 'Neutral colored clothes', 'Insect repellent', 'Notebook'],
      tips: ['Early morning is best', 'Stay quiet', 'Follow guide instructions', 'Respect wildlife']
    },
    wellness: {
      packing: ['Yoga mat', 'Comfortable clothes', 'Water bottle', 'Journal', 'Essential oils'],
      tips: ['Wake up early', 'Stay hydrated', 'Practice mindfulness', 'Disconnect from devices']
    }
  }

  return recommendations[mood] || { packing: [], tips: [] }
}


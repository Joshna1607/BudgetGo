export const DEMO_USER = {
    id: 'demo-user-123',
    name: 'Demo User',
    email: 'user@budgetgo.com',
    role: 'user',
    isDemo: true
};

export const DEMO_DATA = {
    trips: [
        {
            id: 101,
            tripName: 'Paris Adventure',
            destination: 'Paris, France',
            startDate: '2024-06-15',
            endDate: '2024-06-20',
            budget: 250000,
            status: 'Upcoming',
            travelers: 4,
            days: 6,
            description: 'Experiencing the magic of Paris: Eiffel Tower, Louvre, and Croissants!',
            itinerary: [
                { day: 'Day 1', date: '2024-06-15', activities: ['Arrival at CDG Airport', 'Check-in at Hotel Grand Paris', 'Evening walk by the Seine'] },
                { day: 'Day 2', date: '2024-06-16', activities: ['Eiffel Tower Summit Tour', 'Picnic at Champ de Mars', 'River Cruise'] },
                { day: 'Day 3', date: '2024-06-17', activities: ['Louvre Museum', 'Lunch at a classic Bistro', 'Notre Dame Cathedral'] },
                { day: 'Day 4', date: '2024-06-18', activities: ['Day trip to Versailles', 'Shopping at Galeries Lafayette'] },
                { day: 'Day 5', date: '2024-06-19', activities: ['Montmartre & Sacré-Cœur', 'Farewell Dinner'] },
                { day: 'Day 6', date: '2024-06-20', activities: ['Breakfast', 'Departure'] }
            ]
        },
        {
            id: 102,
            tripName: 'Beach Weekend',
            destination: 'Goa, India',
            startDate: '2024-02-10',
            endDate: '2024-02-14',
            budget: 50000,
            status: 'Completed',
            travelers: 2,
            days: 5,
            description: 'Relaxing weekend at the beach.',
            itinerary: []
        }
    ],
    expenses: [
        { id: 1, category: 'Flight', amount: 80000, date: '2024-03-01', description: 'Round trip flights for 2', paidBy: 'Demo User' },
        { id: 2, category: 'Accommodation', amount: 60000, date: '2024-03-10', description: 'Hotel Grand Paris Booking', paidBy: 'Demo User' },
        { id: 3, category: 'Activities', amount: 12000, date: '2024-06-16', description: 'Eiffel Tower Tickets', paidBy: 'John' },
        { id: 4, category: 'Food', amount: 5000, date: '2024-06-16', description: 'Dinner at Le Jules Verne', paidBy: 'Demo User' },
        { id: 5, category: 'Transportation', amount: 4000, date: '2024-06-15', description: 'Airport Taxi', paidBy: 'Sarah' },
        { id: 6, category: 'Shopping', amount: 15000, date: '2024-06-18', description: 'Souvenirs', paidBy: 'Demo User' }
    ],
    members: ['Demo User', 'John', 'Sarah', 'Mike']
};

/**
 * Transport Options Generator
 * Simulates train and transport options between cities
 */

export const generateTransportOptions = (origin, destination, date) => {
    if (!origin || !destination) return [];

    // Simple hashing function to generate consistent results for same inputs
    const hash = (str) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        }
        return h;
    };

    const seed = Math.abs(hash(origin + destination + date));
    const options = [];

    // Clean city names for display
    const fromCity = origin.split(',')[0].trim();
    const toCity = destination.split(',')[0].trim();

    // Generate 2-4 train options
    const numTrains = 2 + (seed % 3);

    for (let i = 0; i < numTrains; i++) {
        const isExpress = (seed + i) % 2 === 0;
        const trainNumber = 12000 + (seed % 1000) + i * 5;

        // Generate times
        const startHour = 6 + ((seed + i * 3) % 14); // 6 AM to 8 PM
        const startMin = ((seed + i * 15) % 4) * 15;
        const durationHours = 4 + ((seed + i * 2) % 12); // 4 to 16 hours

        // Format times
        const depTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

        // Calculate arrival
        let arrHour = startHour + durationHours;
        let nextDay = false;
        if (arrHour >= 24) {
            arrHour -= 24;
            nextDay = true;
        }
        const arrTime = `${String(arrHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

        options.push({
            id: `train-${i}`,
            type: 'train',
            name: `${fromCity} - ${toCity} ${isExpress ? 'Express' : 'Superfast'} (${trainNumber})`,
            mode: 'Train',
            icon: '🚆',
            departure: depTime,
            arrival: arrTime,
            duration: `${durationHours}h`,
            price: 500 + ((seed + i * 100) % 1500),
            class: isExpress ? 'CC, EC' : 'SL, 3A, 2A',
            nextDay: nextDay
        });
    }

    // --- TRAINS ---
    // (Existing train logic handled above in loop, keeping options populated)

    // --- BUSES ---
    const numBuses = 2 + ((seed + 1) % 4);
    for (let i = 0; i < numBuses; i++) {
        const isAC = (seed + i) % 2 !== 0;
        const startHour = 18 + ((seed + i * 2) % 6); // Evening buses
        const durationHours = 6 + ((seed + i) % 10);

        const depTime = `${String(startHour).padStart(2, '0')}:00`;
        let arrHour = startHour + durationHours;
        let nextDay = false;
        if (arrHour >= 24) { arrHour -= 24; nextDay = true; }
        const arrTime = `${String(arrHour).padStart(2, '0')}:00`;

        options.push({
            id: `bus-${i}`,
            type: 'bus',
            name: `${isAC ? 'Volvo AC Multi-Axle' : 'Deluxe Express'} Bus`,
            mode: 'Bus',
            icon: '🚌',
            departure: depTime,
            arrival: arrTime,
            duration: `${durationHours}h`,
            price: 400 + ((seed + i * 50) % 1000),
            class: isAC ? 'Semi-Sleeper, AC' : 'Seater, Non-AC',
            nextDay: nextDay
        });
    }

    // --- CABS ---
    const distance = 100 + (seed % 400); // Mock distance
    const cabPrice = distance * 12; // approx 12 rs/km
    const cabDuration = Math.round(distance / 50); // 50 km/h avg

    options.push({
        id: `cab-1`,
        type: 'cab',
        name: `Private Taxi / Cab`,
        mode: 'Cab',
        icon: '🚖',
        departure: 'Anytime',
        arrival: `+${cabDuration}h`,
        duration: `${cabDuration}h`,
        price: cabPrice,
        class: 'Sedan (4 Seater)',
        nextDay: false,
        note: `Approx ${distance} km`
    });

    // Sort by price (Budget friendly first implied request)
    return options.sort((a, b) => a.price - b.price);
};

# BudgetGo - Trip Planner Web Application

A modern, interactive trip planning web application built with React.js. BudgetGo helps users plan, manage, and track their trips with features including itinerary management, expense tracking, booking management, and more.

## Features

- **Login Page** - Secure user authentication
- **Dashboard** - Overview of trips, expenses, and quick actions
- **Trip Creation** - Create and plan new trips with detailed information
- **Itinerary** - View and manage day-by-day trip schedules
- **Booking** - Manage hotel, flight, and activity bookings
- **Expense Manager** - Track expenses by category with visual breakdowns
- **Chat** - Real-time chat support for trip planning assistance
- **Photo Gallery** - Upload and view trip photos
- **Payment** - Secure payment processing for bookings
- **Trip Summary** - Complete overview of trip details, expenses, and bookings

## Tech Stack

- **React.js** - Frontend framework
- **React Router** - Navigation and routing
- **Vite** - Build tool and development server
- **React Icons** - Icon library
- **CSS3** - Styling with modern design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
BudgetGo FE/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Main layout with navigation
│   │   └── Layout.css
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   ├── Dashboard.jsx        # Dashboard page
│   │   ├── TripCreation.jsx    # Trip creation page
│   │   ├── Itinerary.jsx        # Itinerary page
│   │   ├── Booking.jsx          # Booking management page
│   │   ├── ExpenseManager.jsx  # Expense tracking page
│   │   ├── Chat.jsx             # Chat support page
│   │   ├── PhotoGallery.jsx     # Photo gallery page
│   │   ├── Payment.jsx           # Payment page
│   │   └── TripSummary.jsx      # Trip summary page
│   ├── App.jsx                  # Main app component with routing
│   ├── App.css
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Usage

1. **Login**: Use any email and password to login (authentication is simulated)
2. **Dashboard**: View your trip overview and quick stats
3. **Create Trip**: Fill out the form to create a new trip
4. **Manage Itinerary**: Add and view events for each day of your trip
5. **Track Expenses**: Add expenses and view breakdowns by category
6. **View Bookings**: See all your confirmed and pending bookings
7. **Chat**: Get help from travel agents
8. **Gallery**: Upload and view trip photos
9. **Payment**: Process payments for bookings
10. **Summary**: View complete trip overview

## Features in Detail

### Responsive Design
- Mobile-friendly layout
- Responsive navigation with sidebar
- Adaptive grid layouts

### Modern UI/UX
- Gradient color schemes
- Smooth transitions and animations
- Intuitive navigation
- Clean, modern design

### Interactive Components
- Real-time chat interface
- Photo gallery with modal view
- Expense charts and visualizations
- Timeline-based itinerary view

## Notes

- Authentication is currently simulated using localStorage
- Data is stored in component state (not persisted)
- In a production app, you would connect to a backend API
- Payment processing is simulated

## License

This project is created for educational purposes.


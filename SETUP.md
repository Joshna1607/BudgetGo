# BudgetGo Full Stack Setup Guide

## Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8.0+
- Eclipse IDE (for backend)

## Backend Setup (Spring Boot)

1. **Database Setup**
   - Create MySQL database: `budgetgo`
   - Update `backend/src/main/resources/application.properties` with your MySQL credentials:
     ```
     spring.datasource.url=jdbc:mysql://localhost:3306/budgetgo
     spring.datasource.username=root
     spring.datasource.password=YOUR_PASSWORD
     ```

2. **Run Backend in Eclipse**
   - Import the `backend` folder as Maven project in Eclipse
   - Right-click `BudgetGoBackendApplication.java` → Run As → Spring Boot App
   - Backend will start on `http://localhost:4000`
   - Database tables will be created automatically (JPA auto-create)

3. **Verify Backend**
   - Health check: `http://localhost:4000/api/health`
   - Should return: `{"ok":true,"service":"budgetgo-backend","status":"up"}`

## Frontend Setup (React + Vite)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Frontend will start on `http://localhost:5173` (or similar port)

## Default Login Credentials

After running the backend, these users are automatically created:

- **Admin User:**
  - Email: `admin@budgetgo.com`
  - Password: `admin123`
  - Role: `admin`

- **Demo User:**
  - Email: `user@budgetgo.com`
  - Password: `user123`
  - Role: `user`

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Trips
- `GET /api/trips?userId={id}` - Get user's trips
- `POST /api/trips` - Create trip
- `GET /api/trips/{id}` - Get trip by ID
- `PUT /api/trips/{id}` - Update trip
- `DELETE /api/trips/{id}` - Delete trip

### Bookings
- `GET /api/bookings?userId={id}` - Get user's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{id}` - Get booking by ID
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Delete booking

### Expenses
- `GET /api/expenses?userId={id}` - Get user's expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/{id}` - Get expense by ID
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

### Payments
- `GET /api/payments?userId={id}` - Get user's payments
- `POST /api/payments` - Create payment
- `GET /api/payments/{id}` - Get payment by ID
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Delete payment

## Database Schema

The following tables are automatically created:
- `users` - User accounts
- `trips` - Trip plans
- `bookings` - Hotel/flight/train bookings
- `expenses` - Trip expenses
- `payments` - Payment records

## Troubleshooting

1. **Backend won't start:**
   - Check MySQL is running
   - Verify database credentials in `application.properties`
   - Check port 4000 is not in use

2. **Frontend can't connect to backend:**
   - Ensure backend is running on port 4000
   - Check CORS configuration in `CorsConfig.java`
   - Verify API URL in `src/config/api.js`

3. **Database errors:**
   - Ensure MySQL is running
   - Check database exists: `CREATE DATABASE budgetgo;`
   - Verify user has proper permissions

## Features Implemented

✅ User authentication (login/register)
✅ JWT token generation
✅ Password hashing (BCrypt)
✅ Trip management (CRUD)
✅ Booking management (CRUD)
✅ Expense tracking (CRUD)
✅ Payment processing (CRUD)
✅ Admin dashboard
✅ CORS configuration
✅ Database integration (MySQL + JPA)

## Next Steps

1. Update Booking.jsx to use `/api/bookings` API
2. Update ExpenseManager.jsx to use `/api/expenses` API
3. Update Payment.jsx to use `/api/payments` API
4. Add JWT authentication filter for protected endpoints
5. Add input validation and error handling
6. Add loading states throughout frontend


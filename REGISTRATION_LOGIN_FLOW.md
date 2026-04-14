# Registration and Login Flow - Complete Guide

## ✅ How It Works

### Registration Process
1. User fills registration form with:
   - Full Name
   - Email (username)
   - Password
   - Confirm Password

2. On submit:
   - Frontend validates password match and length
   - Sends request to backend `/api/register`
   - Backend:
     - Checks if email already exists
     - Validates email format
     - Hashes password with BCrypt
     - Saves user to database
     - Generates JWT token
     - Returns user data + token

3. After successful registration:
   - Frontend stores token and user data in localStorage
   - User is automatically logged in
   - Redirects to dashboard
   - **User can immediately use the app**

### Login Process
1. User enters:
   - Email (same as registered)
   - Password (same as registered)

2. On submit:
   - Frontend sends request to backend `/api/login`
   - Backend:
     - Finds user by email
     - Verifies password (handles both hashed and plain passwords)
     - Generates JWT token
     - Returns user data + token

3. After successful login:
   - Frontend stores token and user data
   - Redirects based on user role:
     - Admin → `/admin`
     - User → `/dashboard`

## 🔐 Security Features

### Password Hashing
- All new registrations: Passwords are hashed with BCrypt
- Format: `$2a$10$...` or `$2b$10$...`
- Original password is never stored
- Cannot be reversed

### Password Verification
- Login compares entered password with hashed password
- Uses BCrypt's `matches()` method
- Works with both:
  - Hashed passwords (new users)
  - Plain passwords (demo users: admin@budgetgo.com, user@budgetgo.com)

### JWT Tokens
- Generated on registration and login
- Contains: userId, email, role
- Valid for 24 hours
- Stored in localStorage

## 📝 Test the Flow

### Test 1: Register New User
1. Go to `/register`
2. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123"
   - Confirm: "test123"
3. Click "Sign Up"
4. Should:
   - Show success message
   - Auto-login
   - Redirect to dashboard

### Test 2: Login with Same Credentials
1. Logout (if still logged in)
2. Go to `/login`
3. Enter:
   - Email: "test@example.com"
   - Password: "test123"
4. Click "Sign In"
5. Should:
   - Login successfully
   - Redirect to dashboard

### Test 3: Verify in Database
```sql
SELECT id, name, email, password, role, created_at 
FROM users 
WHERE email = 'test@example.com';
```

You should see:
- User record exists
- Password is hashed (starts with `$2a$` or `$2b$`)
- Created_at timestamp is set

## 🎯 Key Points

1. **Same Email = Username**
   - Email is used as the login identifier
   - Must be unique

2. **Same Password Works**
   - Password you register with is what you use to login
   - Backend automatically hashes it on registration
   - Backend verifies it on login

3. **Auto-Login After Registration**
   - User is immediately logged in
   - No need to login separately
   - But can login later with same credentials

4. **Password Storage**
   - Never stored as plain text
   - Always hashed with BCrypt
   - Cannot be retrieved in original form

## 🔧 Troubleshooting

### Can't Login After Registration
**Check:**
1. Backend is running on port 4000
2. Database connection is working
3. Password was correctly hashed (check database)
4. Email matches exactly (case-insensitive)

### "User already exists" Error
- Email must be unique
- Use a different email or login instead

### "Invalid email or password" Error
**Possible causes:**
1. Wrong email (check spelling)
2. Wrong password (check caps lock)
3. Password not hashed correctly (check database)
4. User not saved to database

### Password Not Working
**For demo users** (admin@budgetgo.com, user@budgetgo.com):
- These may have plain passwords initially
- After first login, password should be re-hashed

**For new users:**
- Password is automatically hashed on registration
- Login should work immediately

## 📊 Database Schema

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at DATETIME
);
```

## ✅ Verification Checklist

- [ ] User can register with email and password
- [ ] User is saved to database with hashed password
- [ ] User is auto-logged in after registration
- [ ] User can logout and login again with same credentials
- [ ] Password is hashed (check database)
- [ ] Email is unique (can't register same email twice)
- [ ] Token is generated and stored
- [ ] Login redirects correctly based on role

## 🚀 Complete Flow Example

1. **Register:**
   ```
   POST /api/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "mypassword123"
   }
   ```
   → User saved to DB (password hashed)
   → Token generated
   → Auto-logged in
   → Redirected to dashboard

2. **Login (later):**
   ```
   POST /api/login
   {
     "email": "john@example.com",
     "password": "mypassword123"
   }
   ```
   → Password verified (matches hash)
   → Token generated
   → Logged in
   → Redirected to dashboard

**Both use the same email and password!** ✅


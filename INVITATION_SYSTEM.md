# Trip Invitation System - Complete Guide

## Overview
The BudgetGo application now has a complete invitation system that allows users to:
1. Create trips and invite members via email
2. Send invitation emails with registration links
3. Register new users who automatically join the trip
4. Accept invitations for existing users

## How It Works

### 1. **Trip Creation**
- User creates a trip via `/trip-creation`
- After creation, automatically redirected to `/trips/{tripId}/members`

### 2. **Inviting Members**
- Trip owner navigates to trip members page
- Clicks "Invite Member" button
- Enters email address of person to invite
- System sends invitation email with unique token

### 3. **Invitation Email**
- Contains invitation link: `http://localhost:5173/invite/accept?token={token}`
- Includes trip name and inviter name
- Valid for 7 days

### 4. **New User Flow (Not Registered)**
- Clicks invitation link
- Redirected to `/invite/accept?token={token}`
- Email is pre-filled (cannot be changed)
- User fills registration form
- After registration, automatically:
  - Creates user account
  - Adds user to trip as member
  - Logs user in
  - Redirects to dashboard

### 5. **Existing User Flow (Already Registered)**
- Clicks invitation link
- If not logged in: redirected to login page
- After login with matching email:
  - Can accept invitation
  - Automatically added to trip

## Backend Endpoints

### Invitations
- `POST /api/invitations/send` - Send invitation
  ```json
  {
    "tripId": 1,
    "invitedBy": 1,
    "email": "user@example.com"
  }
  ```

- `GET /api/invitations/token/{token}` - Get invitation details
- `POST /api/invitations/accept` - Accept invitation
  ```json
  {
    "token": "uuid-token",
    "email": "user@example.com"
  }
  ```

- `GET /api/invitations/trip/{tripId}` - Get all invitations for a trip

### Trip Members
- `GET /api/trip-members?tripId={id}` - Get trip members
- `DELETE /api/trip-members/{id}` - Remove member

### Registration with Invitation
- `POST /api/register` - Register (includes invitationToken)
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "invitationToken": "uuid-token" // Optional
  }
  ```

## Frontend Pages

### `/trips/:tripId/members`
- View current trip members
- Send invitations to new members
- See pending invitations

### `/invite/accept?token={token}`
- Accept invitation
- Register new user (if not registered)
- Login existing user (if registered)

## Database Tables

### `invitations`
- `id` - Primary key
- `trip_id` - Trip being invited to
- `invited_by` - User ID who sent invitation
- `email` - Email address invited
- `token` - Unique invitation token
- `status` - pending, accepted, expired, cancelled
- `expires_at` - Expiry date (7 days)
- `created_at` - Creation timestamp
- `accepted_at` - Acceptance timestamp

### `trip_members`
- `id` - Primary key
- `trip_id` - Trip ID
- `user_id` - User ID
- `role` - owner, member
- `status` - active, pending, inactive
- `joined_at` - Join timestamp

## Email Service

Currently, the email service logs emails to console (for development).
To enable real emails in production:
1. Add email service dependency (JavaMailSender or SendGrid)
2. Update `EmailService.java` to send actual emails
3. Configure SMTP settings in `application.properties`

## Testing

1. **Create Trip:**
   - Login as user
   - Create new trip
   - Redirected to members page

2. **Send Invitation:**
   - On members page, click "Invite Member"
   - Enter email address
   - Check console logs for email content

3. **Register via Invitation:**
   - Copy invitation link from console
   - Open in new browser/incognito
   - Register with invited email
   - Should auto-join trip

4. **Accept as Existing User:**
   - Login first
   - Open invitation link
   - Click "Accept Invitation"
   - Should join trip

## Security Features

- Email validation (must match invitation email)
- Token expiry (7 days)
- One-time use tokens
- Prevents duplicate memberships
- Email verification before joining

## Future Enhancements

- Real email sending (SMTP/SendGrid)
- Email templates
- Invitation resend option
- Cancel invitations
- Member role management
- Remove members from trip
- Invitation expiry notifications


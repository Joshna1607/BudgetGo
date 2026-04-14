# Complete Invitation System - Setup & Testing Guide

## ✅ What's Been Implemented

### Backend Features
1. ✅ **TripMember Entity** - Tracks users in trips
2. ✅ **Invitation Entity** - Manages invitation tokens with expiry
3. ✅ **Email Service** - Sends invitation emails (logs to console for now)
4. ✅ **Invitation Controller** - Send, accept, get invitations
5. ✅ **Trip Member Controller** - Manage trip members
6. ✅ **Registration with Invitation** - Auto-adds user to trip on registration

### Frontend Features
1. ✅ **TripMembers Page** - `/trips/:tripId/members`
   - View current members
   - Send invitations
   - See pending invitations

2. ✅ **InviteAccept Page** - `/invite/accept?token={token}`
   - Accept invitations
   - Register new users (auto-joins trip)
   - Login existing users (joins trip)

3. ✅ **Registration with Token** - Supports invitation token
4. ✅ **Trip Creation** - Redirects to members page after creation

## 🚀 How to Test

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
# Or run in Eclipse
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Invitation Flow

#### Step 1: Create Trip
1. Login as user: `user@budgetgo.com` / `user123`
2. Go to "Create Trip"
3. Fill trip details and submit
4. You'll be redirected to `/trips/{tripId}/members`

#### Step 2: Send Invitation
1. On members page, click "Invite Member"
2. Enter email: `newuser@example.com`
3. Click "Send Invitation"
4. **Check console logs** - Email content will be logged there
5. Copy the invitation link from console

#### Step 3: Accept as New User
1. Open invitation link in new browser/incognito
2. Email is pre-filled (cannot be changed)
3. Fill registration form (name, password)
4. Submit - User is:
   - Created in database
   - Auto-added to trip
   - Auto-logged in
   - Redirected to dashboard

#### Step 4: Accept as Existing User
1. If user already exists with that email
2. Login first with that email
3. Open invitation link
4. Click "Accept Invitation"
5. User is added to trip

## 📧 Email Logs

When invitations are sent, check the backend console for:
```
=== EMAIL SENT ===
To: user@example.com
Subject: You've been invited to join a trip: Trip Name
Body: [HTML email content with invitation link]
==================
```

**Copy the invitation link from the console** to test.

## 🔗 Invitation Link Format

```
http://localhost:5173/invite/accept?token={uuid-token}
```

## 📊 Database Tables

After running the backend, these tables are created:
- `invitations` - Stores invitation details
- `trip_members` - Tracks trip memberships
- `trips` - Trip details
- `users` - User accounts

## 🔧 Configuration

### Backend
- Invitation expiry: 7 days (configurable in `Invitation.java`)
- Frontend URL: `http://localhost:5173` (in `application.properties`)

### Email Service
Currently logs emails to console. To enable real emails:
1. Add JavaMailSender dependency
2. Configure SMTP in `application.properties`
3. Update `EmailService.java` to send actual emails

## 🐛 Troubleshooting

### Invitation Link Not Working
- Check backend is running on port 4000
- Check token is valid (not expired)
- Check email matches invitation email

### User Not Added to Trip
- Check invitation status is "pending"
- Check invitation hasn't expired
- Check user email matches invitation email exactly

### Registration Fails
- Check password is at least 6 characters
- Check email matches invitation email
- Check backend logs for errors

## 📝 API Endpoints

### Send Invitation
```
POST /api/invitations/send
Body: {
  "tripId": 1,
  "invitedBy": 1,
  "email": "user@example.com"
}
```

### Get Invitation
```
GET /api/invitations/token/{token}
```

### Accept Invitation
```
POST /api/invitations/accept
Body: {
  "token": "uuid-token",
  "email": "user@example.com"
}
```

### Register with Invitation
```
POST /api/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "invitationToken": "uuid-token"  // Optional
}
```

### Get Trip Members
```
GET /api/trip-members?tripId=1
```

## ✨ Features

- ✅ Email invitations with unique tokens
- ✅ Token expiry (7 days)
- ✅ Email validation
- ✅ Auto-join on registration
- ✅ Prevent duplicate memberships
- ✅ Pending invitations tracking
- ✅ Member management

## 🎯 Next Steps

1. **Enable Real Emails**: Configure SMTP service
2. **Add UI to Trip Cards**: Link to members page
3. **Member Roles**: Add owner/admin/member roles
4. **Remove Members**: Add remove member functionality
5. **Resend Invitations**: Allow resending expired invitations


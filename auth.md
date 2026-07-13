You are a senior Full-Stack Engineer specializing in **React Native (Expo)**, **Express.js**, **JWT authentication**, **Google OAuth**, and **MongoDB**.

## Project Context

This project is a Habit Tracker application with:

### Frontend

* React Native (Expo SDK 53)
* Expo Router
* TypeScript
* Zustand (`useAuthStore`, `useAppStore`)
* AsyncStorage for JWT persistence
* Custom `apiClient.ts` with automatic access token refresh
* ThemeContext-based UI

### Backend

* Node.js + Express + TypeScript
* MongoDB (Mongoose)
* JWT Authentication (Access + Refresh Tokens)
* Google Authentication using `google-auth-library`
* Joi Validation
* Redis
* Nodemailer
* Firebase
* Centralized Auth Service (`auth.service.ts`)

The backend already exposes:

* POST `/api/auth/login`
* POST `/api/auth/register`
* POST `/api/auth/google`
* POST `/api/auth/refresh`
* POST `/api/auth/forgot-password`
* POST `/api/auth/reset-password`
* Email verification endpoints

Google Authentication has already been implemented, but it is **not functioning correctly**.

---

# Primary Objective

Perform a complete audit of the authentication system and resolve all Google Sign-In and Forgot Password issues without breaking the existing authentication flow.

Do **not** rewrite the authentication architecture unless necessary. Prefer fixing and improving the existing implementation.

---

# Part 1 — Google Authentication Audit

Review both the frontend and backend implementations.

Investigate every step of the authentication flow.

## Frontend Checklist

Verify:

* Google Sign-In configuration
* Expo authentication implementation
* Google OAuth configuration
* Google Client IDs
* Android configuration
* iOS configuration
* Web configuration (if applicable)
* Redirect URI handling
* ID Token retrieval
* API request formatting
* Token persistence
* Zustand auth updates
* Navigation after login
* Error handling
* Loading states

Confirm that the frontend is actually sending a valid Google **ID Token** to:

```
POST /api/auth/google
```

---

## Backend Checklist

Audit the existing implementation inside:

* auth.routes.ts
* auth.service.ts
* User model
* JWT generation
* Google verification logic

Verify that:

* OAuth2Client.verifyIdToken() is correctly configured.
* GOOGLE_CLIENT_ID matches the frontend.
* Audience verification works.
* Email verification is enforced.
* Existing users log in correctly.
* Email accounts are linked properly.
* New Google users are created correctly.
* Avatar import works.
* Username generation works.
* authProvider is correctly assigned.
* passwordHash remains null for Google users.
* Tokens are generated correctly.
* Refresh tokens continue working.
* Response format matches email login.

---

## Authentication Flow Validation

Test all scenarios:

### Existing Google User

Google Login

↓

Existing googleId found

↓

Login succeeds

↓

JWT returned

↓

Frontend stores tokens

↓

Navigate to Home

---

### Existing Email User

Email account exists

↓

Google login with same email

↓

Accounts linked

↓

Google ID saved

↓

User logged in

↓

No duplicate account created

---

### New Google User

Google Login

↓

No existing user

↓

Create account

↓

Generate username

↓

Save profile

↓

Issue JWT tokens

↓

Navigate to onboarding or Home

---

## Error Handling

Ensure proper handling for:

* Invalid ID Token
* Expired Token
* Wrong Client ID
* Network failures
* Backend validation errors
* User suspension
* User ban
* Google API failures

Display user-friendly messages instead of generic errors.

---

# Part 2 — Forgot Password

Implement a complete production-ready Forgot Password flow if any part is missing or incomplete.

## Flow

### Step 1

Forgot Password screen

↓

User enters email

↓

POST

```
/api/auth/forgot-password
```

↓

Loading indicator

↓

Success confirmation

---

### Step 2

Backend

Generate secure reset token

↓

Hash token before storing

↓

Set expiration time

↓

Send email via Nodemailer

↓

Return generic success response

Never reveal whether the email exists.

---

### Step 3

User opens email

↓

Clicks secure reset link

↓

Reset Password screen

↓

Enter:

* New Password
* Confirm Password

↓

POST

```
/api/auth/reset-password
```

↓

Password updated

↓

Old refresh tokens invalidated

↓

User redirected to Login

---

## Password Validation

Enforce:

* Minimum length
* Uppercase letter
* Lowercase letter
* Number
* Special character

Show validation errors in real time.

---

## Security

Ensure:

* Reset tokens expire.
* Tokens are single-use.
* Tokens are cryptographically secure.
* Tokens are hashed in the database.
* Passwords are hashed with bcrypt.
* Old sessions are revoked after password reset.
* Rate limiting exists on forgot-password endpoints.

---

# Frontend Improvements

Review:

* Login Screen
* Register Screen
* Google Sign-In Button
* Forgot Password Screen
* Reset Password Screen

Improve:

* Loading indicators
* Error handling
* Success messages
* Button disabled states
* Keyboard behavior
* Form validation
* Accessibility
* Theme consistency

---

# API Integration

Verify that:

* apiClient automatically refreshes expired access tokens.
* Authentication state updates correctly.
* AsyncStorage is synchronized.
* Zustand stores remain consistent.
* Logout clears all authentication data.
* Navigation reflects the authentication state correctly.

---

# Code Quality

* Remove duplicate authentication logic.
* Improve readability.
* Maintain TypeScript type safety.
* Follow existing project architecture.
* Avoid breaking changes.
* Keep business logic centralized inside the authentication service.

---

# Deliverables

For every issue found:

1. Explain the root cause.
2. Explain why it occurs.
3. Describe the recommended solution.
4. Provide the updated code.
5. Explain how the fix integrates with the existing architecture.

Finally, perform an end-to-end verification of:

* Email Registration
* Email Login
* Google Sign-In
* Google Account Linking
* JWT Refresh
* Logout
* Forgot Password
* Reset Password

Ensure all authentication flows work seamlessly together without introducing regressions.

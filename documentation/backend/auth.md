# Authentication API

This document outlines the authentication system used in the UniHub platform, providing details about endpoints, token management, and security best practices.

## Overview

UniHub uses a JWT (JSON Web Token) based authentication system with the following features:
- Secure token-based authentication
- Refresh token rotation
- Password hashing with bcrypt
- Role-based access control

## API Endpoints

### Register a New User

**Endpoint:** `POST /api/auth/register`

**Description:** Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

**Required Fields:**
- `name`: User's full name
- `email`: User's email address
- `password`: User's password (min 8 characters, must contain letters and numbers)

**Response:** (Status 201)
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

### Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user and provides access tokens.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

**Required Fields:**
- `email`: User's email address
- `password`: User's password

**Response:** (Status 200)
```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

### Get Current User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Retrieves the current user's profile information.

**Authentication:** JWT token required

**Response:** (Status 200)
```json
{
  "data": {
    "user": {
      "id": "123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Update User Profile

**Endpoint:** `PUT /api/auth/profile`

**Description:** Updates the current user's profile information.

**Authentication:** JWT token required

**Request Body:**
```json
{
  "name": "John Smith"
}
```

**Optional Fields:**
- `name`: User's updated name
- `email`: User's updated email
- `password`: User's updated password

**Response:** (Status 200)
```json
{
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "123",
      "name": "John Smith",
      "email": "john.doe@example.com"
    }
  }
}
```

### Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Description:** Generates a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Required Fields:**
- `refreshToken`: Valid refresh token previously issued

**Response:** (Status 200)
```json
{
  "message": "Token refreshed",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Token Management

### JWT Structure

The JWT token contains the following payload:
```json
{
  "sub": "123",  // User ID
  "name": "John Doe",
  "email": "john.doe@example.com",
  "iat": 1516239022,  // Issued at
  "exp": 1516325422   // Expiration time
}
```

### Token Lifecycle

1. **Access Token**: Short-lived token (default: 24 hours) for API access
2. **Refresh Token**: Longer-lived token (default: 7 days) for obtaining new access tokens
3. **Token Rotation**: Refresh tokens are rotated with each use to prevent replay attacks

## Authentication Middleware

Protected routes use the `auth` middleware which:
1. Extracts the JWT token from the Authorization header
2. Verifies the token signature using the JWT_SECRET
3. Checks if the token has expired
4. Attaches the user information to the request object

```javascript
// Example usage in route definition
router.get('/api/notes', auth, notesController.getAllNotes);
```

## Security Considerations

### Password Storage

Passwords are:
- Never stored in plain text
- Hashed using bcrypt with a salt factor of 10+
- Validated using secure comparison methods

### HTTPS

All authentication requests should be made over HTTPS in production to prevent man-in-the-middle attacks.

### Token Security

To maintain security:
1. Store tokens securely in HTTP-only cookies or local storage
2. Never expose tokens in URLs
3. Use short expiration times for access tokens
4. Implement token revocation when necessary (e.g., on password change)

## Client Integration

### Login Flow

```javascript
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Store tokens securely
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.user;
  } else {
    throw new Error(data.error || 'Login failed');
  }
}
```

### Authenticated Requests

```javascript
async function fetchProtectedResource(url) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, try to refresh
    await refreshToken();
    return fetchProtectedResource(url);
  }
  
  return response.json();
}
```

### Token Refresh

```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return true;
  } else {
    // Refresh failed, user needs to log in again
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return false;
  }
}
```

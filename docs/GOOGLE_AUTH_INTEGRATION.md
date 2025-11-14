# Google Authentication Integration

## Overview

SwimTO now supports Google OAuth2 authentication, allowing users to create accounts and sync their favorites across devices. This integration provides a foundation for additional user-centric features.

## Features Implemented

### 1. User Authentication
- **Google OAuth2 Login**: Users can sign in with their Google account
- **JWT Token Management**: Secure token-based authentication with 7-day expiration
- **Session Persistence**: User sessions persist across browser restarts
- **Automatic Logout**: Token expiration and invalid tokens trigger automatic logout

### 2. Favorites Management
- **Cloud Sync**: Favorites are stored in the database and synced across devices
- **Guest Mode**: Non-authenticated users can still favorite facilities (localStorage)
- **Auto-Sync**: When users log in, their local favorites are automatically synced to the cloud
- **Real-time Updates**: Favorites are immediately available after login

## Backend Implementation

### Database Models
- **User**: Stores user information (email, name, Google ID, profile picture)
- **UserFavorite**: Junction table linking users to their favorite facilities

### API Endpoints
- `GET /auth/google-url` - Get Google OAuth URL
- `POST /auth/google-callback` - Handle OAuth callback and return JWT token
- `GET /auth/me` - Get current user information
- `GET /favorites` - Get user's favorites
- `POST /favorites` - Add a favorite
- `DELETE /favorites/{facility_id}` - Remove a favorite
- `GET /favorites/check/{facility_id}` - Check if facility is favorited

### Configuration Required
Add to `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
SECRET_KEY=your-secret-key-for-jwt
```

## Frontend Implementation

### Components
- **AuthContext**: Manages authentication state and provides login/logout functions
- **AuthCallback**: Handles OAuth callback and redirects
- **Layout**: Updated with login/logout button and user profile display
- **useFavorites Hook**: Unified hook for managing favorites (works with both authenticated and guest users)

### Features
- Seamless login/logout UI in header
- Automatic favorites sync on login
- Fallback to localStorage for guest users
- Responsive design with user profile picture

## Future Enhancements

### Immediate Benefits
1. **Cross-Device Sync**: Favorites available on all devices
2. **Account Recovery**: Favorites preserved if browser data is cleared
3. **User Identification**: Foundation for personalized features

### Potential Additional Features

#### User Preferences
- **Default View**: Save user's preferred view mode (map/list/table)
- **Swim Type Filter**: Remember default swim type preference
- **Dark Mode Sync**: Sync dark mode preference across devices
- **Location Settings**: Save preferred location for distance calculations

#### Personalization
- **Custom Notifications**: Alert users when favorite facilities have new sessions
- **Swim History**: Track which facilities user has visited
- **Schedule Alerts**: Get notified when favorite facilities have sessions matching user preferences
- **Recommendations**: Suggest facilities based on usage patterns

#### Analytics & Insights
- **Usage Stats**: Track most visited facilities (anonymized)
- **Popular Times**: See when favorite facilities are busiest
- **Swim Goals**: Track swimming frequency and goals

#### Social Features
- **Share Schedules**: Share favorite facility schedules with others
- **Facility Ratings**: Rate and review facilities
- **Community Notes**: Share tips about facilities (e.g., "Best time to avoid crowds")

#### Advanced Features
- **Custom Lists**: Create multiple lists (e.g., "Weekend Pools", "Near Work")
- **Schedule Reminders**: Set reminders for upcoming sessions
- **Calendar Integration**: Export favorite facility schedules to calendar
- **Route Planning**: Plan routes to visit multiple facilities

## Setup Instructions

### 1. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### 2. Backend Configuration
Update `.env` file:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
SECRET_KEY=generate-a-secure-random-key
```

### 3. Database Migration
Run database migrations to create User and UserFavorite tables:
```bash
cd apps/api
alembic upgrade head
```

Or if using SQLAlchemy directly:
```python
from app.models import Base
from app.database import engine
Base.metadata.create_all(bind=engine)
```

## Testing

### Manual Testing
1. Click "Login" button
2. Sign in with Google account
3. Add a facility to favorites
4. Logout and login again - favorites should persist
5. Try on different device/browser - favorites should sync

### Test Guest Mode
1. Without logging in, add favorites
2. Login - favorites should sync automatically
3. Logout - should fall back to localStorage

## Security Considerations

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Token expiration set to 7 days
- Automatic token refresh on API calls
- 401 errors clear tokens and force re-authentication
- Google OAuth uses secure HTTPS endpoints
- User data stored securely in PostgreSQL

## Migration Path

For existing users with localStorage favorites:
- On first login, favorites are automatically synced
- No data loss - seamless transition
- Guest users continue to work as before


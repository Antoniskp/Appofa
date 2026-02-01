# OAuth Integration Guide

This application supports OAuth-based authentication for easy signup and login. Currently, GitHub OAuth is implemented, with support for future integration of Google and Facebook.

## Features

### GitHub OAuth
- **Sign up with GitHub**: New users can create an account using their GitHub profile
- **Sign in with GitHub**: Existing users can log in with their GitHub account
- **Account Linking**: Users can link their GitHub account to their existing account
- **Profile Auto-fill**: User profiles are automatically populated with GitHub data (name, avatar, email)
- **Account Management**: Users can unlink their GitHub account from the profile page

### Future Support
The OAuth infrastructure is designed to support additional providers:
- Google OAuth (coming soon)
- Facebook OAuth (coming soon)

## Setup

### GitHub OAuth Configuration

1. **Create a GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in the application details:
     - Application name: Your app name
     - Homepage URL: `http://localhost:3001` (or your production URL)
     - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
   - Click "Register application"

2. **Get Your Credentials**
   - After creating the app, you'll see your Client ID
   - Generate a new client secret
   - Copy both values

3. **Configure Environment Variables**
   Add the following to your `.env` file:
   ```bash
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
   FRONTEND_URL=http://localhost:3001
   ```

4. **Restart the Application**
   After configuring the environment variables, restart both the API server and frontend.

### Production Deployment

For production:
1. Update the callback URL in your GitHub OAuth App settings to your production domain
2. Update the environment variables:
   ```bash
   GITHUB_CALLBACK_URL=https://your-domain.com/api/auth/github/callback
   FRONTEND_URL=https://your-frontend-domain.com
   ```

## User Flow

### New User Signup with GitHub
1. User clicks "Sign up with GitHub" on the registration page
2. User is redirected to GitHub for authorization
3. After authorization, GitHub redirects back with an authorization code
4. The application exchanges the code for an access token
5. User profile data is fetched from GitHub
6. A new account is created with:
   - Username from GitHub login
   - Email from GitHub primary email
   - First/Last name from GitHub name field
   - Avatar from GitHub profile picture
7. User is automatically logged in

### Existing User Login with GitHub
1. User clicks "Continue with GitHub" on the login page
2. User is redirected to GitHub for authorization
3. After authorization, the application checks if the GitHub account is linked
4. If linked, user is logged in
5. If the email matches an existing account, GitHub is automatically linked
6. User is redirected to the application

### Linking GitHub to Existing Account
1. User goes to Profile page
2. User clicks "Connect" next to GitHub in the Connected Accounts section
3. User is redirected to GitHub for authorization
4. After authorization, GitHub account is linked to the user's account
5. User is redirected back to the profile page

### Unlinking GitHub Account
1. User goes to Profile page
2. User clicks "Disconnect" next to GitHub
3. Confirmation dialog appears
4. GitHub account is unlinked (requires password to be set)

## Security Features

### CSRF Protection
- State tokens are generated for each OAuth flow
- Tokens are validated during callback to prevent CSRF attacks
- Tokens expire after 10 minutes
- Tokens are single-use (consumed after validation)

### Account Safety
- Users cannot unlink their only authentication method
- OAuth-only users must set a password before unlinking
- GitHub IDs are stored securely in the database
- **Access tokens are encrypted using AES-256-GCM encryption** before storage
- Encryption keys are derived from JWT_SECRET using PBKDF2

## API Endpoints

### Public Endpoints

#### Get OAuth Configuration
```
GET /api/auth/oauth/config
```
Returns which OAuth providers are configured.

#### Initiate GitHub OAuth
```
GET /api/auth/github?mode=login
GET /api/auth/github?mode=link
```
Initiates the GitHub OAuth flow. Mode can be `login` (for signup/login) or `link` (for linking to existing account).

#### GitHub OAuth Callback
```
GET /api/auth/github/callback?code=...&state=...
```
Handles the callback from GitHub after authorization.

### Protected Endpoints

#### Unlink GitHub Account
```
DELETE /api/auth/github/unlink
Authorization: Bearer <token>
```
Unlinks the GitHub account from the current user.

## UI Components

### Login Page
- "Continue with GitHub" button (enabled when OAuth is configured)
- Placeholder buttons for Google and Facebook (disabled)

### Register Page
- "Sign up with GitHub" button (enabled when OAuth is configured)
- Placeholder buttons for Google and Facebook (disabled)

### Profile Page
- Connected Accounts section showing:
  - GitHub connection status
  - Connect/Disconnect button
  - Placeholders for Google and Facebook

## Database Schema

The User model includes the following OAuth-related fields:

```javascript
{
  githubId: STRING (unique, nullable),
  githubAccessToken: STRING (nullable),
  avatar: STRING (nullable),
  password: STRING (nullable) // Can be null for OAuth-only users
}
```

## Testing

OAuth tests are included in `__tests__/oauth.test.js`:
- State token generation and validation
- OAuth configuration checking
- Account linking/unlinking
- User creation with OAuth fields

Run tests with:
```bash
npm test
```

## Troubleshooting

### OAuth buttons are disabled
- Check that `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in `.env`
- Restart the API server after setting environment variables

### GitHub callback fails
- Verify the callback URL in GitHub OAuth App matches `GITHUB_CALLBACK_URL` in `.env`
- Check that `FRONTEND_URL` is correctly set

### Cannot unlink GitHub account
- Ensure you have a password set (OAuth-only users must set a password first)
- Check that you're not removing your only authentication method

## Future Enhancements

- Google OAuth implementation
- Facebook OAuth implementation
- Twitter/X OAuth support
- LinkedIn OAuth support
- Multiple OAuth accounts per user

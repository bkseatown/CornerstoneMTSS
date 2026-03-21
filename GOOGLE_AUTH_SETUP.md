# Google OAuth Setup Guide

## Overview
This guide explains how to configure Google Sign-In and Google Workspace integrations for Cornerstone MTSS.

## Prerequisites
- Google Cloud Project with OAuth 2.0 enabled
- Google Cloud Console access
- Application deployed or running on `localhost:3000` (or your dev server)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Enable these APIs:
   - Google Identity Services API
   - Google Classroom API
   - Google Drive API
   - Google Docs API
   - Google Sheets API
   - Google Calendar API

## Step 2: Create OAuth 2.0 Credentials

1. Go to **Credentials** in Cloud Console
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `http://127.0.0.1:4173` (preview server)
   - Your production domain
5. Add Authorized redirect URIs:
   - `http://localhost:3000/` (development)
   - Your production domain
6. Copy the **Client ID** and save it

## Step 3: Configure Application

Edit `js/google-auth-config.js`:

```javascript
window.CSGoogleAuthConfig = {
  clientId: "YOUR_CLIENT_ID.apps.googleusercontent.com",
  apiKey: "YOUR_API_KEY",
  appId: "YOUR_PROJECT_ID",
  discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/docs/v1/rest",
    "https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"
  ],
  scopes: [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/presentations",
    "https://www.googleapis.com/auth/youtube.readonly"
  ]
};
```

## Step 4: Test the Setup

1. Visit landing page: `http://localhost:3000/index.html`
2. Click "🔐 Sign In with Google"
3. Complete the OAuth flow
4. Verify sign-in succeeds and user info appears

## Scopes Explained

| Scope | Purpose |
|-------|---------|
| `classroom.courses.readonly` | View class rosters and assignments |
| `classroom.rosters.readonly` | Access student information |
| `calendar.events.readonly` | View class schedule and events |
| `drive.file` | Access classroom shared files |
| `documents` | Edit Google Docs in shared folders |
| `spreadsheets` | Edit Google Sheets for tracking |
| `presentations` | Create/edit slide decks for lessons |
| `youtube.readonly` | Suggest relevant educational videos |

## Modules Using OAuth

- **landing-auth.js** - Sign-in/sign-out UI
- **specialist-hub-google-workspace.js** - Classroom, Drive, Docs access
- **specialist-hub-search.js** - Enhanced filtering via Classroom data

## Troubleshooting

### "Invalid Client" Error
- Check clientId is correct and matches domain
- Verify domain is in Authorized JavaScript origins

### "Redirect URI Mismatch" Error
- Ensure redirect URI matches exactly (including trailing `/`)
- Check development vs. production origins

### "Access Denied" Error
- User hasn't authorized required scopes
- Check that scopes are enabled in Cloud Console

### Sign-In Button Not Working
- Check browser console for errors
- Verify `js/google-auth.js` loaded successfully
- Confirm `CSGoogleAuthConfig` is defined

## Local Development

For testing without full OAuth setup:
- Landing page will show sign-in prompt
- Sign-in flow will fail gracefully
- Specialist Hub will show read-only demo data

## Production Deployment

1. Get production domain
2. Add to Authorized JavaScript origins in Cloud Console
3. Set environment-specific credentials (via environment variables or secure config)
4. Test OAuth flow on production domain

## Security Notes

⚠️ **Never commit actual credentials to git**
- Keep `google-auth-config.js` with empty credentials in version control
- Load credentials from environment variables in production
- Use separate credentials for dev/staging/production

## Additional Resources

- [Google Sign-In Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Classroom API](https://developers.google.com/classroom)
- [Google Drive API](https://developers.google.com/drive)
- [Google Docs API](https://developers.google.com/docs)

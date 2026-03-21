/**
 * Google OAuth 2.0 Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Read GOOGLE_AUTH_SETUP.md for complete setup guide
 * 2. Create Google Cloud Project and enable APIs
 * 3. Create OAuth 2.0 credentials (Web application type)
 * 4. Replace YOUR_CLIENT_ID with actual value from Google Cloud Console
 * 5. Replace YOUR_API_KEY with API key from Google Cloud Console
 * 6. Replace YOUR_PROJECT_ID with your project ID
 *
 * IMPORTANT: Keep empty values in version control for safety.
 * Load actual credentials from environment variables in production.
 *
 * Example with credentials (for local development only):
 * window.CSGoogleAuthConfig = {
 *   clientId: "123456789-abc.apps.googleusercontent.com",
 *   apiKey: "AIzaSy...",
 *   appId: "my-project-123456",
 *   ...
 * };
 */

window.CSGoogleAuthConfig = window.CSGoogleAuthConfig || {
  // OAuth 2.0 Client ID - get from Google Cloud Console
  // Format: XXXXXXXXXX-YYYYYY.apps.googleusercontent.com
  clientId: "", // TODO: Add your client ID here

  // API Key - get from Google Cloud Console
  // Used for API requests that don't require user authorization
  apiKey: "", // TODO: Add your API key here

  // Google Cloud Project ID
  appId: "", // TODO: Add your project ID here

  // Discovery docs for Google APIs
  // Leave empty if APIs will be accessed without discovery docs
  discoveryDocs: [
    // Uncomment to enable discovery for these APIs:
    // "https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest",
    // "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    // "https://www.googleapis.com/discovery/v1/apis/docs/v1/rest",
    // "https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"
  ],

  // OAuth scopes - access permissions needed
  scopes: [
    // Google Classroom
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",

    // Google Calendar
    "https://www.googleapis.com/auth/calendar.events.readonly",

    // Google Drive
    "https://www.googleapis.com/auth/drive.file",

    // Google Workspace (Docs, Sheets, Slides)
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/presentations",

    // YouTube
    "https://www.googleapis.com/auth/youtube.readonly"
  ]
};

// Committed stub config so static deploy validation can resolve this asset.
// Populate these values locally when enabling Google integrations.
window.CSGoogleAuthConfig = window.CSGoogleAuthConfig || {
  clientId: "",
  apiKey: "",
  appId: "",
  discoveryDocs: [],
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

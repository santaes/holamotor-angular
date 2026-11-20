export const environment = {
  production: false,
  apiUrl: '/api/',

  // Google Calendar OAuth — create credentials at
  // https://console.cloud.google.com/apis/credentials
  // Authorized redirect URI must match googleRedirectUri exactly.
  googleClientId: '',
  googleRedirectUri: 'http://localhost:4200/calendar/callback'
};

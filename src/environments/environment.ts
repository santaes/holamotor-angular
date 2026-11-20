export const environment = {
  production: false,
  apiUrl: '/api/',

  // Google Calendar OAuth — create credentials at
  // https://console.cloud.google.com/apis/credentials
  // Authorized redirect URI must match googleRedirectUri exactly.
  googleClientId: '471208745623-67iqrfqjvo4mt66jpkmusrn97jk50h42.apps.googleusercontent.com',
  googleRedirectUri: 'http://localhost:4200/calendar/callback'
};

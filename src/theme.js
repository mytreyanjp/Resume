export const getAppTheme = (isDarkMode) => {
  return isDarkMode ? darkTheme : lightTheme;
};

// Minimal white and black usage. Replaced purple with Sleek Slate/Gray.
const lightTheme = {
  bg: '#fcf9ff',          // Slate 50 (Off-white)
  surface: '#F1F5F9',     // Slate 100
  text: '#2d1e3b',        // Slate 800 (Off-black)
  textMuted: '#7f648b',   // Slate 500
  primary: '#4b3355',     // Slate 700 (Replaces purple)
  primaryText: '#faf8fc', // Slate 50
  border: '#E2E8F0',      // Slate 200
  inputBg: '#F8FAFC',     // Slate 50
  error: '#EF4444',       // Red 500
};

const darkTheme = {
  bg: '#0a0a0a',          // Slate 900 (Off-black)
  surface: '#1f1327',     // Slate 800
  text: '#F8FAFC',        // Slate 50 (Off-white)
  textMuted: '#c89fd5',   // Slate 400
  primary: '#af94b8',     // Slate 400 (Replaces purple)
  primaryText: '#2a0f2a',
  secondaryText: '#d0b0df', // Slate 900
  border: '#422748',      // Slate 700
  inputBg: '#1c0f2a',     // Slate 900
  error: '#8a0000',       // Red 400
};
import { createTheme } from '@mui/material/styles';

// Create custom theme with existing brand colors
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#3E236E',      // Existing brand color
      light: '#6B4C9A',     // Calculated lighter variant
      dark: '#2A1750',      // Calculated darker variant
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',      // Default MUI secondary
    },
  },
  typography: {
    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h4: {
      fontSize: '28px',
      fontFamily: 'Montserrat, sans-serif',
    },
    body2: {
      fontSize: '14px',
    },
  },
  spacing: 8, // Default spacing unit
  components: {
    // Customize MUI components to match existing design patterns
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Preserve existing button text casing
          borderRadius: 25,      // Match existing button border radius
        },
        contained: {
          paddingTop: 12,
          paddingBottom: 12,
        },
        text: {
          fontWeight: 500,
        },
      },
      variants: [
        {
          props: { variant: 'contained', size: 'large' },
          style: {
            paddingTop: 14,
            paddingBottom: 14,
          },
        },
      ],
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: 16,
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,     // Match existing input border radius
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,      // Match existing container border radius
        },
      },
      variants: [
        {
          props: { variant: 'loginContainer' },
          style: {
            padding: 48,
            width: '100%',
            maxWidth: 450,
            textAlign: 'center',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      ],
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: 'loginTitle' },
          style: {
            fontSize: '28px',
            fontFamily: 'Montserrat, sans-serif',
            marginBottom: 24,
          },
        },
        {
          props: { variant: 'authLink' },
          style: {
            fontSize: '14px',
            marginTop: 16,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: 500,
            '&:hover': {
              textDecoration: 'none',
            },
          },
        },
        {
          props: { variant: 'authText' },
          style: {
            fontSize: '14px',
            marginTop: 16,
          },
        },
      ],
    },
  },
});

// Extend the theme interface to include custom variants
declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    loginContainer: true;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    loginTitle: true;
    authLink: true;
    authText: true;
  }
}
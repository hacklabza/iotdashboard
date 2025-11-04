export const Colors = {
  light: {
    // Background colors
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceSecondary: '#fafafa',

    // Text colors
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textDisabled: '#BBBBBB',

    // Border colors
    border: '#e0e0e0',
    borderLight: '#dddddd',

    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#ff3b30',
    info: '#2196F3',
    inactive: '#9E9E9E',

    // Primary colors
    primary: '#007AFF',
    primaryText: '#ffffff',

    // Card shadow
    shadow: '#000000',
  },
  dark: {
    // Background colors
    background: '#121212',
    surface: '#1E1E1E',
    surfaceSecondary: '#2C2C2C',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    textDisabled: '#5C5C5C',

    // Border colors
    border: '#3A3A3A',
    borderLight: '#2F2F2F',

    // Status colors
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#42A5F5',
    inactive: '#757575',

    // Primary colors
    primary: '#0A84FF',
    primaryText: '#ffffff',

    // Card shadow
    shadow: '#000000',
  },
};

export type Theme = typeof Colors.light;
export type ColorScheme = 'light' | 'dark';

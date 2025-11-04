import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, Theme, ColorScheme } from '@/constants/Colors';

/**
 * Custom hook to get the current theme colors
 * Defaults to dark mode, but respects user's system preference
 * @returns Current theme colors and color scheme
 */
export function useTheme(): { colors: Theme; colorScheme: ColorScheme } {
  // Get system color scheme, default to 'dark'
  const systemColorScheme = useRNColorScheme();
  const colorScheme: ColorScheme = systemColorScheme ?? 'dark';

  return {
    colors: Colors[colorScheme],
    colorScheme,
  };
}

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

// Pantone Blue Blush (12-4705 TPX)
const pantoneBlueBlush = '#D6E2E0';

// Pantone Evergreen (19-5420 TCX)
const pantoneEvergreen = '#2A5547';

export const Colors = {
  light: {
    text: '#000',
    background: pantoneBlueBlush,
    tint: pantoneEvergreen,
    icon: '#687076',
    tabIconDefault: '#ccc',
    tabIconSelected: pantoneEvergreen,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: pantoneEvergreen,
    icon: '#9BA1A6',
    tabIconDefault: '#ccc',
    tabIconSelected: pantoneEvergreen,
  },
};

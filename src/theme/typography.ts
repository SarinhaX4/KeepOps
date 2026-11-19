import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
} from '@expo-google-fonts/geist-mono';
import type { TextStyle } from 'react-native';

/** Font files loaded once in the root layout. */
export const fontAssets = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
};

/**
 * With custom fonts, React Native picks the weight by family name,
 * so each weight is its own family (fontWeight is not used).
 */
export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  monoSemibold: 'GeistMono_600SemiBold',
} as const;

/** Type scale from the spec (section 9). */
export const typography = {
  display: { fontFamily: fonts.semibold, fontSize: 28, letterSpacing: -0.6 },
  title: { fontFamily: fonts.semibold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodySmall: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  meta: { fontFamily: fonts.medium, fontSize: 12 },
  tabLabel: { fontFamily: fonts.medium, fontSize: 11 },
  mono: { fontFamily: fonts.mono, fontSize: 13 },
} satisfies Record<string, TextStyle>;

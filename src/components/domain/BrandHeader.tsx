import { Image, StyleSheet, Text, View } from 'react-native';

import { DemoBadge } from '@/components/ui/DemoBadge';
import { colors, fonts, spacing } from '@/theme';

const symbol = require('@/assets/brand/keepops-symbol-color.png');

/** App header brand: symbol + "Keep"/"Ops" wordmark + DEMO seal. */
export function BrandHeader() {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="KeepOps">
      <Image source={symbol} style={styles.symbol} resizeMode="contain" />
      <Text style={styles.wordmark}>
        Keep<Text style={styles.ops}>Ops</Text>
      </Text>
      <DemoBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  symbol: { width: 30, height: 30 },
  wordmark: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, letterSpacing: -0.4 },
  // "Ops" in aqua (adjusted 20/11): cyan read too blue against the rest of the UI.
  ops: { color: colors.brandPrimary },
});

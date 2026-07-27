import { View, Image, StyleSheet, ViewStyle } from 'react-native';

// Real logo (assets/brand-logo.png), rendered faint as a fixed background
// watermark behind every screen's scrollable content.
export const LogoWatermark = () => (
  <View style={styles.wrap} pointerEvents="none">
    <Image
      source={require('../../assets/brand-logo.png')}
      style={styles.mark}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    // Written as literal keys (not a spread of StyleSheet.absoluteFillObject)
    // so TS can't widen `position` to `string` and flag it — this is what
    // was causing the squiggly. Functionally identical to absoluteFillObject.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Forces stacking behind flow siblings even if something upstream
    // ever sets an explicit zIndex on a sibling.
    zIndex: -1,
  } satisfies ViewStyle,
  mark: {
    // Logo's native ratio is 768x273 (~2.81:1) — sized to that instead of
    // forcing it into a square box.
    width: 340,
    height: 340 / (768 / 273),
    // Fine linework needs a touch more opacity than a bold shape to still
    // register as texture — 0.04 was basically invisible in testing, 0.06
    // is the lowest value that still reads as "there."
    opacity: 0.06,
  } satisfies ViewStyle,
});
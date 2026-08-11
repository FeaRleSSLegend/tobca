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
    // so TS can't widen `position` to `string` and flag it.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // No zIndex here on purpose — this used to be zIndex: -1, but negative
    // zIndex is a known React Native footgun (Android in particular can
    // drop a negatively-indexed view from the render tree entirely under
    // certain view-flattening optimizations, not just paint it behind).
    // JSX order alone already guarantees this renders under SafeAreaView
    // in ScreenWithWatermark — earlier siblings paint first — so zIndex
    // was never actually necessary, and is the most likely reason nothing
    // was showing at all rather than just being faint.
  } satisfies ViewStyle,
  mark: {
    // Logo's native ratio is 768x273 (~2.81:1) — sized to that instead of
    // forcing it into a square box. Bumped from 340 for more presence as
    // a background element, still well clear of screen-width overflow on
    // any real device size.
    width: 300,
    height: 300 / (768 / 273),
    // AUDIT (on-device): at 420pt / 0.1 the wordmark was plainly READABLE
    // through the Plan screen — "OLIVEBROOK CHURCH" ran straight across the
    // "TODAY'S READING" label and the streak row, so two pieces of type
    // occupied the same space and neither won. That is a figure/ground
    // failure, not a subtle-branding choice. Dropped to 300pt / 0.035: still
    // present as a texture, no longer competing for the same glance.
    // Previously: 420 / 0.1. Was 0.06 — measured against the actual page background
    // (theme.colors.bg, ~#F7F8F9) blended with the logo's own pink/navy/
    // purple, that landed within ~5-15 RGB units of the plain background
    // color across the board, i.e. genuinely at the edge of perceptible.
    // 0.1 keeps it clearly subordinate to foreground text while actually
    // registering as a mark rather than page-color noise.
    opacity: 0.035,
  } satisfies ViewStyle,
});
import { View, Image, StyleSheet } from 'react-native';

// The real logo (assets/brand-logo.png) — a genuine transparent-background
// export, unlike the icon-template placeholder this used to point at.
// Rendered in its own natural colors rather than tinted flat navy: at this
// opacity it barely reads as anything but texture, but keeping the actual
// pink-to-purple swoosh (instead of collapsing it to one flat tone) is what
// makes it read as "our logo, faded" rather than a generic gray watermark —
// closer to what was actually asked for.
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mark: {
    // Logo's native ratio is 768x273 (~2.81:1) — sized to that instead of
    // forcing it into a square box, so "contain" isn't doing any distorting
    // or unnecessary letterboxing.
    width: 340,
    height: 340 / (768 / 273),
    // A wordmark has fine linework (thin swoosh strokes, letterforms) that
    // needs a touch more opacity than a bold solid shape would to still
    // register as texture at all — 0.04 made this basically invisible in
    // testing, 0.06 is the lowest value where it still reads as "there."
    opacity: 0.06,
  },
});

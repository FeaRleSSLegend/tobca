// components/ui/SmartImage.tsx
// One image component for the whole app, wrapping expo-image. This is the
// direct fix for the reported 5-8s image loads looking broken: instead of
// a blank box that suddenly pops an image, every image now shows a shimmer
// placeholder while it loads and cross-fades in when ready. expo-image also
// brings disk + memory caching for free, so a thumbnail seen once loads
// instantly forever after, and it decodes off the JS thread so scrolling
// stays smooth.
//
// Why replace react-native's Image everywhere it matters: RN's Image has no
// built-in placeholder, no fade, and weak caching, which is exactly why the
// slow loads read as jank. expo-image is a drop-in with all three.

import { useState } from 'react';
import { View, StyleSheet, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { Shimmer } from './motion';
import { theme } from '../../constants/theme';

interface SmartImageProps {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  // Shows the animated shimmer while loading. On by default — turn off only
  // where a static fill is preferable (e.g. a tiny avatar).
  showPlaceholder?: boolean;
  // Rounding for both the image and its placeholder, so the shimmer matches
  // the final shape.
  radius?: number;
  accessibilityLabel?: string;
}

export const SmartImage = ({
  uri,
  style,
  contentFit = 'cover',
  showPlaceholder = true,
  radius,
  accessibilityLabel,
}: SmartImageProps) => {
  const [loaded, setLoaded] = useState(false);

  const roundStyle: ViewStyle | undefined = radius !== undefined ? { borderRadius: radius } : undefined;

  return (
    <View style={[styles.wrap, roundStyle, style as StyleProp<ViewStyle>]}>
      {/* Placeholder sits UNDER the image and stays until the image reports
          loaded, then the image fades over it — so there's never a blank
          frame and never a hard pop. */}
      {showPlaceholder && !loaded && (
        <Shimmer style={[StyleSheet.absoluteFill, roundStyle]} />
      )}
      {uri ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, roundStyle as StyleProp<ImageStyle>]}
          contentFit={contentFit}
          // expo-image's own cross-fade when the bitmap arrives. Paired with
          // the shimmer underneath, the sequence is: shimmer → image fades
          // in over shimmer → shimmer unmounts. Smooth at every step.
          transition={{ duration: 260, effect: 'cross-dissolve' }}
          cachePolicy="memory-disk"
          onLoadEnd={() => setLoaded(true)}
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        // No uri at all — a neutral fill, not a shimmer (nothing is coming).
        <View style={[StyleSheet.absoluteFill, styles.empty, roundStyle]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: theme.colors.grayBorder,
  },
  empty: {
    backgroundColor: theme.colors.grayBorder,
  },
});

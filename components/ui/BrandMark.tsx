// components/ui/BrandMark.tsx
// The OliveBrook two-stripe mark, rendered still.
//
// This is the SAME artwork BrandLoader animates — both read the swoosh paths
// extracted from assets/brand-logo.svg (see brandSwooshPaths.ts for how the
// two stripes were isolated from the "OLIVEBROOK CHURCH" wordmark below them).
// BrandLoader is that mark shimmering while something loads; this is that mark
// sitting there as artwork. Sharing the path data means the two can never
// drift into being two slightly different logos.
//
// Wordmark deliberately excluded: at the sizes this is used (a 148pt shelf
// card, a 44pt row thumbnail) the wordmark's type would be sub-pixel mush, and
// unreadable type on a piece of artwork reads as a rendering fault rather than
// as branding.

import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { PINK_SWOOSH, PURPLE_SWOOSH, SWOOSH_VIEWBOX, SwooshLayer } from './brandSwooshPaths';

const VB = SWOOSH_VIEWBOX;
const VIEW_BOX = `${VB.x} ${VB.y} ${VB.width} ${VB.height}`;

/** The mark's own aspect ratio — height follows width, never the reverse. */
export const BRAND_MARK_RATIO = VB.height / VB.width;

interface BrandMarkProps {
  /** Rendered width in points. Height is derived from the mark's own ratio. */
  width: number;
  /**
   * Force a single colour for both stripes. Passed by surfaces that sit on a
   * saturated ground, where the mark's own pink and purple lose against the
   * background — the same reason BrandLoader takes a tint.
   */
  tint?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

const Layers = ({ layers, tint }: { layers: SwooshLayer[]; tint?: string }) => (
  <>
    {layers.map((l, i) => (
      <Path key={i} d={l.d} fill={tint ?? l.fill} fillOpacity={tint ? 1 : l.opacity} />
    ))}
  </>
);

export const BrandMark = ({ width, tint, opacity = 1, style }: BrandMarkProps) => {
  const height = Math.round(width * BRAND_MARK_RATIO);
  return (
    <View style={[{ width, height, opacity }, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={VIEW_BOX}>
        {/* Purple beneath pink, matching the logo's own stacking order. */}
        <G>
          <Layers layers={PURPLE_SWOOSH} tint={tint} />
        </G>
        <G>
          <Layers layers={PINK_SWOOSH} tint={tint} />
        </G>
      </Svg>
    </View>
  );
};

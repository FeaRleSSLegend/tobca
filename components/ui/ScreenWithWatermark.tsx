import { View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { LogoWatermark } from './LogoWatermark';

interface ScreenWithWatermarkProps {
  children: React.ReactNode;
  edges?: readonly Edge[];
  style: any; // pass the screen's existing container style (padding etc.)
}

// The bug: LogoWatermark was being inserted as a direct child of
// SafeAreaView, positioned with `absoluteFillObject`. That's supposed to
// remove it from layout flow and float it behind the ScrollView — but
// SafeAreaView isn't a plain View under the hood (it measures and applies
// safe-area insets natively), and an absolutely positioned child of it
// didn't get the guaranteed positioning context a plain View gives. Net
// result: it rendered in normal document flow instead, as a real block
// pushing the header down — exactly what showed up in the screenshot.
// Fix: give the watermark its own plain `View` to be absolute *inside*,
// with SafeAreaView as a flex sibling stacked on top of it, rather than a
// child of it. sharedStyles.container's background moves up to this outer
// View so the watermark shows through underneath it.
export const ScreenWithWatermark = ({ children, edges = ['top', 'left', 'right'], style }: ScreenWithWatermarkProps) => (
  <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
    <LogoWatermark />
    <SafeAreaView edges={edges} style={[style, { backgroundColor: 'transparent' }]}>
      {children}
    </SafeAreaView>
  </View>
);

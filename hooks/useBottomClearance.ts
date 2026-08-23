// hooks/useBottomClearance.ts
//
// How much empty space a scroll view needs BELOW its last item.
//
// This is a HOOK rather than a constant because the honest answer depends on
// two things only known at runtime: whether anything is currently floating over
// the content, and the device's safe-area inset. Both were previously baked
// into flat numbers, and both were wrong.
//
//   Tab screens. The old flat 120pt was justified as clearing "the tab bar AND
//   the floating mini-player". The tab bar part was false — (tabs)/_layout.tsx
//   styles the bar without position:'absolute', so React Navigation reserves
//   its space and content never passes under it. The result was 120pt of dead
//   space on every tab whenever nothing was playing (visible as a hole under
//   short sections), while being ~26pt too SMALL whenever the mini-player was
//   actually docked. Now: plain breathing room, plus the mini-player's real
//   measured footprint only when it is really there.
//
//   Pushed screens. No tab bar at all, so the content runs to the physical
//   bottom of the display and the last row lands under the home indicator.
//   That inset is a device fact, which is why several screens shipped without
//   it.
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { miniPlayerFootprint } from '../components/player/PlayerHost';
import { audioMiniBarFootprint } from '../components/player/AudioPlayerHost';
import { usePlayback } from '../providers/PlaybackProvider';
import { useAudioFiles } from '../providers/AudioFileProvider';

/**
 * Bottom clearance for a scrolling screen inside (tabs).
 *
 * Nothing overlaps a tab screen by default, so this is just end-of-content
 * breathing room — until the persistent mini-player is docked, at which point
 * its real footprint is added on top.
 */
export function useTabBottomClearance(): number {
  const { hasActive } = usePlayback();
  const audio = useAudioFiles();
  const { width } = useWindowDimensions();
  return (
    theme.layout.scrollClearance.tabBase +
    (hasActive ? miniPlayerFootprint(width) : 0) +
    // The audio mini bar is the second thing that can float over a tab screen.
    // Added, not maxed, with the video window: the two can be docked at once
    // only in the moment between starting one and the other stopping, and a
    // max() would clip the last row for that moment. The cost of adding is a
    // few points of extra breathing room, which is invisible.
    (audio.hasActive ? audioMiniBarFootprint() : 0)
  );
}

/**
 * Bottom clearance for a pushed (stack) screen: end-of-content margin plus the
 * device's bottom safe-area inset, since nothing else is guarding that edge.
 */
export function useStackBottomClearance(): number {
  const insets = useSafeAreaInsets();
  const audio = useAudioFiles();
  // A pushed screen has no tab bar, so the audio mini bar docks lower — but it
  // still floats over the content, and /audio-collection is exactly the screen
  // you are most likely to be scrolling WHILE something plays.
  return (
    insets.bottom +
    theme.layout.scrollClearance.stack +
    (audio.hasActive ? audioMiniBarFootprint() : 0)
  );
}

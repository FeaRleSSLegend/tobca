// app/_layout.tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlaybackProvider } from '../providers/PlaybackProvider';
import { AudioFileProvider } from '../providers/AudioFileProvider';
import { AppearanceProvider, useAppearance } from '../providers/AppearanceProvider';
import { PlayerHost } from '../components/player/PlayerHost';
import { AudioPlayerHost } from '../components/player/AudioPlayerHost';
import { AnimatedSplash } from '../components/ui/AnimatedSplash';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
} from '@expo-google-fonts/lora';

// ---------------------------------------------------------------------------
// THE STARTUP SEQUENCE, in the order it happens. Each stage has exactly one
// job, and each hands off to the next as early as it correctly can.
//
//   1. NATIVE SPLASH        a solid, THEME-AWARE colour. No logo: app.json
//                           declares backgroundColor + a `dark` variant and no
//                           `image`, so there is nothing to look at but the
//                           right background. See stage 4 for why the logo is
//                           not here.
//   2. THEME HYDRATION      AppearanceProvider reads the stored Light/Dark/
//                           System choice. One AsyncStorage round-trip.
//   3. HAND OFF             the native splash is hidden the moment the theme
//                           is known — NOT when fonts finish. By then the
//                           animated splash is already mounted and painting
//                           the correct background, so the swap is one frame
//                           of identical colour.
//   4. ANIMATED SPLASH      starts animating on mount, and loops while the app
//                           loads. This is the ONLY place a logo appears.
//   5. APP MOUNTS           behind the splash, once fonts resolve.
//   6. EXIT                 the splash fades out and unmounts.
//
// WHAT THIS REPLACED, and the three bugs it carried:
//
//   THE WHITE FLASH IN DARK MODE. The native splash was a fixed white, so a
//   dark-mode launch went white -> dark. It now follows the appearance.
//
//   TWO LOGOS, ONE WAIT. The native splash drew brand-logo.png at 220pt and
//   the animated splash then drew the SAME mark at 220pt starting from empty.
//   So the launch read as: a big static logo, a beat, the logo vanishing, then
//   the animation beginning. Removing the native image leaves one logo moment.
//
//   THE ANIMATION COULD NOT START. `if (!ready) return null` held the ENTIRE
//   tree — the animated splash included — behind the font load, so the thing
//   meant to entertain you during startup was itself waiting on startup. The
//   splash now mounts immediately and is never gated on anything.
//
// preventAutoHideAsync can itself reject in some environments; swallow it so a
// splash-API hiccup can never wedge startup.
// ---------------------------------------------------------------------------
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
  });

  // A hard safety valve: never let the app sit behind the splash forever
  // waiting on fonts. In a fresh production build the Google font files load
  // for the first time, and if any one of them stalls, `fontsLoaded` would
  // otherwise never flip. After the timeout we proceed anyway — missing fonts
  // fall back to the system font, a cosmetic issue; a frozen app is a fatal
  // one. Note this now only gates the APP TREE: the splash animation runs
  // regardless, so a slow font load is a longer loop rather than a dead screen.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const appReady = fontsLoaded || !!fontError || timedOut;

  return (
    <SafeAreaProvider>
      {/* THE APP-WIDE STATUS BAR now lives INSIDE AppearanceProvider, as
          <ThemedChrome>, because it has to follow the palette: dark icons on
          the light ground, light icons on the dark one. It cannot stay here —
          this is above the provider, so it could not read the appearance.

          The audit that justified the old hardcoded 'dark' still holds for
          light mode: all 15 routes draw the screen background behind the
          status bar (the app runs edge-to-edge), so one app-wide default is
          correct for all of them. The three surfaces that are NOT a route
          still carry their own override and still win, because they mount
          later:
            components/player/PlayerHost.tsx       full-screen video, black
            components/player/AudioPlayerHost.tsx  full player, dark gradient
            app/playlist/[id].tsx                  scrimmed artwork masthead
          New screens needing an override should use
          components/ui/ScreenStatusBar, which is focus-scoped. */}
      {/* The user's Light/Dark/System choice, and the palette it resolves to.
          Outermost of the app providers because everything below it draws, and
          because nothing else depends on it. */}
      {/* Everything below is INSIDE AppearanceProvider so it can be themed
          from the first frame — including the splash, which is the whole
          reason the flash is gone. */}
      <AppearanceProvider>
      <ThemedChrome />
      <StartupGate appReady={appReady}>
      <PlaybackProvider>
        {/* The mp3 player for the church's own R2 audio. Mounted here, above
            the Stack, for the same reason PlaybackProvider is: playback has to
            survive navigating between the Library's audio shelves and a series
            screen. It creates its player with NO source, so mounting it costs
            no network. */}
        <AudioFileProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* (tabs) is the initial route. There is no longer a /player
              route — playback lives in the persistent PlayerHost overlay
              below, which is what lets it survive navigation and collapse
              into a mini-bar instead of being a screen you leave. */}
          <Stack.Screen name="(tabs)" />
        </Stack>
        {/* Rendered above the whole app. Invisible until something plays,
            then it's either the full-screen player or the docked mini-bar.
            One mounted YouTube instance, so audio/video never restarts when
            you collapse it to keep browsing. */}
        <PlayerHost />

        {/* The audio surfaces — full player and docked mini bar — for the
            church's own mp3s. A sibling of PlayerHost rather than part of it:
            they render different media through different engines, and the one
            thing they must agree on (only one of them audible) is handled
            explicitly inside AudioPlayerHost and AudioFileProvider.

            Mounted INSIDE AudioFileProvider, and after the Stack, so the mini
            bar floats above every screen while the tab bar stays reachable —
            the bar docks on the tab bar's top edge, never over it. */}
        <AudioPlayerHost />

        </AudioFileProvider>
      </PlaybackProvider>
      </StartupGate>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}

/**
 * The status bar, following the resolved appearance.
 *
 * A component rather than an inline <StatusBar> because it has to be a CHILD
 * of AppearanceProvider to read it, and RootLayout is what renders the
 * provider — a hook call in RootLayout itself would be outside its own
 * provider. Renders nothing but the status-bar declaration.
 */
function ThemedChrome() {
  const { colors } = useAppearance();
  // 'dark' means DARK ICONS for a LIGHT background, and vice versa — the
  // palette states which it needs rather than this file re-deriving it.
  return <StatusBar style={colors.statusBar} />;
}

/**
 * The handoff between the native splash, the animated splash, and the app.
 *
 * A component rather than logic in RootLayout because every decision it makes
 * needs the resolved appearance, and RootLayout is what RENDERS
 * AppearanceProvider — a hook call up there would sit outside its own provider.
 *
 * WHY IT HIDES THE NATIVE SPLASH ON `hydrated` AND NOT ON `appReady`.
 * `hydrated` is one AsyncStorage read; `appReady` waits on ten webfonts. The
 * only thing the handoff genuinely requires is that whatever replaces the
 * native splash is painted in the RIGHT THEME — and that is exactly what
 * `hydrated` means. Waiting for fonts as well would keep the OS splash up for
 * as long as the network takes, which is the thing that made startup feel slow.
 *
 * There is no race here: this component is mounted (and has therefore painted
 * its themed background and the splash on top of it) at least one frame before
 * `hydrated` can flip, because the storage read cannot resolve synchronously.
 */
function StartupGate({
  appReady,
  children,
}: {
  appReady: boolean;
  children: React.ReactNode;
}) {
  const { hydrated, colors } = useAppearance();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* THE APP MOUNTS ONLY ONCE FONTS ARE IN, and that is deliberate rather
          than leftover gating. Two reasons, in order of how much they matter:

          1. The splash's fill is an animated SVG mask, which react-native-svg
             cannot run on the native driver (see the note in BrandLoader), so
             it shares the JS thread. Mounting four tabs, three providers and
             the first data fetches alongside it would drop frames in the one
             animation the user is looking at.
          2. Text laid out in a fallback font and then reflowed when the real
             one arrives is visible work, even behind a splash, on the frame
             the splash fades.

          Until then this is a plain themed rectangle, so the colour behind the
          splash is already correct and the fade reveals the right background
          rather than flashing one. */}
      {appReady ? children : null}

      {/* Last child so it covers everything, including the player overlay.
          Unmounted once finished — it has no reason to stay in the tree. */}
      {!splashDone && (
        <AnimatedSplash appReady={appReady} onDone={() => setSplashDone(true)} />
      )}
    </View>
  );
}

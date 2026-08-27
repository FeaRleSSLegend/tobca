// app/_layout.tsx
import { useEffect, useState } from 'react';
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

// Keep the native splash screen visible until fonts finish loading —
// prevents a flash of system-font text before the real fonts swap in.
// preventAutoHideAsync can itself reject in some environments; swallow it
// so a splash-API hiccup can never bubble up and wedge startup.
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

  // A hard safety valve: never let the app sit on the splash for more than
  // a few seconds waiting on fonts. In a fresh production build the Google
  // font files have to load for the first time, and if any one of them
  // stalls, `fontsLoaded` would otherwise never flip and the app would hang
  // on the splash forever (which is exactly the failure this guards). After
  // the timeout we proceed anyway — missing fonts fall back to the system
  // font, a cosmetic issue; a frozen app is a fatal one.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Proceed as soon as fonts load, OR error, OR the timeout elapses.
  const ready = fontsLoaded || !!fontError || timedOut;

  // The animated splash takes over from the native one. The native splash is a
  // static image and can't animate, so the handoff is: hide it the moment the
  // tree can render, and have AnimatedSplash already mounted underneath it on
  // the same white background — so the swap is invisible and the animation
  // starts from what the user was already looking at.
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // The native splash stays up covering this until we're ready.
  if (!ready) return null;

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
      <AppearanceProvider>
      <ThemedChrome />
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

        {/* Last child so it covers the app, including the player overlay.
            Unmounted once finished — it has no reason to stay in the tree. */}
        {!splashDone && <AnimatedSplash onDone={() => setSplashDone(true)} />}
        </AudioFileProvider>
      </PlaybackProvider>
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

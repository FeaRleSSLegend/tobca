// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlaybackProvider } from '../providers/PlaybackProvider';
import { PlayerHost } from '../components/player/PlayerHost';
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

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  // The native splash stays up covering this until we're ready.
  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PlaybackProvider>
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
      </PlaybackProvider>
    </SafeAreaProvider>
  );
}
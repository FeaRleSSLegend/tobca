// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlaybackProvider } from '../providers/PlaybackProvider';
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
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Render nothing until fonts are ready — the native splash screen
  // stays up covering this, so there's no visible blank frame.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PlaybackProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* (tabs) is declared FIRST and explicitly so it is unambiguously
              the initial route. Without this, expo-router can elect the
              only other explicitly-declared screen (player) as the initial
              route, which made the app cold-start straight into the empty
              modal player. */}
          <Stack.Screen name="(tabs)" />
          {/* The player is presented modally — it slides up over whatever
              you were browsing and a down-chevron dismisses it, the media-
              app convention that keeps playback feeling like a layer on top
              of the app rather than a place you navigate away to. */}
          <Stack.Screen name="player" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </PlaybackProvider>
    </SafeAreaProvider>
  );
}
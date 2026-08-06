// app/index.tsx
// The app had NO route matching `/`. The tabs group exposes `/live`,
// `/library`, `/prayer` and `/bible-plan`, and there is no `index` file in
// either `app/` or `app/(tabs)/` — so a normal launcher cold start, whose
// initial URL is `tobca:///`, resolved to expo-router's `+not-found`
// instead of the app. `+not-found` renders outside the root layout, so
// `SplashScreen.hideAsync()` in app/_layout.tsx never ran and the app sat
// on the native splash forever (Android then raised an ANR).
//
// This is the entry route: `/` sends people to the Live tab, which is what
// the tab bar already treats as home.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/live" />;
}

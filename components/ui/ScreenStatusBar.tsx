// components/ui/ScreenStatusBar.tsx
// Per-screen status bar style, safe to use inside a navigator.
//
// THE PROBLEM THIS EXISTS TO SOLVE
// expo-status-bar's <StatusBar> is declarative but NOT scoped to the screen
// you are looking at. Its own docs say the props of every mounted StatusBar
// "will be merged in the order that they were mounted" — mount order, not
// focus order. In a tab navigator every tab you have visited stays mounted, so
// four screens each rendering their own <StatusBar> would leave whichever one
// you opened LAST in charge of the icon colour forever, including while you
// are looking at a different tab. That failure is invisible while every screen
// wants the same style and appears the moment one of them doesn't — i.e. the
// exact moment someone adds the first dark screen.
//
// So this renders the StatusBar ONLY WHILE THE SCREEN IS FOCUSED. Blurring
// unmounts it, which pops its entry off React Native's stack and hands control
// back to the next one down — the app-wide default in app/_layout.tsx.
//
// USE THIS FOR ROUTES. Full-screen OVERLAYS (the two player hosts) do not go
// through it: they are not routes, they have no focus state, and they are
// topmost by construction, so they mount expo-status-bar's StatusBar directly
// and guard it on their own expanded flag instead.
//
// WHAT "style" MEANS — it is the colour of the ICONS, not of the bar:
//   'dark'  dark icons. For a LIGHT background. This app's default, because
//           every route is c.bg or white.
//   'light' light icons. For a DARK background — the players' black/gradient
//           stages, and this screen's scrimmed artwork masthead.

// useIsFocused comes from expo-router, NOT from @react-navigation/native. As
// of SDK 56 expo-router refuses to bundle alongside a direct react-navigation
// import and fails the build with an explicit error — it re-exports the hooks
// it supports for exactly this reason.
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { StatusBarStyle } from 'expo-status-bar';
import { useThemeColors } from '../../hooks/useTheme';

interface ScreenStatusBarProps {
  /** Icon colour. 'dark' for light backgrounds, 'light' for dark ones. */
  style: StatusBarStyle;
}

export const ScreenStatusBar = ({ style }: ScreenStatusBarProps) => {
  const focused = useIsFocused();
  if (!focused) return null;
  // `animated` so a screen whose own background changes as it scrolls (the
  // playlist masthead) crossfades its icons instead of snapping them.
  return <StatusBar style={style} animated />;
};

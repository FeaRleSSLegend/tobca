// components/ui/ScreenHeader.tsx
// The title row every top-level tab shows, with the app menu in it.
//
// WHY THIS EXISTS
// Each of the four tabs used to hand-roll `sharedStyles.headerRow` with its
// own right-hand element. Three of them put a navy disc reading "JN" there —
// an avatar for an account that does not exist (the app has no sign-in), so it
// named a person nobody had been asked about and did nothing when tapped — and
// the fourth, Library, had already swapped that disc for a settings gear. The
// result was a control that existed on exactly one screen out of four, in the
// place where three other screens showed a decoration.
//
// App-level controls are per-APP, not per-screen, so they belong in the one
// piece of chrome all four screens share. VERIFIED, not assumed: this
// component is imported and rendered by all four tab screens —
// live.tsx (as "OliveBrook"), library.tsx, prayer.tsx and bible-plan.tsx
// ("Reading Plan") — so anything placed here is reachable at the identical
// coordinate from every top-level tab, and there is no second place a tab
// header can be defined.
//
// THE GEAR IS GONE, replaced by an overflow menu. Settings is now one of four
// app-level destinations (Settings, Give, About the Church, Share), and a gear
// cannot stand for that set — a gear means "settings", so anyone who read the
// icon correctly would never look behind it for the church's giving page. See
// components/ui/AppMenu for the full argument, including why a menu is the
// right container here despite the usual research against hidden menus.
//
// `eyebrow` is for Live, the one tab whose title carries a greeting line above
// it. Everything else passes a title alone.
import { View, Text } from 'react-native';
import { useSharedStyles } from '../../constants/styles/sharedStyles';
import { AppMenu } from './AppMenu';

interface ScreenHeaderProps {
  title: string;
  /** Small line above the title. Live's greeting; omitted everywhere else. */
  eyebrow?: string | null;
}

export const ScreenHeader = ({ title, eyebrow }: ScreenHeaderProps) => {
  // The themed sheet, so the title and eyebrow follow the appearance. The
  // light values are identical to what the frozen `sharedStyles` export gives
  // the screens not yet converted, so a converted header and an unconverted
  // body still agree in light mode.
  const sharedStyles = useSharedStyles();

  return (
    <View style={sharedStyles.headerRow}>
      <View>
        {!!eyebrow && <Text style={sharedStyles.screenEyebrow}>{eyebrow}</Text>}
        <Text style={sharedStyles.screenTitle}>{title}</Text>
      </View>

      <AppMenu />
    </View>
  );
};

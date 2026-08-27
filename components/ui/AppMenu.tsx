// components/ui/AppMenu.tsx
// The overflow menu in every top-level tab header.
//
// WHY A MENU IS DEFENSIBLE HERE, GIVEN THE RESEARCH SAYS IT USUALLY ISN'T
// The finding people cite — NNGroup's hidden-navigation work, and the mobile
// hamburger studies behind it — is that content behind a menu is discovered
// and used far less than content that is visible. That is an argument against
// putting NAVIGATION in a menu. It is not an argument against menus; the same
// research is explicit that low-frequency SECONDARY actions are what a menu is
// for, because the alternative is spending permanent screen real estate on
// something opened once a month.
//
// Everything in this list is that: Settings (opened rarely, and mostly once,
// to set appearance), Giving (deliberate, sought out — nobody donates by
// accident), About (read once), Share (occasional). None of it is navigation:
// the four tabs carry all of that, and they are visible at all times.
//
// SO THE CONSTRAINT IS THE LIST STAYS SHORT. A menu that is honest about being
// for rare actions stops being honest the moment something frequent gets
// filed into it because there was nowhere else to put it — and then the
// research's actual finding does start to apply. Four items. Adding a fifth is
// a decision, not a detail.
//
// WHY IT REPLACED A BARE GEAR
// The header previously held a settings gear and only a gear. Once there were
// four app-level destinations, the options were four icons in a header (a
// toolbar, on a screen whose header already carries a title and a search bar)
// or one affordance that opens the set. A gear cannot be that affordance: a
// gear means "settings", so "Give" and "About the Church" living behind one
// would be unfindable by anyone who read the icon correctly. `ellipsis`
// means "more", which is the only honest label for a mixed list.

import { useState } from 'react';
import { View, Text, Modal, Pressable, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { PressableScale } from './motion';
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { GIVE_URL, SHARE_MESSAGE, SHARE_URL } from '../../constants/links';

interface MenuItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Shown when the row leaves the app, so nothing opens a browser unannounced. */
  external?: boolean;
  onPress: () => void;
}

export const AppMenu = () => {
  const [open, setOpen] = useState(false);
  const styles = useStyles();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const push = useGuardedPush();

  // Close FIRST, then act. Pushing a route while a Modal is still mounted
  // leaves the modal over the new screen on Android until it finishes its
  // dismiss animation, which reads as the menu following you.
  const run = (fn: () => void) => {
    setOpen(false);
    // A frame's grace so the dismissal is underway before the navigation
    // starts; both animations then run together instead of fighting.
    requestAnimationFrame(fn);
  };

  const items: MenuItem[] = [
    {
      key: 'settings',
      label: 'Settings',
      icon: 'settings-outline',
      onPress: () => run(() => push('/settings')),
    },
    {
      key: 'give',
      label: 'Give',
      icon: 'heart-outline',
      external: true,
      // Out to the church's own giving page. See constants/links.ts for why
      // the app links out rather than showing account details itself.
      onPress: () => run(() => Linking.openURL(GIVE_URL).catch(() => {})),
    },
    {
      key: 'about',
      label: 'About the Church',
      icon: 'information-circle-outline',
      onPress: () => run(() => push('/about')),
    },
    {
      key: 'share',
      label: 'Share this app',
      icon: 'share-social-outline',
      onPress: () =>
        run(() => {
          // The native sheet. `url` is iOS-only and is what makes a rich
          // preview card appear there; Android reads `message`, which is why
          // the URL is also inside the message string.
          Share.share({ message: SHARE_MESSAGE, url: SHARE_URL }).catch(() => {});
        }),
    },
  ];

  return (
    <>
      <PressableScale
        style={styles.trigger}
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="More"
        accessibilityHint="Settings, giving, about the church and sharing"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={c.textPrimary} />
      </PressableScale>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        // Android's hardware back must close the menu rather than leaving the
        // tab underneath it.
        onRequestClose={() => setOpen(false)}
      >
        {/* The backdrop is the dismiss target — a menu you can only leave by
            choosing something from it is a trap. Deliberately faint: this is a
            popover, not a modal sheet, and a heavy scrim would say the app is
            blocked when it is one tap from where it was. */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        {/* insets.top + 48 puts the menu directly under the trigger. The tab
            screens wrap their content in a SafeAreaView with the 'top' edge,
            so the header row begins AT insets.top; 48 is that row's own
            padding (16) plus the trigger's height (32). */}
        <View
          style={[styles.sheet, { top: insets.top + 48 }]}
          accessibilityViewIsModal
          accessibilityRole="menu"
        >
          {items.map((item, i) => (
            <View key={item.key}>
              {i > 0 && <View style={styles.divider} />}
              <PressableScale
                style={styles.row}
                onPress={item.onPress}
                accessibilityRole="menuitem"
                accessibilityLabel={item.external ? `${item.label}, opens in your browser` : item.label}
              >
                <Ionicons name={item.icon} size={18} color={c.textSecondary} />
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.external && (
                  // States the consequence before the tap. The alternative is
                  // a browser opening with no warning, which on a giving link
                  // is exactly where people want to have been told.
                  <Ionicons name="open-outline" size={14} color={c.textMuted} />
                )}
              </PressableScale>
            </View>
          ))}
        </View>
      </Modal>
    </>
  );
};

const useStyles = makeThemedStyles((c) => ({
  trigger: {
    // EXACTLY sharedStyles.settingsBtn's metrics, so replacing the gear does
    // not move the header's right edge or change its height: 32pt, no fill,
    // no border, with hitSlop on the control taking the real target past 44.
    // The no-fill part is inherited reasoning, not laziness — that style's own
    // comment explains that a filled disc there stood in for a photo, and a
    // solid circle around a utility glyph out-shouts the page title beside it.
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,22,33,0.28)',
  },
  // Anchored under the trigger at the header's right edge, so the menu
  // visibly comes OUT of the control that opened it.
  sheet: {
    position: 'absolute',
    right: theme.layout.screenPadding,
    minWidth: 224,
    borderRadius: theme.radius.md,
    backgroundColor: c.surfaceRaised,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    overflow: 'hidden',
    // A popover has to read as floating ABOVE the page, and in dark mode a
    // shadow alone does not carry that — hence surfaceRaised above, which is
    // lighter than the surface behind it, with the shadow doing the work in
    // light mode where the card is already white.
    shadowColor: c.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    // 14 lands the row on the app's 48pt tap target next to an 18pt glyph —
    // the same arithmetic app/settings.tsx documents on its own rows.
    paddingVertical: 14,
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: c.textPrimary,
  },
  divider: {
    height: theme.layout.cardBorderWidth,
    backgroundColor: c.border,
    marginLeft: theme.spacing.lg,
  },
}));

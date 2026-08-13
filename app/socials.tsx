// app/socials.tsx
// Church Socials — a link-out directory, not a feed.
//
// Instagram content is deliberately never fetched or embedded here. Meta only
// permits that through a business-verified, app-reviewed Graph API integration,
// and the unofficial endpoints that appear to work violate their terms and
// break without notice. So this screen's whole job is to hand people off to
// Instagram cleanly and get out of the way.
//
// SHAPE: a profile hub (the Linktree pattern), not a settings list. The page
// has one subject — the church — so it opens with the church's own identity
// block and then offers its accounts as destinations. A titled list of
// identical rows would have read as configuration; a profile header plus
// distinct cards reads as "here is who we are, here is where to find us".

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { socialAccounts, SocialAccount, appUrl, webUrl } from '../data/socials';
import { PressableScale, FadeInUp, PopIn, staggerDelay } from '../components/ui/motion';

// Instagram's brand colour. Used ONLY on the small platform glyph, never as a
// surface: the app has one accent (pink) and letting a second brand colour
// fill a card would make every row compete with the church's own identity.
const INSTAGRAM = '#C13584';

/**
 * Open the Instagram app on the profile, fall back to the browser.
 *
 * Deliberately try/catch around openURL rather than checking canOpenURL first:
 * on Android 11+ a canOpenURL query for a scheme the manifest doesn't declare
 * returns false EVEN WHEN the app is installed, so a canOpenURL guard would
 * send everyone to the browser on most modern Androids. Attempting the deep
 * link and catching the rejection is the check.
 */
async function openProfile(handle: string) {
  try {
    await Linking.openURL(appUrl(handle));
  } catch {
    try {
      await Linking.openURL(webUrl(handle));
    } catch {
      // No Instagram app and no browser is a real device state; there is
      // nothing useful to say about it, so fail quietly.
    }
  }
}

const SocialCard = ({
  account,
  copied,
  onCopy,
}: {
  account: SocialAccount;
  copied: boolean;
  onCopy: (handle: string) => void;
}) => {
  if (!account.handle) return null;
  const handle = account.handle;

  return (
    <PressableScale
      style={styles.card}
      onPress={() => openProfile(handle)}
      // Long-press copies. A secondary action on a card whose primary action
      // leaves the app entirely — useful when you want to share the handle
      // rather than follow it right now.
      onLongPress={() => onCopy(handle)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${account.name} on Instagram, @${handle}`}
      accessibilityHint="Double tap to open Instagram. Long press to copy the handle."
    >
      <View style={styles.glyph}>
        <Ionicons name="logo-instagram" size={22} color={INSTAGRAM} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{account.name}</Text>
        {copied ? (
          <PopIn>
            <Text style={styles.cardCopied}>Handle copied</Text>
          </PopIn>
        ) : (
          <Text style={styles.cardHandle} numberOfLines={1}>@{handle}</Text>
        )}
      </View>

      {/* Outward arrow, not a chevron. A chevron promises another screen in
          this app; this leaves for another one entirely, and the glyph should
          say so before the tap rather than after. */}
      <Ionicons name="open-outline" size={18} color={theme.colors.grayIcon} />
    </PressableScale>
  );
};

export default function SocialsScreen() {
  const router = useRouter();
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  const copy = (handle: string) => {
    // Expo Go bundles no clipboard module and adding expo-clipboard would mean
    // a native rebuild, so the confirmation is shown optimistically and the
    // handle is put on screen for manual copy. Swap in Clipboard.setStringAsync
    // here the moment the dependency is added — the UI needs no change.
    setCopiedHandle(handle);
    setTimeout(() => setCopiedHandle((h) => (h === handle ? null : h)), 1600);
  };

  const accounts = socialAccounts.filter((a) => a.handle);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <PressableScale
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.navy} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* PROFILE BLOCK. Centred — one of the few places the skill's
            "left-align by default" rule gives way, because this is a single
            subject introducing itself, which is exactly the hero/empty-state
            exception. */}
        <FadeInUp>
          <View style={styles.profile}>
            <View style={styles.avatarRing}>
              <Image
                source={require('../assets/brand-logo.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.churchName}>The OliveBrook Church</Text>
            <Text style={styles.churchMeta}>Kubwa · Wuse 2 · Abuja, Nigeria</Text>

            <View style={styles.glyphRow}>
              <Ionicons name="logo-instagram" size={16} color={theme.colors.grayIcon} />
              <Ionicons name="logo-youtube" size={16} color={theme.colors.grayIcon} />
            </View>
          </View>
        </FadeInUp>

        <Text style={styles.sectionLabel}>FOLLOW US</Text>

        {accounts.map((a, i) => (
          <FadeInUp key={a.id} delay={staggerDelay(i)}>
            <SocialCard
              account={a}
              copied={copiedHandle === a.handle}
              onCopy={copy}
            />
          </FadeInUp>
        ))}

        <Text style={styles.disclosure}>
          These open Instagram — posts and video stay there.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // A hair off the app background so the white cards below read as raised
    // surfaces rather than as blocks painted on the same sheet.
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl * 2,
  },

  // ---- Profile block ----
  profile: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    marginBottom: theme.spacing.lg,
    // Two-part shadow: a tight one for crispness, the soft spread for
    // atmosphere. A single large blur reads as fog rather than elevation.
    shadowColor: theme.colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatar: {
    width: 74,
    height: 74 / (768 / 273),
  },
  churchName: {
    fontFamily: theme.fontFamily.display,
    fontSize: 24,
    letterSpacing: -0.4,
    color: theme.colors.navy,
    textAlign: 'center',
  },
  churchMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.graySecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  glyphRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },

  sectionLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },

  // ---- Link cards ----
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    // Generous vertical padding is what separates a "card" from a "list row";
    // 16 top and bottom puts each card comfortably over the 44pt target too.
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    shadowColor: theme.colors.navy,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  glyph: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // The brand colour at 10% rather than full: enough to identify the
    // platform, quiet enough that four stacked cards don't shout.
    backgroundColor: 'rgba(193,53,132,0.10)',
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.cardTitle,
    color: theme.colors.navy,
  },
  cardHandle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.graySecondary,
    marginTop: 2,
  },
  cardCopied: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.success,
    marginTop: 2,
  },

  disclosure: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.grayIcon,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 19,
  },
});

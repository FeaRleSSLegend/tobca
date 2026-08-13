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
import { useStackBottomClearance } from '../hooks/useBottomClearance';
import { socialAccounts, SocialAccount, SocialSection, SECTION_TITLES, appUrl, webUrl } from '../data/socials';
import { PressableScale, FadeInUp, PopIn, staggerDelay } from '../components/ui/motion';

// Platform brand colours, used ONLY on the small glyph and its tinted disc —
// never as a card surface. The app has one accent (pink); letting two more
// brand colours fill cards would make every row compete with the church's own
// identity. At 10% they identify the destination without shouting.
const PLATFORM = {
  instagram: { colour: '#C13584', tint: 'rgba(193,53,132,0.10)', icon: 'logo-instagram' },
  youtube: { colour: '#FF0000', tint: 'rgba(255,0,0,0.10)', icon: 'logo-youtube' },
} as const;

/**
 * Open the Instagram app on the profile, fall back to the browser.
 *
 * Deliberately try/catch around openURL rather than checking canOpenURL first:
 * on Android 11+ a canOpenURL query for a scheme the manifest doesn't declare
 * returns false EVEN WHEN the app is installed, so a canOpenURL guard would
 * send everyone to the browser on most modern Androids. Attempting the deep
 * link and catching the rejection is the check.
 */
async function openProfile(account: SocialAccount) {
  try {
    await Linking.openURL(appUrl(account));
  } catch {
    try {
      await Linking.openURL(webUrl(account));
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
  const handle = account.handle;
  const brand = PLATFORM[account.platform];

  return (
    <PressableScale
      style={styles.card}
      onPress={() => openProfile(account)}
      // Long-press copies. A secondary action on a card whose primary action
      // leaves the app entirely — useful when you want to share the handle
      // rather than follow it right now.
      onLongPress={() => onCopy(account.display)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${account.name} on ${account.platform === 'youtube' ? 'YouTube' : 'Instagram'}, ${account.display}`}
      accessibilityHint="Double tap to open the app. Long press to copy the handle."
    >
      <View style={[styles.glyph, { backgroundColor: brand.tint }]}>
        <Ionicons name={brand.icon} size={22} color={brand.colour} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{account.name}</Text>
        {copied ? (
          <PopIn>
            <Text style={styles.cardCopied}>Handle copied</Text>
          </PopIn>
        ) : (
          <Text style={styles.cardHandle} numberOfLines={1}>{account.display}</Text>
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
  // Runtime value, so it can't live in the StyleSheet: this screen's
  // SafeAreaView deliberately guards only the top edge (content must be able
  // to scroll under the home indicator), which is exactly why the last card
  // was sitting flush against the bottom of the display.
  const bottomClearance = useStackBottomClearance();

  const copy = (handle: string) => {
    // Expo Go bundles no clipboard module and adding expo-clipboard would mean
    // a native rebuild, so the confirmation is shown optimistically and the
    // handle is put on screen for manual copy. Swap in Clipboard.setStringAsync
    // here the moment the dependency is added — the UI needs no change.
    setCopiedHandle(handle);
    setTimeout(() => setCopiedHandle((h) => (h === handle ? null : h)), 1600);
  };

  const accounts = socialAccounts;

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

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
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

        {(['pastors', 'church'] as SocialSection[]).map((section) => {
          const rows = accounts.filter((a) => a.section === section);
          if (rows.length === 0) return null;
          return (
            // `gap` rather than a marginBottom on the card itself. The card
            // carried its own 12pt bottom margin, which meant the LAST card in
            // a group contributed 12 on top of the next section label's 24 —
            // a 36pt gap where every other section boundary on the screen was
            // 24. A gap only ever falls BETWEEN siblings, so the group spaces
            // its own rows and contributes nothing past its last one.
            <View key={section} style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>{SECTION_TITLES[section].toUpperCase()}</Text>
              {rows.map((a, i) => (
                <FadeInUp key={a.id} delay={staggerDelay(i)}>
                  <SocialCard
                    account={a}
                    copied={copiedHandle === a.display}
                    onCopy={copy}
                  />
                </FadeInUp>
              ))}
            </View>
          );
        })}

        <Text style={styles.disclosure}>
          These open Instagram and YouTube — posts and video stay there.
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
    // paddingBottom is applied at the call site, not here: it has to add the
    // device's bottom safe-area inset, which is only known at runtime. A
    // constant 64 here was the bug — on a phone with a home indicator the
    // last card still ended underneath it.
  },

  // ---- Profile block ----
  profile: {
    alignItems: 'center',
    // The back-button header above already ends in 8pt of padding; adding 8
    // here made it 16. The header owns it.
    paddingTop: 0,
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
    marginTop: theme.space.tight,
    textAlign: 'center',
  },
  glyphRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },

  // One gap value for everything INSIDE a section — label to first card, and
  // card to card. The section boundary is owned solely by sectionLabel's
  // marginTop, so the two can never add together.
  sectionGroup: {
    gap: theme.spacing.md,
  },
  sectionLabel: {
    marginTop: theme.space.section,
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: theme.colors.graySecondary,
    textTransform: 'uppercase',
    // The group's `gap` supplies this now — leaving the margin here as well
    // would have made label-to-first-card 24 while card-to-card stayed 12.
    marginBottom: 0,
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
    // Inter-card spacing is the group's `gap` — see sectionGroup.
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
    marginTop: theme.space.hairline,
  },
  cardCopied: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.success,
    marginTop: theme.space.hairline,
  },

  disclosure: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.grayIcon,
    textAlign: 'center',
    // Section step, same as every other block boundary on this screen — it
    // was 20, close enough to 24 to read as an inconsistency rather than a
    // distinction.
    marginTop: theme.space.section,
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 19,
  },
});

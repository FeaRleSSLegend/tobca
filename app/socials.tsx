// app/socials.tsx
// Church Socials — a link-out directory, not a feed.
//
// Instagram content is deliberately never fetched or embedded here. Meta only
// permits that through a business-verified, app-reviewed Graph API integration,
// and the unofficial endpoints that appear to work violate their terms and
// break without notice. So this screen's whole job is to hand people off to
// Instagram cleanly and get out of the way.

import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { sharedStyles } from '../constants/styles/sharedStyles';
import { socialAccounts, SocialAccount, appUrl, webUrl } from '../data/socials';
import { PressableScale, FadeInUp, staggerDelay } from '../components/ui/motion';

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

const SocialCard = ({ account }: { account: SocialAccount }) => {
  const pending = account.handle === null;

  return (
    <PressableScale
      style={[styles.card, pending && styles.cardPending]}
      onPress={() => account.handle && openProfile(account.handle)}
      disabled={pending}
      accessibilityRole="button"
      accessibilityState={{ disabled: pending }}
      accessibilityLabel={
        pending
          ? `${account.name}, Instagram coming soon`
          : `Open ${account.name} on Instagram`
      }
    >
      {/* Instagram's mark is a gradient, so the badge uses the app's own
          gradient rather than a flat brand fill — it reads as "Instagram" by
          shape and colour treatment without shipping their logo. */}
      <LinearGradient
        colors={pending ? ['#D5DBE1', '#C3CBD3'] : theme.gradient.colors}
        start={theme.gradient.start}
        end={theme.gradient.end}
        style={styles.badge}
      >
        <Ionicons name="logo-instagram" size={22} color={theme.colors.white} />
      </LinearGradient>

      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{account.name}</Text>
        <Text style={styles.handle} numberOfLines={1}>
          {pending ? 'Coming soon' : `@${account.handle}`}
        </Text>
      </View>

      {!pending && (
        <Ionicons name="open-outline" size={18} color={theme.colors.grayIcon} />
      )}
    </PressableScale>
  );
};

export default function SocialsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={sharedStyles.container}>
      <View style={styles.header}>
        <PressableScale
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </PressableScale>
        <Text style={sharedStyles.screenTitle}>Socials</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Follow the church and our pastors on Instagram.
        </Text>

        {socialAccounts.map((a, i) => (
          <FadeInUp key={a.id} delay={staggerDelay(i)}>
            <SocialCard account={a} />
          </FadeInUp>
        ))}

        {/* Says plainly where these go. A screen of link-outs that opens
            another app without warning is a small betrayal of expectation —
            Nielsen's "user control and freedom". */}
        <Text style={styles.footnote}>
          These open Instagram. Video and posts stay on Instagram — they aren&apos;t
          shown inside the app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  intro: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.graySecondary,
    marginBottom: theme.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.grayBorder,
    backgroundColor: theme.colors.surface,
  },
  cardPending: {
    backgroundColor: theme.colors.bg,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
  },
  handle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
    marginTop: 2,
  },
  footnote: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
    marginTop: theme.spacing.lg,
    lineHeight: 18,
  },
});

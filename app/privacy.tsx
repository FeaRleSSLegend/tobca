// app/privacy.tsx
// A PLAIN-LANGUAGE privacy notice, not a legal document.
//
// This is deliberately not boilerplate policy text, and it is not written to
// look like one. The app genuinely collects nothing: there are no accounts, no
// sign-in, no forms, no analytics SDK and no crash reporter in package.json,
// and nothing typed into it is ever sent anywhere. Dressing that up in
// "we may collect certain information from time to time" language would be
// less accurate than the truth, not more, and it would imply obligations
// nobody here has agreed to.
//
// EVERY CLAIM BELOW IS CHECKABLE AGAINST THE CODE, which is the only reason it
// is safe to state it this plainly:
//   - no analytics/telemetry dependency exists in package.json
//   - the only network calls are outbound reads: YouTube's Data API, the
//     church's public Cloudflare R2 bucket, and the Bible API (services/)
//   - everything remembered — reading streak, playback positions, saved
//     audio, Bible version, appearance choice — is AsyncStorage on the
//     device (utils/, providers/), and leaves with the app when it is deleted
//
// IF THAT EVER STOPS BEING TRUE — an account system, a prayer-request form, a
// crash reporter — this screen has to change in the same commit. A notice that
// was true once is worse than no notice.
//
// It is also flagged as what it is: a plain-language summary, with a line
// saying a formal policy will replace it if the app ever needs one (the app
// stores require a hosted policy URL at submission time).

import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { makeThemedStyles, useThemeColors } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/motion';
import { useStackBottomClearance } from '../hooks/useBottomClearance';

/** One "what we don't do" line, with its own tick. */
const Point = ({ children }: { children: React.ReactNode }) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
  <View style={styles.point}>
    <Ionicons
      name="checkmark-circle"
      size={18}
      color={c.success}
      style={styles.pointIcon}
    />
    <Text style={styles.pointText}>{children}</Text>
  </View>
);
}

export default function PrivacyScreen() {
  const styles = useStyles();
  const c = useThemeColors();
  const router = useRouter();
  const bottomClearance = useStackBottomClearance();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <PressableScale
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={c.navy} />
        </PressableScale>
        <Text style={styles.title}>Privacy</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lede}>
          This app does not collect your personal information.
        </Text>

        <Text style={styles.body}>
          There are no accounts to create and no forms to fill in, so there is
          nothing for us to gather. You can use everything in the app without
          telling us who you are.
        </Text>

        <View style={styles.card}>
          <Point>No sign-in, no account, no password.</Point>
          <Point>No name, email address or phone number is asked for.</Point>
          <Point>No advertising, tracking or analytics.</Point>
        </View>

        <Text style={styles.sectionLabel}>WHAT STAYS ON YOUR PHONE</Text>
        <Text style={styles.body}>
          A few things are remembered so the app is useful when you come back:
          your Bible reading streak and which days you have read, where you
          stopped in a message, any audio you saved to listen offline, your
          Bible version, and your appearance choice. All of it is stored on
          this device only. Deleting the app deletes all of it.
        </Text>

        <Text style={styles.sectionLabel}>WHAT THE APP CONNECTS TO</Text>
        <Text style={styles.body}>
          To show you content, the app downloads it from YouTube, from the
          church's own audio library, and from a Bible text service. Those are
          ordinary downloads — the app sends them nothing about you. YouTube
          video plays through YouTube itself and is subject to Google's own
          privacy terms.
        </Text>

        <Text style={styles.footnote}>
          This is a plain-language summary written to be honest rather than
          legal. If the app ever adds something that does collect information,
          this page will say so before it does.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: c.grayBorder,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.navy,
  },
  content: {
    padding: theme.layout.screenPadding,
  },
  // The one sentence that answers the question people opened this screen with.
  // Set at display size so it is read rather than skimmed past.
  lede: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.display,
    lineHeight: theme.fontSize.display * 1.3,
    letterSpacing: -0.4,
    color: c.navy,
    marginTop: theme.space.tight,
    marginBottom: theme.space.related,
  },
  body: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    lineHeight: theme.fontSize.bodyLg * 1.6,
    color: c.graySecondary,
  },
  sectionLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: c.grayIcon,
    marginTop: theme.space.section,
    marginBottom: theme.space.tight,
  },
  card: {
    backgroundColor: c.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.grayBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginTop: theme.space.related,
  },
  point: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  // Nudged down to sit on the first line's optical centre rather than its top.
  pointIcon: {
    marginTop: theme.space.hairline,
  },
  pointText: {
    flex: 1,
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    lineHeight: theme.fontSize.bodyLg * 1.45,
    color: c.navy,
  },
  footnote: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    lineHeight: theme.fontSize.caption * 1.6,
    color: c.grayIcon,
    marginTop: theme.space.major,
  },
}));

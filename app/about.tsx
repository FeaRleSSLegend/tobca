// app/about.tsx
// ABOUT THE CHURCH — reached from the header menu.
//
// EVERY LINE ON THIS SCREEN IS SOURCED. Nothing here was written to fill the
// page, because an About screen is the one place in an app where invented copy
// does real damage: it is what a stranger reads to decide whether this is a
// real church, and a plausible-sounding mission statement that the church
// never said is a lie told in their name.
//
//   Mission statement      verbatim from theolivebrookchurch.org
//   "Making everyone…"     verbatim, the site's own summary line
//   Service times          data/services.ts, which the Live tab's countdown
//                          already runs on — and which matches the times
//                          published on the site, checked both ways
//   Branches + locations   data/branches.ts. Kubwa's location string is the
//                          one the church's own YouTube channel publishes
//                          ("IGNOBIS HOTELS, Kubwa, Abuja - Nigeria")
//   Pastors                data/socials.ts, the existing verified accounts
//
// WHAT IS DELIBERATELY MISSING
//   A street address for Wuse 2. The branch is real and its channel is real,
//   but no address for it exists anywhere in this project or on the site, and
//   a wrong address is the single worst error a church app can ship — someone
//   drives to it on a Sunday morning. The branch is listed without one.
//   Wuse 2's service TIMES are absent for the same reason: data/branches.ts
//   deliberately leaves its schedule empty rather than copying Kubwa's, and
//   this screen honours that rather than quietly showing Kubwa's times under
//   both names.
//   A phone number and an email. Neither exists in the project. "Get in touch"
//   points at the Socials screen, where the accounts are real and checkable.

import { View, Text, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { makeThemedStyles, useThemeColors, useThemeGradient } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/motion';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { useStackBottomClearance } from '../hooks/useBottomClearance';
import { branches } from '../data/branches';
import { services } from '../data/services';
import { CHURCH_WEBSITE, GIVE_URL } from '../constants/links';

/** Kubwa's location, as the church's own YouTube channel publishes it. */
const KUBWA_LOCATION = 'IGNOBIS HOTELS, Kubwa, Abuja';

export default function AboutScreen() {
  const router = useRouter();
  const push = useGuardedPush();
  const styles = useStyles();
  const c = useThemeColors();
  const gradient = useThemeGradient();
  const bottomClearance = useStackBottomClearance();

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <PressableScale
          style={styles.backBtn}
          onPress={() => router.back()}
          // Drawn at 32pt. Back is the most-used control on a pushed
          // screen and it sits in the hardest corner to reach, so it gets the
          // hitSlop that lifts it to the 44pt floor.
          hitSlop={theme.control.hitSlop.iconSm}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={c.textPrimary} />
        </PressableScale>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* The one gradient moment on the screen — the church's name, in the
            colour the brand spends its big-block budget on. Everything below
            stays navy-on-white so this reads as the masthead and not as
            wallpaper (see the note in constants/theme.ts). */}
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={styles.masthead}
        >
          <Text style={styles.mastheadName}>The OliveBrook Church</Text>
          <Text style={styles.mastheadCity}>Abuja, Nigeria</Text>
        </LinearGradient>

        {/* ---------------- MISSION ---------------- */}
        <Text style={styles.sectionLabel}>OUR MISSION</Text>
        <View style={styles.card}>
          <Text style={styles.mission}>
            We will unlock the limitless possibilities of the recreated human spirit through the
            provision of divine intelligence backed up by the demonstration of the Holy Spirit.
          </Text>
          <View style={styles.missionRule} />
          <Text style={styles.missionSub}>
            Making everyone, everywhere that comes in contact with us become all that God wants
            them to be.
          </Text>
        </View>

        {/* ---------------- BRANCHES ---------------- */}
        <Text style={styles.sectionLabel}>WHERE WE MEET</Text>
        <View style={styles.card}>
          {branches.map((b, i) => (
            <View key={b.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.branchRow}>
                <View style={styles.branchIcon}>
                  <Ionicons name="location-outline" size={16} color={c.accent} />
                </View>
                <View style={styles.branchBody}>
                  <Text style={styles.branchName}>{b.name}</Text>
                  {/* Only Kubwa has a published location. Wuse 2 gets its city
                      and nothing more — see the header note on why an invented
                      address is the worst possible error here. */}
                  <Text style={styles.branchMeta}>
                    {b.id === 'kubwa' ? KUBWA_LOCATION : b.city}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ---------------- SERVICES ---------------- */}
        <Text style={styles.sectionLabel}>SERVICE TIMES</Text>
        <View style={styles.card}>
          {services.map((s, i) => (
            <View key={s.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.serviceRow}>
                <View style={styles.serviceBody}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceDay}>{s.day}</Text>
                </View>
                <Text style={styles.serviceTime}>{s.time}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.note}>
            These are the Kubwa branch's times. Wuse 2 keeps its own schedule, which is not
            published here yet.
          </Text>
        </View>

        {/* ---------------- LINKS ---------------- */}
        <Text style={styles.sectionLabel}>MORE</Text>
        <View style={styles.card}>
          <LinkRow icon="globe-outline" label="Visit our website" external onPress={() => open(CHURCH_WEBSITE)} />
          <View style={styles.divider} />
          <LinkRow icon="heart-outline" label="Give" external onPress={() => open(GIVE_URL)} />
          <View style={styles.divider} />
          <LinkRow icon="chatbubble-ellipses-outline" label="Follow and get in touch" onPress={() => push('/socials')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const LinkRow = ({
  icon,
  label,
  external,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  external?: boolean;
  onPress: () => void;
}) => {
  const styles = useStyles();
  const c = useThemeColors();
  return (
    <PressableScale
      style={styles.linkRow}
      onPress={onPress}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={external ? `${label}, opens in your browser` : label}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={17} color={c.slate} />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons
        name={external ? 'open-outline' : 'chevron-forward'}
        size={external ? 15 : 17}
        color={c.textMuted}
      />
    </PressableScale>
  );
};

const useStyles = makeThemedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: c.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.textPrimary,
  },
  content: {
    padding: theme.layout.screenPadding,
  },

  masthead: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.space.micro,
  },
  mastheadName: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.display,
    color: c.textOnAccent,
    textAlign: 'center',
  },
  mastheadCity: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    letterSpacing: theme.editorial.trackLabel,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.88)',
  },

  sectionLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: c.textMuted,
    marginTop: theme.space.section,
    marginBottom: theme.space.tight,
  },
  card: {
    backgroundColor: c.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  divider: {
    height: theme.layout.cardBorderWidth,
    backgroundColor: c.border,
    marginLeft: theme.spacing.lg,
  },

  mission: {
    fontFamily: theme.fontFamily.serif,
    fontSize: theme.fontSize.cardTitle,
    lineHeight: theme.fontSize.cardTitle * 1.6,
    color: c.textPrimary,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  // A short rule rather than a full divider: the second line is a continuation
  // of the mission, not a separate row.
  missionRule: {
    height: 2,
    width: 32,
    borderRadius: theme.radius.full,
    backgroundColor: c.accent,
    marginLeft: theme.spacing.lg,
  },
  missionSub: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    lineHeight: theme.fontSize.bodyLg * 1.55,
    color: c.textSecondary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },

  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  branchIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchBody: {
    flex: 1,
    gap: theme.space.hairline,
  },
  branchName: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.textPrimary,
  },
  branchMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.textSecondary,
  },

  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  serviceBody: {
    flex: 1,
    gap: theme.space.hairline,
  },
  serviceName: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.textPrimary,
  },
  serviceDay: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.body,
    color: c.textSecondary,
  },
  serviceTime: {
    fontFamily: theme.fontFamily.displaySemibold,
    fontSize: theme.fontSize.bodyLg,
    color: c.accent,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  linkIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: c.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: c.textPrimary,
  },

  note: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    lineHeight: theme.fontSize.caption * 1.5,
    color: c.textSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
}));

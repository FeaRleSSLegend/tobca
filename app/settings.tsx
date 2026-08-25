// app/settings.tsx
// The app's settings, reached from the gear in the Library header.
//
// KEPT SHORT ON PURPOSE. A church app has very little to configure: there are
// no accounts, no sync, no notification categories, no content preferences.
// The temptation with a new Settings screen is to pad it until it looks like a
// real one; the result is a page of rows that do nothing, which teaches people
// that nothing in here is worth opening. Four sections, every row real:
//
//   APPEARANCE  Light / Dark / System. The choice persists; the THEMING does
//               not exist yet, and the screen says so in as many words rather
//               than letting someone tap Dark and conclude the app is broken.
//               See providers/AppearanceProvider.tsx for why that is a
//               separate project.
//   ABOUT       Privacy, and the church's own accounts as the way to reach a
//               human. No invented support email — the Socials screen already
//               lists the real, verifiable accounts, and a made-up address in
//               a settings screen is worse than no address at all.
//   DISPLAY     A read-only report of the OS text-size setting. This is the
//               one row that would not exist in a generic settings screen, and
//               it earns its place: "the app is bigger on my phone than in the
//               emulator" is a question about this number, and there was no way
//               to see it. It is stated as information, not offered as a
//               control — the app must follow the OS accessibility setting.
//   VERSION     Read from app.json through expo-constants at runtime. Never
//               typed in here: a hardcoded version string is wrong the first
//               time someone bumps app.json and nobody notices for months.

import { View, Text, ScrollView, StyleSheet, PixelRatio } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme } from '../constants/theme';
import { PressableScale } from '../components/ui/motion';
import { useGuardedPush } from '../hooks/useGuardedPush';
import { useStackBottomClearance } from '../hooks/useBottomClearance';
import {
  useAppearance,
  type AppearancePreference,
} from '../providers/AppearanceProvider';

const APPEARANCE_OPTIONS: {
  value: AppearancePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

/** The repeating "icon · label · value/chevron" row. */
const SettingsRow = ({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) => {
  const body = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={17} color={theme.colors.slate} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={17} color={theme.colors.grayIcon} />
      ) : null}
    </>
  );

  // A row that goes somewhere is a button; a row that only reports a value is
  // not, and must not be given a press affordance or a button role it cannot
  // honour.
  return onPress ? (
    <PressableScale
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      {body}
    </PressableScale>
  ) : (
    <View style={styles.row} accessibilityLabel={value ? `${label}, ${value}` : label}>
      {body}
    </View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const push = useGuardedPush();
  const bottomClearance = useStackBottomClearance();
  const { preference, setPreference, hydrated } = useAppearance();

  // From app.json via expo-constants, never typed in. `version` is what
  // app.json declares; the build number only exists once a native build has
  // assigned one, so it is appended only when it is actually there rather
  // than rendered as "1.0.0 (undefined)".
  const version = Constants.expoConfig?.version ?? '—';
  const build =
    Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber;
  const versionLabel = build ? `${version} (${build})` : version;

  // The OS TEXT-SIZE setting, as a percentage. 100% is the phone's default;
  // anything above it means the system is asking every app to draw text larger,
  // which React Native honours on every <Text> by default (nothing in this
  // project sets allowFontScaling={false}, and nothing should).
  //
  // NOT the whole story, which is why the note below names both settings:
  // Android has a SECOND control, "Display size", which changes screen DENSITY
  // rather than font scale. It makes everything bigger — text, cards, icons —
  // and getFontScale() stays at 1.0 throughout, so a phone that looks larger
  // than an emulator at 100% here is almost certainly on a raised Display size.
  const fontScalePercent = Math.round(PixelRatio.getFontScale() * 100);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <PressableScale
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </PressableScale>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------- APPEARANCE ---------------- */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.segment} accessibilityRole="radiogroup">
            {APPEARANCE_OPTIONS.map((opt) => {
              // Until the stored value has been read back, nothing is drawn as
              // selected. Showing 'System' selected for a frame and then
              // jumping to the real choice reads as the app forgetting it.
              const active = hydrated && preference === opt.value;
              return (
                <PressableScale
                  key={opt.value}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  onPress={() => setPreference(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={opt.label}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={active ? theme.colors.white : theme.colors.graySecondary}
                  />
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {opt.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {/* THE HONEST NOTE. It is not a disclaimer bolted on — it is the
              only thing that makes the control above defensible to ship. */}
          <Text style={styles.note}>
            Your choice is saved, but the app is still light-only for now. Dark
            colours are coming in a later update.
          </Text>
        </View>

        {/* ---------------- ABOUT ---------------- */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy"
            onPress={() => push('/privacy')}
          />
          <View style={styles.divider} />
          {/* Not a mailto. The church's real, checkable accounts are already
              listed on the Socials screen; inventing a support address here
              would be inventing a channel nobody is watching. */}
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            label="Get in touch"
            onPress={() => push('/socials')}
          />
        </View>

        {/* ---------------- DISPLAY ---------------- */}
        <Text style={styles.sectionLabel}>DISPLAY</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="text-outline"
            label="System text size"
            value={`${fontScalePercent}%`}
          />
          <Text style={styles.note}>
            This is your phone's own text-size setting, not an app setting. The
            app follows it on purpose so everything stays readable. If the app
            looks larger or smaller than you expect, check both Text size and
            Display size under your phone's Display settings — Display size
            changes how big everything is without changing this number.
          </Text>
        </View>

        {/* ---------------- VERSION ---------------- */}
        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>The OliveBrook Church</Text>
          <Text style={styles.versionMeta}>Version {versionLabel}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.layout.cardBorderWidth,
    borderBottomColor: theme.colors.grayBorder,
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
    color: theme.colors.navy,
  },
  content: {
    padding: theme.layout.screenPadding,
  },
  // Small caps, the same register SectionLabel and MediaModeSwitch use for a
  // label that names the block under it.
  sectionLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: theme.colors.grayIcon,
    marginTop: theme.space.section,
    marginBottom: theme.space.tight,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    // 14 rather than a scale step: with the 28pt icon disc this lands the row
    // on the 48pt tap target the rest of the app uses (layout.tabTapTarget).
    paddingVertical: 14,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
  },
  rowValue: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.graySecondary,
  },
  // Inset to the label, not full-bleed: a divider that starts under the icon
  // groups the rows instead of slicing the card in half.
  divider: {
    height: theme.layout.cardBorderWidth,
    backgroundColor: theme.colors.grayBorder,
    marginLeft: theme.spacing.lg + 28 + theme.spacing.md,
  },
  segment: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.micro + 2,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: theme.colors.grayBorder,
    backgroundColor: theme.colors.bg,
  },
  // Filled, not merely tinted: selection here has to survive at a glance and
  // in greyscale, and the icon swaps colour with it so it is never carried by
  // hue alone.
  segmentItemActive: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navy,
  },
  segmentText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
  },
  segmentTextActive: {
    color: theme.colors.white,
  },
  note: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    lineHeight: theme.fontSize.caption * 1.5,
    color: theme.colors.graySecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.space.micro,
  },
  versionBlock: {
    alignItems: 'center',
    marginTop: theme.space.major,
    gap: theme.space.micro,
  },
  versionText: {
    fontFamily: theme.fontFamily.displaySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.graySecondary,
  },
  versionMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
  },
});

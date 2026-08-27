// app/settings.tsx
// The app's settings, reached from the header menu (components/ui/AppMenu).
//
// KEPT SHORT ON PURPOSE. A church app has very little to configure: there are
// no accounts, no sync, no notification categories, no content preferences.
// The temptation with a new Settings screen is to pad it until it looks like a
// real one; the result is a page of rows that do nothing, which teaches people
// that nothing in here is worth opening. Four sections, every row real:
//
//   APPEARANCE  Light / Dark / System, and it NOW ACTUALLY WORKS. The choice
//               persists and the app redraws in it. See
//               providers/AppearanceProvider and constants/palette.ts. The
//               screen no longer carries the "saved but not applied" apology
//               it shipped with, because that is no longer true.
//   ABOUT       The church, privacy, and the church's own accounts as the way
//               to reach a human. No invented support email: the Socials
//               screen already lists the real, verifiable accounts, and a
//               made-up address in a settings screen is worse than none.
//   DISPLAY     A read-only report of the OS text-size setting. This is the
//               one row that would not exist in a generic settings screen, and
//               it earns its place: "the app is bigger on my phone than in the
//               emulator" is a question about this number, and there was no way
//               to see it. It is stated as information, not offered as a
//               control: the app must follow the OS accessibility setting.
//   VERSION     Read from app.json through expo-constants at runtime. Never
//               typed in here: a hardcoded version string is wrong the first
//               time someone bumps app.json and nobody notices for months.
//
// TWO SWEEPS APPLIED TO THIS FILE:
//
// SPACING. The screen mixed the two scales arbitrarily — `spacing` (the
// component-internal 4/8/12/16/20/24/32 scale) and `space` (the layout scale
// with four named steps) — picking whichever came to hand, plus one computed
// value, `theme.space.micro + 2`, which is 6 and is on neither scale. That is
// exactly the failure constants/theme.ts warns about in its own comments: when
// a value is off-scale, nothing distinguishes it from its neighbours and the
// rhythm reads as random. The rule now applied here, which is the rule that
// file states: `space` governs the gaps BETWEEN blocks, `spacing` governs
// padding INSIDE a component, and nothing is arithmetic on a token. The
// section-label gap also moved from `tight` (8) to `header` (12) to match
// sharedStyles.sectionHeaderRow, so a section header sits the same distance
// above its content here as it does on every other screen in the app.
//
// EM DASHES. Removed from every user-facing string on this screen, per the
// project's no-em-dash preference. The version fallback was itself a bare em
// dash character standing in for an unknown version, which is the same problem
// wearing a hat; it now says so in words.

import { View, Text, ScrollView, PixelRatio } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme } from '../constants/theme';
import { makeThemedStyles, useThemeColors } from '../hooks/useTheme';
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

/** The repeating "icon, label, value/chevron" row. */
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
  const styles = useStyles();
  const c = useThemeColors();

  const body = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={17} color={c.slate} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={17} color={c.textMuted} /> : null}
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
  const styles = useStyles();
  const c = useThemeColors();
  const bottomClearance = useStackBottomClearance();
  const { preference, setPreference, hydrated } = useAppearance();

  // From app.json via expo-constants, never typed in. `version` is what
  // app.json declares; the build number only exists once a native build has
  // assigned one, so it is appended only when it is actually there rather
  // than rendered as "1.0.0 (undefined)".
  const version = Constants.expoConfig?.version ?? 'Unknown';
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
  // rather than font scale. It makes everything bigger, text, cards and icons
  // alike, and getFontScale() stays at 1.0 throughout, so a phone that looks
  // larger than an emulator at 100% here is almost certainly on a raised
  // Display size.
  const fontScalePercent = Math.round(PixelRatio.getFontScale() * 100);

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
                    color={active ? c.onFillStrong : c.textSecondary}
                  />
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {opt.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {/* The note that used to say the choice was saved but not applied is
              gone, because it is no longer true. What replaced it is the one
              thing about this control that is not self-evident: what "System"
              actually follows. */}
          <Text style={styles.note}>
            System follows your phone's own light or dark setting, and changes with it straight
            away.
          </Text>
        </View>

        {/* ---------------- ABOUT ---------------- */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="information-circle-outline"
            label="About the Church"
            onPress={() => push('/about')}
          />
          <View style={styles.divider} />
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
            This is your phone's own text-size setting, not an app setting. The app follows it on
            purpose so everything stays readable. If the app looks larger or smaller than you
            expect, check both Text size and Display size under your phone's Display settings.
            Display size changes how big everything is without changing this number.
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
  title: {
    fontSize: theme.fontSize.bodyLg,
    fontFamily: theme.fontFamily.bodyBold,
    color: c.textPrimary,
  },
  content: {
    padding: theme.layout.screenPadding,
  },
  // Small caps, the same register SectionLabel and MediaModeSwitch use for a
  // label that names the block under it. `section` above it and `header`
  // below, which is the pairing sharedStyles.sectionHeaderRow uses on every
  // other screen: the header groups downward with what it labels.
  sectionLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    letterSpacing: theme.editorial.trackLabel,
    color: c.textMuted,
    marginTop: theme.space.section,
    marginBottom: theme.space.header,
  },
  card: {
    backgroundColor: c.surface,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    // 14 rather than a scale step, and this one IS justified: with the 28pt
    // icon disc it lands the row exactly on the 48pt tap target the rest of
    // the app uses (layout.tabTapTarget). A token would land on 44 or 52.
    paddingVertical: 14,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: c.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.bodyLg,
    color: c.textPrimary,
  },
  rowValue: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.bodyLg,
    color: c.textSecondary,
  },
  // Inset to the label, not full-bleed: a divider that starts under the icon
  // groups the rows instead of slicing the card in half.
  divider: {
    height: theme.layout.cardBorderWidth,
    backgroundColor: c.border,
    marginLeft: theme.spacing.lg + 28 + theme.spacing.md,
  },
  // The row that holds the three appearance options. Its padding is the
  // CARD's inset, so it matches the 16pt the rows in every other card on this
  // screen use, rather than the 12 it had - which is what made the control
  // look wedged into its card.
  segment: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  // WHY THIS LOOKED CRAMPED, specifically. It had no height and no horizontal
  // padding at all: the height fell out of `paddingVertical: 12` plus a line
  // of 13pt text, landing at ~40pt (under the 44 floor), and with zero side
  // padding the icon sat hard against the left edge of its own box while the
  // label ran to the right one. Three items in a flex row then squeezed
  // "System" hardest, so the control read as progressively tighter left to
  // right.
  //
  // Now an explicit `md` control with its paired side padding, so the icon and
  // label have the same air on both sides and all three items are the same
  // comfortable height.
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // An icon sitting next to its own label, which is what `control.gap.md` is.
    gap: theme.control.gap.md,
    height: theme.control.height.md,
    paddingHorizontal: theme.control.padX.sm,
    borderRadius: theme.radius.sm,
    borderWidth: theme.layout.cardBorderWidth,
    borderColor: c.border,
    backgroundColor: c.surfaceSunken,
  },
  // Filled, not merely tinted: selection here has to survive at a glance and
  // in greyscale, and the icon swaps colour with it so it is never carried by
  // hue alone.
  // fillStrong, NOT the accent. Two reasons: the accent version was a
  // regression I introduced in the dark-mode pass (this control was navy
  // before, so light mode had quietly changed), and a segmented control is a
  // three-wide row where a saturated fill reads as a pink block rather than as
  // a selection.
  segmentItemActive: {
    backgroundColor: c.fillStrong,
    borderColor: c.fillStrong,
  },
  segmentText: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: c.textSecondary,
  },
  segmentTextActive: {
    color: c.onFillStrong,
  },
  // A note belongs to the card above it, so its horizontal padding matches the
  // card's rows and its top gap is the label-to-thing step. The bottom is the
  // card's own internal padding, not a layout gap, hence `spacing`.
  note: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    lineHeight: theme.fontSize.caption * 1.5,
    color: c.textSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.space.tight,
    paddingBottom: theme.spacing.lg,
  },
  versionBlock: {
    alignItems: 'center',
    marginTop: theme.space.major,
    gap: theme.space.micro,
  },
  versionText: {
    fontFamily: theme.fontFamily.displaySemibold,
    fontSize: theme.fontSize.body,
    color: c.textSecondary,
  },
  versionMeta: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.textMuted,
  },
}));

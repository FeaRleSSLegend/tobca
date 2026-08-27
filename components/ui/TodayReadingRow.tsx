import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
import { compactReference, estimateReadingMinutes } from '../../utils/referenceParser';
import { PressableScale } from './motion';

interface TodayReadingRowProps {
  day: number;
  references: string[];
  isDone: boolean;
  // Overall plan completion 0..1, drawn as a progress ring around the day
  // number — progress indication and identity in one element.
  planProgress?: number;
  onPress: () => void;
}

// Home's Bible-reading card, redesigned to be one of the page's strongest
// visual elements without shouting. Inspired by the editorial product-card
// reference (image left, strong title, secondary line, compact action right)
// but adapted to this app and kept more compact:
//
//   - EDITORIAL TYPE: the passage is set in the app's serif (Lora, the same
//     face used inside the Bible reader) at a generous size — so the card
//     previews the reading experience it leads to, and the serif brings the
//     warmth the old sans-serif utility row lacked.
//   - PROGRESS RING: the day number sits in a thin ring that fills with
//     overall plan progress; on completion it becomes a solid warm check.
//   - WARMTH THROUGH COLOR, NOT DECORATION: a single soft cream wash, one
//     pink accent, success green reserved for the done state. No gradients,
//     keel, or badges — the refinement is in type and space.
//   - COMPLETION STATE: the card settles to a calm done treatment so
//     finishing feels acknowledged and warm rather than merely toggled.
export const TodayReadingRow = ({ day, references, isDone, planProgress = 0, onPress }: TodayReadingRowProps) => {
  const styles = useStyles();
  const c = useThemeColors();
  const passages = references.map(compactReference).join('  ·  ');
  const minutes = estimateReadingMinutes(references);

  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.985}
      style={[styles.card, isDone && styles.cardDone]}
      accessibilityRole="button"
      accessibilityLabel={
        isDone
          ? `Today's reading, day ${day}, completed`
          : `Today's reading, day ${day}, about ${minutes} minutes: ${passages}`
      }
    >
      <DayDial day={day} progress={planProgress} isDone={isDone} />

      <View style={styles.body}>
        <Text style={styles.eyebrow}>{isDone ? 'TODAY · COMPLETE' : "TODAY'S READING"}</Text>

        <Text style={[styles.passages, isDone && styles.passagesDone]} numberOfLines={2}>
          {passages}
        </Text>

        <View style={styles.bottomLine}>
          {isDone ? (
            <Text style={styles.doneNote}>Well done. See you tomorrow.</Text>
          ) : (
            <>
              <Ionicons name="time-outline" size={13} color={c.graySecondary} />
              <Text style={styles.timeText}>about {minutes} min</Text>
              <View style={styles.dot} />
              <Text style={styles.readCta}>Read now</Text>
              <Ionicons name="arrow-forward" size={13} color={c.pink} />
            </>
          )}
        </View>
      </View>
    </PressableScale>
  );
};

// Day number inside a progress ring (two stacked SVG circles: faint track +
// foreground arc sized to plan progress). Done state becomes a filled check.
function DayDial({ day, progress, isDone }: { day: number; progress: number; isDone: boolean }) {
  const styles = useStyles();
  const c = useThemeColors();
  const size = 52;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = circumference * clamped;

  if (isDone) {
    return (
      <View style={[styles.dial, styles.dialDone]}>
        <Ionicons name="checkmark" size={24} color={c.white} />
      </View>
    );
  }

  return (
    <View style={styles.dial}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.grayBorder} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.pink}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.dialInner}>
        <Text style={styles.dayLabel}>DAY</Text>
        <Text style={styles.dayNum}>{day}</Text>
      </View>
    </View>
  );
}

const useStyles = makeThemedStyles((c) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: '#FBF7F0',
    borderColor: '#F0E9DD',
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    // Section step, matching the verse card above it — see the note there.
    marginTop: theme.space.section,
  },
  cardDone: {
    backgroundColor: '#F1F9F5',
    borderColor: '#DCEEE4',
  },
  dial: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialDone: {
    borderRadius: theme.radius.full,
    backgroundColor: c.success,
  },
  dialInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 8,
    letterSpacing: 1,
    color: c.grayIcon,
    marginBottom: -2,
  },
  dayNum: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.bodyLg,
    color: c.navy,
    lineHeight: 22,
  },
  body: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: c.pink,
    marginBottom: theme.space.micro,
  },
  passages: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 18,
    lineHeight: 24,
    color: c.navy,
  },
  passagesDone: {
    color: c.graySecondary,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.micro,
    marginTop: 8,
  },
  timeText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: c.graySecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: c.grayIcon,
    marginHorizontal: theme.space.micro,
  },
  readCta: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: c.pink,
  },
  doneNote: {
    fontFamily: theme.fontFamily.serifItalic,
    fontSize: theme.fontSize.body,
    color: c.success,
  },
}));

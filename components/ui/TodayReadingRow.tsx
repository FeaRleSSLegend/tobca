import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
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
              <Ionicons name="time-outline" size={13} color={theme.colors.graySecondary} />
              <Text style={styles.timeText}>about {minutes} min</Text>
              <View style={styles.dot} />
              <Text style={styles.readCta}>Read now</Text>
              <Ionicons name="arrow-forward" size={13} color={theme.colors.pink} />
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
  const size = 52;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = circumference * clamped;

  if (isDone) {
    return (
      <View style={[styles.dial, styles.dialDone]}>
        <Ionicons name="checkmark" size={24} color={theme.colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.dial}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.grayBorder} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.colors.pink}
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: '#FBF7F0',
    borderColor: '#F0E9DD',
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
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
    backgroundColor: theme.colors.success,
  },
  dialInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 8,
    letterSpacing: 1,
    color: theme.colors.grayIcon,
    marginBottom: -2,
  },
  dayNum: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.navy,
    lineHeight: 22,
  },
  body: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: theme.colors.pink,
    marginBottom: 5,
  },
  passages: {
    fontFamily: theme.fontFamily.serifSemibold,
    fontSize: 18,
    lineHeight: 24,
    color: theme.colors.navy,
  },
  passagesDone: {
    color: theme.colors.graySecondary,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  timeText: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.grayIcon,
    marginHorizontal: 3,
  },
  readCta: {
    fontFamily: theme.fontFamily.bodyBold,
    fontSize: theme.fontSize.caption,
    color: theme.colors.pink,
  },
  doneNote: {
    fontFamily: theme.fontFamily.serifItalic,
    fontSize: theme.fontSize.body,
    color: theme.colors.success,
  },
});

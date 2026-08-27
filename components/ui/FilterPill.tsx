// components/ui/FilterPill.tsx
// The app's one filter chip: branch pills (All / Kubwa / Wuse 2) and the
// per-collection pills on see-all both render through this.
//
// THE RESTYLE, AND WHAT IT CHANGED
// The old recipe was a bordered white pill that turned NAVY when active. Two
// problems with that, both about contrast in the wrong place:
//
//   - the inactive pill carried a 1pt border and a white fill, i.e. exactly
//     the recipe every CARD on these screens uses. A row of small cards above
//     a column of large cards is a lot of edges for a control that should read
//     as one lightweight row.
//   - active was navy — the app's TEXT colour. Selection is an accent job,
//     and pink is the accent everywhere else it matters (the media-mode
//     marker, the tab bar's active indicator, play affordances).
//
// So: inactive is the recessed grey field (grayBorder, the same tone the
// search bar is filled with, so "quiet interactive surface" means one thing
// app-wide) with NO border, and active is a solid pink fill. The shape is
// unchanged — fully rounded, hugging its label.
//
// CONTRAST NOTE, stated rather than buried: white on pink measures 4.04:1,
// which clears WCAG AA for large text but sits just under the 4.5:1 bar for
// text this size. It is the accent the brief asked for and the label is also
// marked selected for assistive tech, so colour is not the only signal — but
// if a strict AA pass is wanted later, navy-on-pinkTint is the swap that
// keeps the same shape and reads as the same control.
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { makeThemedStyles } from '../../hooks/useTheme';
import { PressableScale } from './motion';

interface FilterPillProps {
    isActive: boolean;
    label: string;
    onPress: () => void;
}

export const FilterPill = ({ isActive, label, onPress }: FilterPillProps) => {
  const style = useStyle();
    return (
        <PressableScale
            activeScale={0.94}
            style={[style.pillStyle, isActive ? style.pillActive : style.pillInactive]}
            onPress={onPress}
            // The pill's visible padding only gets it to ~33pt tall — same fix
            // as VerseOfDayCard's shareBtn: extend the tappable area with
            // hitSlop instead of growing the pill itself, so a row of these
            // doesn't get visually heavier just to satisfy touch-target math.
            hitSlop={theme.control.hitSlop.sm}
            accessibilityRole="button"
            // Active state was previously conveyed by color alone (navy fill
            // vs white) — invisible to a screen reader. selected:true is what
            // makes VoiceOver/TalkBack announce "Ongoing, selected" instead
            // of just "Ongoing".
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
        >
            <Text numberOfLines={1} style={[style.label, isActive ? style.labelActive : style.labelInactive]}>
                {label}
            </Text>
        </PressableScale>
    );
};

const useStyle = makeThemedStyles((c) => ({
    pillStyle: {
        borderRadius: theme.radius.full,
        // The `sm` control pair. A pill row is the one place a sub-44pt
        // control is right - a row of 44pt pills is a wall - so the height is
        // 36 and the tap target is restored with control.hitSlop.sm on the
        // pressable itself. Height rather than paddingVertical: the label's
        // line box varies with the OS text-size setting, and a padding-derived
        // height made the pills in one row disagree by a point or two.
        height: theme.control.height.sm,
        paddingHorizontal: theme.control.padX.sm,
        justifyContent: 'center',
        alignItems: 'center',
        // Without this, Pressable inside a horizontal ScrollView stretches
        // to fill the scroll container's full height — turning a pill into
        // the giant rectangle seen in the "All" active state. alignSelf
        // tells it to size to its own content instead.
        alignSelf: 'flex-start',
        // Guards against the row's flex layout squeezing a pill narrower
        // than its label — which is what let "Sunday Service" wrap onto a
        // second line and, with it, drag the whole row's height up.
        flexShrink: 0,
    },
    // No borderWidth on either state, deliberately. A border that appears on
    // one state and not the other changes the pill's outer size by 2pt when
    // it is selected, which makes a row of pills twitch as the selection
    // moves along it.
    // accentFill, not `pink`. A selected pill is a FILL with a label on it,
    // and the mark-weight accent is too luminous to sit under text on a dark
    // ground. Identical in light mode; deeper and calmer in dark.
    pillActive: {
        backgroundColor: c.accentFill,
    },
    // grayBorder, deliberately NOT surfaceSunken: these pills float over the
    // screen background, and surfaceSunken IS the background in light mode, so
    // an unselected pill would vanish. This value works in both appearances -
    // a grey fill on light, a lifted fill on dark.
    pillInactive: {
        backgroundColor: c.grayBorder,
    },
    label: {
        fontSize: theme.fontSize.bodyLg,
    },
    labelActive: {
        // Bolder as well as lighter: weight is a second, non-colour signal
        // that this is the chosen one.
        fontFamily: theme.fontFamily.bodySemibold,
        color: c.white,
    },
    labelInactive: {
        fontFamily: theme.fontFamily.bodyMedium,
        color: c.graySecondary,
    },
}));

export const filterLabels = {
    all: "All",
    sermon: "Sermons",
    bibleStudy: "Bible Studies",
    prayer: "Prayer Requests",
    event: "Events"
};

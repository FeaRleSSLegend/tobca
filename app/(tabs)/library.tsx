import { View, Text, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { useTabBottomClearance } from '../../hooks/useBottomClearance';
import { useAutoHideOnScroll } from '../../hooks/useAutoHideOnScroll';
import { theme } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useTheme';
import { useSharedStyles } from '../../constants/styles/sharedStyles';
import { SearchBar } from '../../components/ui/SearchBar';
import { useLibraryStyles } from '../../constants/styles/library.styles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { CurrentMessage } from '../../components/ui/CurrentMessageCard';
import { HScroll } from '../../components/ui/HScroll';
import { PosterCard } from '../../components/ui/PosterCard';
import { GridCard } from '../../components/ui/GridCard';
import { PlaylistCircle } from '../../components/ui/PlaylistCircle';
import { getCurrentlyStreaming, getRecentlyAdded } from '../../data/content';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { TabTransition, FadeInUp, staggerDelay, Shimmer, PressableScale } from '../../components/ui/motion';
import { useMessages, filterByBranch, BranchFilter as BranchFilterValue } from '../../hooks/useMessages';
import { SkeletonRow } from '../../components/ui/Skeletons';
import { BranchFilter } from '../../components/ui/BranchFilter';
import { MediaModeSwitch } from '../../components/ui/MediaModeSwitch';
import { AudioLibrary } from '../../components/library/AudioLibrary';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { getBranch, isPlaceholderChannel } from '../../data/branches';
import { PastorsRow } from '../../components/ui/PastorsRow';

import { usePlaylists } from '../../hooks/usePlaylists';
import { usePlayback } from '../../providers/PlaybackProvider';
import { classifyMessages } from '../../utils/contentGrouping';

// Hub previews are teasers, not the collection — a filled row signals
// "there's more behind the header" and the dedicated screen (see-all.tsx)
// is where the full set lives. 6 fills the row past one screen-width on
// every current phone, which is all a teaser needs to do.
const PREVIEW_COUNT = 6;

/**
 * The Library's MEDIA MODES. Not navigation and not a filter: a mode decides
 * WHICH library you are in, and everything below the header — hero, shelves,
 * section names, empty state — belongs to the mode rather than being reused
 * across both. Order here is the order they page in.
 *
 * The branch filter (All / Kubwa / Wuse 2) is the level BELOW this one: it
 * narrows whichever library the mode has already chosen. That is the whole
 * hierarchy of this screen, in the order it is rendered:
 *
 *   Library (title) → Search → MODE → branch FILTER → content
 */
type LibraryMode = 'video' | 'audio';
const MODES: LibraryMode[] = ['video', 'audio'];

/**
 * Library is now a DISCOVERY HUB, not a browse-everything surface — the
 * redesign splits its old double job in two:
 *
 *   hub (this screen)  — scannable previews, every section capped,
 *                        every header tappable ("›") into its collection
 *   see-all.tsx        — the actual browsing: scoped search, filter
 *                        pills, grouping, full lists
 *
 * That split is why two whole features left this file: the filter-pill
 * row and the in-place filtered grid both moved to the collection screens
 * where they have room to work (the pills there are per-collection and
 * meaningful — Ongoing/Completed, service types — instead of one global
 * row trying to serve four kinds of content at once). The header search
 * bar stays: it routes to the global /search screen, which is a different
 * job (search everything) than a collection's scoped search.
 */
export default function LibraryScreen() {
    const sharedStyles = useSharedStyles();
    const LibraryStyles = useLibraryStyles();
  const c = useThemeColors();
    const router = useRouter();
  const push = useGuardedPush();
    const { messages: allMessages, isBranchReady, statusByBranch } = useMessages();
    const { playlists } = usePlaylists();
    const { play } = usePlayback();
    const bottomClearance = useTabBottomClearance();
    const { width: windowWidth } = useWindowDimensions();
    const pageWidth = windowWidth - theme.layout.screenPadding * 2;

    // ONE AUTO-HIDE STATE PER PAGE, not one shared between them.
    //
    // The filter bar is shared furniture, but "should the bar be hidden right
    // now" is a fact about the page you are LOOKING AT. With a single shared
    // instance, scrolling Video down would leave the bar hidden after swiping
    // to Audio — even with Audio sitting at offset 0, where the bar must
    // always be shown. Each page tracks its own scroll; the visible bar simply
    // reads whichever page is active.
    const videoScroll = useAutoHideOnScroll();
    const audioScroll = useAutoHideOnScroll();

    const [mode, setMode] = useState<LibraryMode>('video');
    const pagerRef = useRef<FlatList<LibraryMode>>(null);

    const filterVisible = mode === 'video' ? videoScroll.visible : audioScroll.visible;

    // THE BRANCH FILTER'S REAL HEIGHT, reported by the row itself once it has
    // laid out. It floats over the video page rather than sitting above it
    // (see the long note in BranchFilter.tsx — collapsing its height mid-scroll
    // is what caused the Video tab's scroll glitch), so the space it occupies
    // has to be reserved here instead, as CONSTANT padding that does not change
    // when the bar hides. Constant is the entire point: reserved space that
    // never changes cannot fight the scroll position.
    //
    // Starts at 0 and only ever grows, matching what the row reports. On the
    // very first frame the page is therefore 0pt short at the top for exactly
    // as long as it takes the row to measure, which is before paint.
    const [filterHeight, setFilterHeight] = useState(0);

    // Tapping a mode scrolls the pager to it. The pager is TAP-DRIVEN ONLY —
    // its own swipe is disabled (see scrollEnabled below) — so this is the one
    // and only way the mode changes. The animated scroll IS the transition:
    // the new library slides in while the old one leaves, which is why nothing
    // here cross-fades or remounts. A mode change should read as moving
    // between two places that both already exist, not as the screen being
    // rebuilt.
    const goToMode = useCallback((next: LibraryMode) => {
        const index = MODES.indexOf(next);
        if (index < 0) return;
        setMode(next);
        pagerRef.current?.scrollToIndex({ index, animated: true });
    }, []);

    // Defaults to 'all' so the screen looks exactly as it did before a second
    // branch existed: Wuse 2 currently contributes nothing, so 'all' is
    // Ikeja's content unchanged.
    const [branch, setBranch] = useState<BranchFilterValue>('all');
    const messages = useMemo(() => filterByBranch(allMessages, branch), [allMessages, branch]);

    // ONE gate for the whole page. Every church-content section below flips
    // together on this, so the screen never shows real Series next to skeleton
    // Services — the mixed state the brief rules out. It is scoped to the
    // SELECTED branch, so Wuse 2's placeholder channel can never hold Kubwa's
    // content behind skeletons.
    const ready = isBranchReady(branch);

    const currentlyStreaming = getCurrentlyStreaming(messages);

    // NOTE: the Audio mode no longer derives from `messages` at all. It reads
    // the church's R2 audio manifest directly (see components/library/
    // AudioLibrary.tsx), because that is where audio actually lives —
    // getAudioMessages() covers audio-only YouTube/Telegram messages, of which
    // there are still none.

    // Classification is just grouping over an array already in memory —
    // cheap enough to recompute via useMemo, no need to cache separately.
    const { recurringServices, series, clips } = useMemo(() => classifyMessages(messages), [messages]);

    const clipIds = useMemo(() => new Set(clips.map((c) => c.id)), [clips]);
    const recentlyAdded = useMemo(
        () => getRecentlyAdded(messages, messages.length).filter((m) => !clipIds.has(m.id)),
        [messages, clipIds]
    );

    const openCollection = (section: string, title: string) =>
        push({ pathname: '/see-all', params: { section, title } });
    // Tapping a poster skips the collection screen and goes straight into
    // that one group's contents — the poster IS the choice, so routing
    // through the full Series list first would just add a hop.
    const openGroup = (label: string) =>
        push({ pathname: '/see-all', params: { filter: label, title: label } });

    return (
        <TabTransition>
        <ScreenWithWatermark style={sharedStyles.container}>
            {/* Title + settings gear. The gear used to be declared here and
                only here, which made it a Library feature rather than an app
                one — see components/ui/ScreenHeader. */}
            <ScreenHeader title="Library" />

            <SearchBar />

            {/* MEDIA MODE. Above the branch pills because it is the coarser
                choice: it decides WHICH library you are in, the pills below
                then narrow it. Deliberately quieter than the pills too — it is
                set once and left alone, while the pills are operated. Both
                stay put while you page — see the note on the pager. */}
            <View style={LibraryStyles.modeRow}>
                <MediaModeSwitch<LibraryMode>
                    modes={[
                        { value: 'video', label: 'Video', icon: 'play' },
                        { value: 'audio', label: 'Audio', icon: 'headset' },
                    ]}
                    value={mode}
                    onChange={goToMode}
                    accessibilityLabel="Library media mode"
                />
            </View>

            {/* THE PAGER, plus the branch filter FLOATING OVER IT.
                The stack exists so the filter row can be an overlay: it is
                positioned absolutely at the top of this box (LibraryStyles.
                filterOverlay), and the video page reserves its height as fixed
                contentContainer padding. See BranchFilter.tsx for why — in
                short, the row used to collapse its own height in normal flow,
                which resized the scroll viewport mid-gesture and made the Video
                tab jump and oscillate while scrolling. */}
            <View style={{ flex: 1 }}>

            {/* THE PAGER.
                A plain horizontal FlatList — deliberately not a new dependency.
                The project has no react-native-pager-view and no reanimated
                (Expo Go compatibility is a hard constraint here), and two pages
                do not justify adding either. windowSize/initialNumToRender are
                pinned so BOTH pages stay mounted: unmounting the inactive page
                would throw away its scroll position every time you switch,
                which is exactly the thing that makes a paged UI feel cheap.

                SWIPE IS OFF (scrollEnabled={false}). The mode is changed by the
                MediaModeSwitch and by nothing else — see the note there. What
                remains is a programmatically-scrolled container: scrollToIndex
                still animates with scrolling disabled, so the tap still reads
                as travelling between two places rather than a hard cut, and
                both pages still stay mounted.

                Page width is the CONTENT width, not the window width — this
                list sits inside sharedStyles.container, which already applies
                the screen's horizontal padding. Using the full window width
                here would push each page half a gutter off-centre. */}
            <FlatList
                ref={pagerRef}
                style={{ flex: 1 }}
                data={MODES}
                keyExtractor={(p) => p}
                horizontal
                pagingEnabled
                // NO SWIPE BETWEEN MODES. Two reasons it is gone rather than
                // kept as a second way in:
                //   - it was undiscoverable, and a gesture nobody knows about
                //     is only ever triggered by accident;
                //   - every shelf on both pages is itself a horizontal
                //     scroller, so the pager was permanently arbitrating for
                //     the same axis as its own children. With it disabled the
                //     shelves are the only horizontal scrollers on the screen
                //     and cannot lose a pan to an ancestor.
                // The shelves keep their own scrolling entirely: this flag is
                // scoped to THIS list and does not inherit.
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                initialNumToRender={MODES.length}
                windowSize={MODES.length}
                removeClippedSubviews={false}
                getItemLayout={(_, index) => ({
                    length: pageWidth,
                    offset: pageWidth * index,
                    index,
                })}
                // height:'100%' on the page wrapper so a page's child can
                // resolve flex:1 against the pager's real height — without it
                // the Audio page's empty state has no height to centre within.
                renderItem={({ item }) => (
                    <View style={{ width: pageWidth, height: '100%' }}>
                        {item === 'video' ? (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                onScroll={videoScroll.onScroll}
                                scrollEventThrottle={16}
                                // paddingTop is the space the floating filter
                                // sits in. FIXED, whether the bar is showing or
                                // hidden: content passes under a hidden bar
                                // rather than the page re-laying itself out,
                                // which is the whole fix.
                                contentContainerStyle={{
                                    paddingTop: filterHeight,
                                    paddingBottom: bottomClearance,
                                }}
                            >
                    {/* A branch with no content is a fact worth stating. Without
                        this the screen would just render as a blank scroll and
                        read as broken rather than as "nothing here yet". */}
                    {/* Two DIFFERENT empty states, because they are two different
                        facts and the old single message told a lie about one of
                        them. A branch whose channel id is still a placeholder is
                        NOT "a channel that hasn't published yet" — it is a branch
                        the app has not been pointed at. Saying "messages will
                        appear once this channel starts publishing" about Wuse 2
                        implied we were watching an empty channel, when in truth we
                        were watching nothing at all. */}
                    {ready && messages.length === 0 && (
                        branch !== 'all' && isPlaceholderChannel(getBranch(branch)?.channelId ?? '') ? (
                            <EmptyState
                                icon="link-outline"
                                title={`${getBranch(branch)?.shortName ?? 'This branch'} isn't connected yet`}
                                subtitle="This branch's YouTube channel hasn't been linked to the app. Once it is, its messages appear here."
                            />
                        ) : (
                            <EmptyState
                                icon="tv-outline"
                                title={`Nothing from ${branch === 'all' ? 'any branch' : getBranch(branch)?.shortName ?? 'this branch'} yet`}
                                subtitle="Messages will appear here once this channel starts publishing."
                            />
                        )
                    )}

                    {/* SKELETON PHASE — the whole church-content block at once.
                        Shapes mirror the real layout (hero card, then poster rows)
                        so nothing jumps position when the swap happens. */}
                    {!ready && (
                        <>
                            <View style={LibraryStyles.heroSkeleton}>
                                <Shimmer style={{ flex: 1, borderRadius: theme.radius.md }} width={340} />
                            </View>
                            <SkeletonRow cards={3} />
                            <SkeletonRow cards={3} />
                        </>
                    )}

                    {/* No SectionLabel here on purpose — this is Library's hero
                        card, same role as LiveCard/VerseOfDayCard on Home, and
                        neither of those get an outer label either. */}
                    {ready && currentlyStreaming && <CurrentMessage message={currentlyStreaming} onPress={() => play(currentlyStreaming)} />}

                    {ready && series.length > 0 && (
                        <>
                            <SectionLabel label="Series" onPress={() => openCollection('series', 'Series')} />
                            <HScroll>
                                {series.slice(0, PREVIEW_COUNT).map((s, i) => (
                                    <FadeInUp key={s.key} delay={staggerDelay(i)}>
                                        <PosterCard
                                            title={s.label}
                                            subtitle={`${s.count} messages`}
                                            thumbnail={s.thumbnail}
                                            onPress={() => openGroup(s.label)}
                                        />
                                    </FadeInUp>
                                ))}
                            </HScroll>
                        </>
                    )}

                    {ready && recurringServices.length > 0 && (
                        <>
                            <SectionLabel label="Services" onPress={() => openCollection('services', 'Services')} />
                            <HScroll>
                                {recurringServices.slice(0, PREVIEW_COUNT).map((s, i) => (
                                    <FadeInUp key={s.key} delay={staggerDelay(i)}>
                                        <PosterCard
                                            title={s.label}
                                            subtitle={`${s.count} messages`}
                                            thumbnail={s.thumbnail}
                                            onPress={() => openGroup(s.label)}
                                        />
                                    </FadeInUp>
                                ))}
                            </HScroll>
                        </>
                    )}

                    {playlists.length > 0 && (
                        <>
                            <SectionLabel label="Playlists" onPress={() => openCollection('playlists', 'Playlists')} />
                            <HScroll>
                                {playlists.slice(0, PREVIEW_COUNT).map((p, i) => (
                                    <FadeInUp key={p.id} delay={staggerDelay(i)}>
                                        <PlaylistCircle
                                            title={p.title}
                                            count={p.itemCount}
                                            thumbnail={p.thumbnail}
                                            onPress={() => push({ pathname: '/playlist/[id]', params: { id: p.id, title: p.title } })}
                                        />
                                    </FadeInUp>
                                ))}
                            </HScroll>
                        </>
                    )}

                    {/* OUR PASTORS — the circular entry point.

                        WHAT WAS HERE: a shelf headed "Pastor Yinka's
                        Teachings", rendered with the same SectionLabel +
                        16:9 PosterCard language as Series, Services and
                        Recently Added, whose chevron pushed
                        /see-all?channel=yinka. Two things were wrong with it.

                        One, see-all does not read a `channel` param — it
                        handles section/filter/title only — so that push fell
                        through to the recently-added branch and showed the
                        CHURCH's uploads under her name. Her shelf's "see all"
                        led to general OliveBrook content.

                        Two, rendering a person as a fourth identical shelf
                        makes her a content category. She is now a face you
                        tap, and her messages live on her own page
                        (app/pastor/[id].tsx) over her own feed. See
                        components/ui/PastorsRow for why the circle is the
                        whole argument. */}
                    <PastorsRow />

                    {ready && recentlyAdded.length > 0 && (
                        <>
                            <SectionLabel label="Recently Added" onPress={() => openCollection('recentlyAdded', 'Recently Added')} />
                            {/* Horizontal like every other hub row — the old 2-col
                                grid here was the one section browsing in place,
                                which made the hub feel bottomless. Fixed-width
                                wrapper because GridCard sizes itself flex-first
                                for grid rows; inside an HScroll it needs an
                                explicit width instead. */}
                            <HScroll>
                                {recentlyAdded.slice(0, PREVIEW_COUNT).map((msg) => (
                                    <View key={msg.id} style={LibraryStyles.hScrollCard}>
                                        <GridCard
                                            title={msg.title}
                                            duration={msg.duration}
                                            speaker={msg.speaker}
                                            type={msg.type}
                                            thumbnail={msg.thumbnail}
                                            onPress={() => play(msg)}
                                        />
                                    </View>
                                ))}
                            </HScroll>
                        </>
                    )}
                    {/* No manual spacer here. There used to be a 32pt View sitting
                        directly above the "Connect" SectionLabel, which already
                        contributes its own 24pt section gap — 56pt total, and the
                        reason this row looked detached from the page. Sections
                        space themselves; nothing should hand-tune a gap on top. */}
                    {/* CHURCH SOCIALS — the only row here that leaves the app,
                        so it sits last. Putting a link-out above in-app content
                        would invite people out of the app before they had seen
                        what is in it. */}
                    <SectionLabel label="Connect" />
                    <PressableScale
                        style={LibraryStyles.socialsRow}
                        onPress={() => push('/socials')}
                        accessibilityRole="button"
                        accessibilityLabel="Church socials, follow us on Instagram and YouTube"
                    >
                        <LinearGradient
                            colors={theme.gradient.colors}
                            start={theme.gradient.start}
                            end={theme.gradient.end}
                            style={LibraryStyles.socialsBadge}
                        >
                            <Ionicons name="logo-instagram" size={20} color={c.white} />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={LibraryStyles.socialsTitle}>Church Socials</Text>
                            <Text style={LibraryStyles.socialsMeta}>Instagram and YouTube</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={c.grayIcon} />
                    </PressableScale>

                            </ScrollView>
                        ) : (
                            <AudioLibrary
                                onScroll={audioScroll.onScroll}
                                bottomClearance={bottomClearance}
                            />
                        )}
                    </View>
                )}
            />

            {/* VIDEO ONLY, and that is a data fact rather than a design
                preference: the R2 audio manifest carries no branch field, so
                on the Audio mode these pills would have nothing to filter by.
                Leaving them visible would mean tapping "Wuse 2" emptied a list
                that has no branch information at all — a control that lies
                about what it did. They come back the moment audio items carry
                a branch.

                Auto-hides while scrolling down, returns on scroll up — the
                same rule as the Bible reader's quick-nav, shared via
                useAutoHideOnScroll rather than reimplemented.

                RENDERED AFTER THE PAGER, not before it. It is absolutely
                positioned, and later siblings paint on top — the same reason
                LogoWatermark is written first in ScreenWithWatermark. No
                zIndex needed, and none wanted: negative/positive zIndex on
                Android has already bitten this codebase once. */}
            {mode === 'video' && (
                <BranchFilter
                    value={branch}
                    onChange={setBranch}
                    visible={filterVisible}
                    style={LibraryStyles.filterOverlay}
                    onMeasure={setFilterHeight}
                />
            )}

            </View>
        </ScreenWithWatermark>
        </TabTransition>
    );
}

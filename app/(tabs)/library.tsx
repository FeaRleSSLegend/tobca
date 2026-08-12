import { View, Text, ScrollView } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { SearchBar } from '../../components/ui/SearchBar';
import { LibraryStyles } from '../../constants/styles/library.styles';
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
import { EmptyState } from '../../components/ui/EmptyState';
import { getBranch, isPlaceholderChannel } from '../../data/branches';
import { featuredChannels } from '../../data/channels';
import { useFeaturedChannel } from '../../hooks/useFeaturedChannel';

import { usePlaylists } from '../../hooks/usePlaylists';
import { usePlayback } from '../../providers/PlaybackProvider';
import { classifyMessages } from '../../utils/contentGrouping';

// Hub previews are teasers, not the collection — a filled row signals
// "there's more behind the header" and the dedicated screen (see-all.tsx)
// is where the full set lives. 6 fills the row past one screen-width on
// every current phone, which is all a teaser needs to do.
const PREVIEW_COUNT = 6;

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
    const router = useRouter();
  const push = useGuardedPush();
    const { messages: allMessages, isBranchReady, statusByBranch } = useMessages();
    const { playlists } = usePlaylists();
    const { play } = usePlayback();

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

    // Classification is just grouping over an array already in memory —
    // cheap enough to recompute via useMemo, no need to cache separately.
    const { recurringServices, series, clips } = useMemo(() => classifyMessages(messages), [messages]);

    const clipIds = useMemo(() => new Set(clips.map((c) => c.id)), [clips]);
    const recentlyAdded = useMemo(
        () => getRecentlyAdded(messages, messages.length).filter((m) => !clipIds.has(m.id)),
        [messages, clipIds]
    );

    // Pastor Yinka's channel — fetched separately from useMessages on purpose,
    // so her episodes never enter sermon classification or the branch filter.
    const yinka = featuredChannels[0];
    const yinkaFeed = useFeaturedChannel('yinka');

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
            <View style={sharedStyles.headerRow}>
                <Text style={sharedStyles.screenTitle}>Library</Text>
                <View style={sharedStyles.avatar}>
                    <Text style={{ fontSize: theme.fontSize.body, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
                        JN
                    </Text>
                </View>
            </View>

            <SearchBar />

            <BranchFilter value={branch} onChange={setBranch} />

            <ScrollView showsVerticalScrollIndicator={false}>
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

                {/* PASTOR YINKA'S VIDEOS — kept in-app, restyled.
                    The framed "channel card" that used to live here became the
                    Socials link-out, but her VIDEOS are church-app content and
                    must not leave with it. They now use the same
                    SectionLabel + poster-row language as Series and Services,
                    which is a better fit than the bespoke card was: it is one
                    more shelf of things to watch, and giving it a unique frame
                    made it read as an advert rather than a section. The
                    chevron goes to her full list, same as every other shelf. */}
                {yinkaFeed.episodes.length > 0 && (
                    <>
                        <SectionLabel
                            label="Pastor Yinka's Teachings"
                            onPress={() => push({ pathname: '/see-all', params: { channel: 'yinka', title: 'Pastor Yinka Jibril' } })}
                        />
                        <HScroll>
                            {yinkaFeed.episodes.slice(0, PREVIEW_COUNT).map((m, i) => (
                                <FadeInUp key={m.id} delay={staggerDelay(i)}>
                                    <PosterCard
                                        title={m.title}
                                        subtitle={m.duration}
                                        thumbnail={m.thumbnail}
                                        onPress={() => play(m)}
                                    />
                                </FadeInUp>
                            ))}
                        </HScroll>
                    </>
                )}

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
                <View style={{ height: theme.spacing.xxxl }} />
                {/* CHURCH SOCIALS — the only row here that leaves the app,
                    so it sits last. Putting a link-out above in-app content
                    would invite people out of the app before they had seen
                    what is in it. */}
                <SectionLabel label="Connect" />
                <PressableScale
                    style={LibraryStyles.socialsRow}
                    onPress={() => push('/socials')}
                    accessibilityRole="button"
                    accessibilityLabel="Church socials, follow us on Instagram"
                >
                    <LinearGradient
                        colors={theme.gradient.colors}
                        start={theme.gradient.start}
                        end={theme.gradient.end}
                        style={LibraryStyles.socialsBadge}
                    >
                        <Ionicons name="logo-instagram" size={20} color={theme.colors.white} />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={LibraryStyles.socialsTitle}>Church Socials</Text>
                        <Text style={LibraryStyles.socialsMeta}>Follow us on Instagram</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.grayIcon} />
                </PressableScale>

            </ScrollView>
        </ScreenWithWatermark>
        </TabTransition>
    );
}

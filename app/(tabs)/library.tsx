import { View, Text, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
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
import { TabTransition, FadeInUp, staggerDelay } from '../../components/ui/motion';
import { useMessages } from '../../hooks/useMessages';
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
    const { messages } = useMessages();
    const { playlists } = usePlaylists();
    const { play } = usePlayback();
    const currentlyStreaming = getCurrentlyStreaming(messages);

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
            <View style={sharedStyles.headerRow}>
                <Text style={{ fontSize: theme.fontSize.heroTitle, fontFamily: theme.fontFamily.display }}>
                    Library
                </Text>
                <View style={sharedStyles.avatar}>
                    <Text style={{ fontSize: theme.fontSize.body, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
                        JN
                    </Text>
                </View>
            </View>

            <SearchBar />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* No SectionLabel here on purpose — this is Library's hero
                    card, same role as LiveCard/VerseOfDayCard on Home, and
                    neither of those get an outer label either. */}
                {currentlyStreaming && <CurrentMessage message={currentlyStreaming} onPress={() => play(currentlyStreaming)} />}

                {series.length > 0 && (
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

                {recurringServices.length > 0 && (
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

                {recentlyAdded.length > 0 && (
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
            </ScrollView>
        </ScreenWithWatermark>
        </TabTransition>
    );
}

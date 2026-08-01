import { View, Text, ScrollView } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPill } from '../../components/ui/FilterPill';
import { LibraryStyles } from '../../constants/styles/library.styles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { CurrentMessage } from '../../components/ui/CurrentMessageCard';
import { HScroll } from '../../components/ui/HScroll';
import { PosterCard } from '../../components/ui/PosterCard';
import { GridCard } from '../../components/ui/GridCard';
import { PlaylistCircle } from '../../components/ui/PlaylistCircle';
import { CardGrid } from '../../components/ui/CardGrid';
import { getCurrentlyStreaming, getRecentlyAdded } from '../../data/content';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { useMessages } from '../../hooks/useMessages';
import { usePlaylists } from '../../hooks/usePlaylists';
import { classifyMessages } from '../../utils/contentGrouping';

const MAX_FILTER_PILLS = 6; // "All" + up to 5 real categories — enough to be useful without needing 2 rows

export default function LibraryScreen() {
    const [activeFilter, setActiveFilter] = useState('All');
    const router = useRouter();
    const { messages } = useMessages();
    const { playlists } = usePlaylists();
    const currentlyStreaming = getCurrentlyStreaming(messages);

    // Classification is just grouping over an array already in memory —
    // cheap enough to recompute via useMemo, no need to cache separately.
    const { recurringServices, series, clips } = useMemo(() => classifyMessages(messages), [messages]);

    const clipIds = useMemo(() => new Set(clips.map((c) => c.id)), [clips]);
    const recentlyAdded = useMemo(
        () => getRecentlyAdded(messages, messages.length).filter((m) => !clipIds.has(m.id)),
        [messages, clipIds]
    );

    // Pills are generated from what was actually found and de-duplicated
    // by label — recurringServices/series are already unique-by-label
    // after classifyMessages' own merge pass, but this guards against a
    // recurring-service and a series ever landing on the same label too.
    const filters = useMemo(() => {
        const labels = ['All'];
        const seen = new Set(labels);
        for (const g of recurringServices) {
            if (labels.length >= MAX_FILTER_PILLS || seen.has(g.label)) continue;
            seen.add(g.label);
            labels.push(g.label);
        }
        for (const g of series) {
            if (labels.length >= MAX_FILTER_PILLS || seen.has(g.label)) continue;
            seen.add(g.label);
            labels.push(g.label);
        }
        if (clips.length > 0 && labels.length < MAX_FILTER_PILLS && !seen.has('Clips')) labels.push('Clips');
        return labels;
    }, [recurringServices, series, clips]);

    // Selecting a pill other than "All" replaces the whole browse layout
    // with a focused grid of just that category — rather than bolting
    // another section onto the bottom of the same screen, which is what
    // made it look like a mystery "Sunday Service" section had appeared
    // out of nowhere.
    const activeGroupItems = useMemo(() => {
        if (activeFilter === 'All') return null;
        if (activeFilter === 'Clips') return clips;
        const match = [...recurringServices, ...series].find((g) => g.label === activeFilter);
        return match ? match.items : [];
    }, [activeFilter, clips, recurringServices, series]);

    return (
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

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={LibraryStyles.filterView}
                contentContainerStyle={LibraryStyles.filterRow}
            >
                {filters.map((f) => (
                    <FilterPill
                        key={f}
                        label={f}
                        isActive={activeFilter === f}
                        onPress={() => setActiveFilter(f)}
                    />
                ))}
            </ScrollView>

            {activeGroupItems === null ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* No SectionLabel here on purpose — this is Library's hero
                        card, same role as LiveCard/VerseOfDayCard on Home, and
                        neither of those get an outer label either. */}
                    {currentlyStreaming && <CurrentMessage message={currentlyStreaming} />}

                    {series.length > 0 && (
                        <>
                            <SectionLabel label="Series" />
                            <HScroll>
                                {series.map((s) => (
                                    <PosterCard
                                        key={s.key}
                                        title={s.label}
                                        subtitle={`${s.count} messages`}
                                        thumbnail={s.thumbnail}
                                        onPress={() => setActiveFilter(s.label)}
                                    />
                                ))}
                            </HScroll>
                        </>
                    )}

                    {recurringServices.length > 0 && (
                        <>
                            <SectionLabel label="Services" />
                            <HScroll>
                                {recurringServices.map((s) => (
                                    <PosterCard
                                        key={s.key}
                                        title={s.label}
                                        subtitle={`${s.count} messages`}
                                        thumbnail={s.thumbnail}
                                        onPress={() => setActiveFilter(s.label)}
                                    />
                                ))}
                            </HScroll>
                        </>
                    )}

                    {playlists.length > 0 && (
                        <>
                            <SectionLabel label="Playlists" />
                            <HScroll>
                                {playlists.map((p) => (
                                    <PlaylistCircle
                                        key={p.id}
                                        title={p.title}
                                        count={p.itemCount}
                                        thumbnail={p.thumbnail}
                                        onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: p.id, title: p.title } })}
                                    />
                                ))}
                            </HScroll>
                        </>
                    )}

                    <SectionLabel label="Recently Added" actionText="See All" onActionPress={() => {
                        router.push({ pathname: '/see-all', params: { section: 'recentlyAdded', title: 'Recently Added' } });
                    }} />
                    <View style={LibraryStyles.gridContainer}>
                        {recentlyAdded.slice(0, 6).map((msg) => (
                            <View key={msg.id} style={LibraryStyles.gridItem}>
                                <GridCard
                                    title={msg.title}
                                    duration={msg.duration}
                                    speaker={msg.speaker}
                                    type={msg.type}
                                    thumbnail={msg.thumbnail}
                                />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                // Focused single-category view. Tapping a pill again (or
                // "All") switches back — the pills row above stays visible
                // the whole time so that's always one tap away, no back
                // button needed for something this shallow.
                <View style={{ flex: 1 }}>
                    <Text style={LibraryStyles.filteredCountLabel}>
                        {activeGroupItems.length} video{activeGroupItems.length === 1 ? '' : 's'}
                    </Text>
                    <CardGrid data={activeGroupItems} noOuterPadding />
                </View>
            )}
        </ScreenWithWatermark>
    );
}

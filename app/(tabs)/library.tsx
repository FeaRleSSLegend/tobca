import { View, Text, ScrollView } from 'react-native';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPill, filterLabels } from '../../components/ui/FilterPill';
import { LibraryStyles } from '../../constants/styles/library.styles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { CurrentMessage } from '../../components/ui/CurrentMessageCard';
import { HScroll } from '../../components/ui/HScroll';
import { PosterCard } from '../../components/ui/PosterCard';
import { GridCard } from '../../components/ui/GridCard';
import { getCurrentlyStreaming, getSeriesList, getRecentlyAdded } from '../../data/content';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { useMessages } from '../../hooks/useMessages';
import { useRouter } from 'expo-router';

export default function LibraryScreen() {
    const filters = Object.values(filterLabels);
    const [activeFilter, setActiveFilter] = useState('All');
    const router = useRouter();
    const { messages } = useMessages();
    const currentlyStreaming = getCurrentlyStreaming(messages);
    const seriesList = getSeriesList(messages);
    const recentlyAdded = getRecentlyAdded(messages);

    return (
        <ScreenWithWatermark style={sharedStyles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
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

                {/* No SectionLabel here on purpose — this is Library's hero
                    card, same role as LiveCard/VerseOfDayCard on Home, and
                    neither of those get an outer label either. The card's
                    own "Current Message" eyebrow already says what this is;
                    a SectionLabel above it was a second label for one idea. */}
                {currentlyStreaming && <CurrentMessage message={currentlyStreaming} />}

                <SectionLabel label="Series" actionText='See All' />
                <HScroll>
                    {seriesList.map((s) => (
                        <PosterCard key={s.name} title={s.name} subtitle={`${s.count} messages`} />
                    ))}
                </HScroll>

                <SectionLabel label="Recently Added" actionText='See All' onActionPress={() => router.push({ pathname: '/see-all', params: { section: 'recentlyAdded', title: 'Recently Added' } })} />
                <View style={LibraryStyles.gridContainer}>
                    {recentlyAdded.map((msg) => (
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
        </ScreenWithWatermark>
    );
}

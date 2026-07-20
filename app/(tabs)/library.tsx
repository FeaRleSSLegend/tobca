import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { GridCard } from '../../components/ui/GridCard'; // Import new component
import { currentlyStreaming, seriesList, recentlyAdded } from '../../data/content';

export default function LibraryScreen() {
    const filters = Object.values(filterLabels);
    const [activeFilter, setActiveFilter] = useState('All');

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={sharedStyles.container}>
            <ScrollView>
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
                    contentContainerStyle={{ gap: theme.spacing.md }}
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

                <SectionLabel label="Current Message" />
                <CurrentMessage message={currentlyStreaming} />

                <SectionLabel label="Series" actionText='See All' />
                <HScroll>
                    {seriesList.map((s) => (
                        <PosterCard key={s.name} title={s.name} subtitle={`${s.count} messages`} />
                    ))}
                </HScroll>

                <SectionLabel label="Recently Added" actionText='See All' />
                <View style={LibraryStyles.gridContainer}>
                    {recentlyAdded.map((msg) => (
                        <View key={msg.id} style={LibraryStyles.gridItem}>
                            <GridCard 
                                title={msg.title}
                                duration={msg.duration}
                                speaker={msg.speaker}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
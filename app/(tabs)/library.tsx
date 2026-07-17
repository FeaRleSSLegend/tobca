import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { sharedStyles } from "../../constants/styles/sharedStyles";
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterPill, filterLabels } from '../../components/ui/FilterPill';
import { LibraryStyles } from '../../constants/styles/library.styles';

export default function LibraryScreen() {
    const filters = Object.values(filterLabels);
    const [activeFilter, setActiveFilter] = useState('All'); // 'All' is active by default

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={sharedStyles.container}>
            <ScrollView>
                {/* Header row */}
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

                {/* Search Bar */}
                <SearchBar />

                {/* Filter Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={LibraryStyles.filterView}
                    contentContainerStyle={{ gap: theme.spacing.md }}>
                    {filters.map((f) => (
                        <FilterPill
                            key={f}
                            label={f}
                            isActive={activeFilter === f}
                            onPress={() => setActiveFilter(f)}
                        />
                    ))}
                </ScrollView>
            </ScrollView>
        </SafeAreaView>
    );
}
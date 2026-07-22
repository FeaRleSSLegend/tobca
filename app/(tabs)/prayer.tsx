import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { FocusCard } from '../../components/ui/FocusCard';
import { HScroll } from '../../components/ui/HScroll';
import { DocCard } from '../../components/ui/DocCard';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { currentFocus, prayerResources, archivedFocuses } from '../../data/prayer';

export default function PrayerScreen() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={sharedStyles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={sharedStyles.headerRow}>
                    <Text style={{ fontSize: theme.fontSize.heroTitle, fontFamily: theme.fontFamily.display }}>
                        Prayer
                    </Text>
                    <View style={sharedStyles.avatar}>
                        <Text style={{ fontSize: theme.fontSize.body, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
                            JN
                        </Text>
                    </View>
                </View>

                <SectionLabel label={`${currentFocus.month} Focus`} />
                <FocusCard focus={currentFocus} />

                <View style={styles.soonTag}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.graySecondary} />
                    <Text style={styles.soonText}>Live Prayer Audio — Coming Soon</Text>
                </View>

                <SectionLabel label="Prayer Resources" />
                <HScroll>
                    {prayerResources.map((r) => (
                        <DocCard key={r.id} name={r.name} subtitle={`${r.pages} pages`} />
                    ))}
                </HScroll>

                <SectionLabel label="Archive" />
                <HScroll>
                    {archivedFocuses.map((f) => (
                        <DocCard key={f.month} name={f.title} subtitle={`${f.pages} pages`} />
                    ))}
                </HScroll>

                {/* Bottom padding to prevent content from hiding behind player */}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Sticky Audio Player */}
            <AudioPlayer 
                title="Prayer & Fasting: Live"
                subtitle="Streaming audio · Tap to expand"
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 100, // Make room for the player
    },
    bottomPadding: {
        height: 80, // Extra padding at the very bottom
    },
    soonTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.grayBorder,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    soonText: {
        fontFamily: theme.fontFamily.bodySemibold,
        fontSize: theme.fontSize.caption,
        color: theme.colors.graySecondary,
    },
});
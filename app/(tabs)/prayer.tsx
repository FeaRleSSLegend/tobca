import { View, Text, ScrollView } from 'react-native';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { prayerStyles } from '../../constants/styles/prayer.styles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { FocusCard } from '../../components/ui/FocusCard';
import { HScroll } from '../../components/ui/HScroll';
import { DocCard } from '../../components/ui/DocCard';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { currentFocus, prayerResources, archivedFocuses } from '../../data/prayer';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { TabTransition, FadeInUp, staggerDelay } from '../../components/ui/motion';

export default function PrayerScreen() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <TabTransition>
        <ScreenWithWatermark style={sharedStyles.container}>
            <ScrollView contentContainerStyle={prayerStyles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={sharedStyles.headerRow}>
                    <Text style={sharedStyles.screenTitle}>Prayer</Text>
                    <View style={sharedStyles.avatar}>
                        <Text style={{ fontSize: theme.fontSize.body, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
                            JN
                        </Text>
                    </View>
                </View>

                {/* Same call as Library's Current Message card — this is
                    Prayer's hero, and it already carries its own "Prayer &
                    Fasting" eyebrow, so an outer SectionLabel here was
                    saying the same thing twice. */}
                <FocusCard focus={currentFocus} />

                {/* The "Live Prayer Audio — Coming Soon" tag that used to sit
                    here directly contradicted the AudioPlayer docked at the
                    bottom of this same screen, which is already playable and
                    says "Streaming audio" in its own subtitle. Removed rather
                    than reworded — the player itself is the signal that this
                    exists now, and this gap doubles as the breathing room
                    before the utility lists below, the same pause Live and
                    Plan both add after their hero moment. */}
                <View style={{ height: theme.spacing.xl }} />

                <SectionLabel label="Prayer Resources" />
                <HScroll>
                    {prayerResources.map((r, i) => (
                        <FadeInUp key={r.id} delay={staggerDelay(i)}>
                            <DocCard name={r.name} subtitle={`${r.pages} pages`} />
                        </FadeInUp>
                    ))}
                </HScroll>

                <SectionLabel label="Archive" />
                <HScroll>
                    {archivedFocuses.map((f, i) => (
                        // Distinct icon from the resource guides above — same
                        // DocCard, but these represent past focuses, not PDFs,
                        // and looked identical to the row above at a glance.
                        <FadeInUp key={f.month} delay={staggerDelay(i)}>
                            <DocCard name={f.title} subtitle={`${f.pages} pages`} icon="archive-outline" />
                        </FadeInUp>
                    ))}
                </HScroll>
            </ScrollView>

            {/* Sticky Audio Player */}
            <AudioPlayer 
                title="Prayer & Fasting: Live"
                subtitle="Streaming audio · Tap to expand"
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
            />
        </ScreenWithWatermark>
        </TabTransition>
    );
}

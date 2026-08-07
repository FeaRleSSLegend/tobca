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
import { TabTransition } from '../../components/ui/motion';
import { BrandLoader } from '../../components/ui/BrandLoader';

export default function PrayerScreen() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <TabTransition>
        <ScreenWithWatermark style={sharedStyles.container}>
            <ScrollView contentContainerStyle={prayerStyles.scrollContent} showsVerticalScrollIndicator={false}>
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
                    {prayerResources.map((r) => (
                        <DocCard key={r.id} name={r.name} subtitle={`${r.pages} pages`} />
                    ))}
                </HScroll>

                <SectionLabel label="Archive" />
                <HScroll>
                    {archivedFocuses.map((f) => (
                        // Distinct icon from the resource guides above — same
                        // DocCard, but these represent past focuses, not PDFs,
                        // and looked identical to the row above at a glance.
                        <DocCard key={f.month} name={f.title} subtitle={`${f.pages} pages`} icon="archive-outline" />
                    ))}
                </HScroll>

                {/* TEMPORARY — BrandLoader preview.
                    The real loading states it was built for (Today's Reading,
                    the plan carousel) only appear before the scripture cache is
                    warm, so on a device that has already read them the loader
                    is effectively unreachable. Parked here, always running, so
                    the animation can actually be watched.
                    Delete this block once you've seen it. */}
                <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxxl, gap: theme.spacing.xl }}>
                    <BrandLoader width={220} />
                    <BrandLoader width={140} />
                    {/* Single-tint variant, as used on the Plan hero (which
                        passes white because brand pink/purple vanish against
                        its gradient). Navy here so it's visible on this
                        light background. */}
                    <BrandLoader width={220} tint={theme.colors.navy} />
                </View>
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

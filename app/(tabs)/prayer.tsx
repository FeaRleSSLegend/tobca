import { View, Text, ScrollView, ActivityIndicator, Linking, Pressable } from 'react-native';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { prayerStyles } from '../../constants/styles/prayer.styles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { FocusCard } from '../../components/ui/FocusCard';
import { HScroll } from '../../components/ui/HScroll';
import { DocCard } from '../../components/ui/DocCard';
import { DocumentRow } from '../../components/ui/DocumentRow';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { currentFocus, prayerResources, archivedFocuses } from '../../data/prayer';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { TabTransition, FadeInUp, staggerDelay } from '../../components/ui/motion';
import { useTabBottomClearance } from '../../hooks/useBottomClearance';
import { useR2Manifest } from '../../hooks/useR2Manifest';
import { formatBytes } from '../../services/r2';

export default function PrayerScreen() {
    const [isPlaying, setIsPlaying] = useState(false);
    // Prayer is the one tab with chrome of its OWN floating over the content:
    // the sticky AudioPlayer. Its height is measured rather than assumed —
    // see AudioPlayer's onHeightChange. The shared hook then adds the
    // mini-player on top when that is docked too.
    const [audioBarHeight, setAudioBarHeight] = useState(0);
    const bottomClearance = useTabBottomClearance();
    // The church's real PDFs, from the documents manifest in R2. Additive to
    // the sections above it: `prayerResources` and `archivedFocuses` are still
    // the hand-written data they always were, and are left untouched here.
    const documents = useR2Manifest('documents');

    // Straight out to the system PDF viewer. No in-app reader: a PDF is a
    // thing people save, print and share, and the OS viewer already does all
    // three better than anything this app would ship.
    const openDocument = (url: string) => {
        Linking.openURL(url).catch((e) => console.warn('Failed to open document:', e));
    };

    return (
        <TabTransition>
        <ScreenWithWatermark style={sharedStyles.container}>
            <ScrollView
                contentContainerStyle={[
                    prayerStyles.scrollContent,
                    { paddingBottom: bottomClearance + audioBarHeight },
                ]}
                showsVerticalScrollIndicator={false}
            >
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
                {/* The 24pt spacer that used to sit here is gone: SectionLabel
                    below already carries a 24pt section margin of its own, so
                    the two stacked into a 48pt hole — the same doubled gap
                    Live had, from the same cause. One owner per gap. */}
                <SectionLabel label="Prayer Resources" />
                <HScroll>
                    {prayerResources.map((r, i) => (
                        <FadeInUp key={r.id} delay={staggerDelay(i)}>
                            <DocCard name={r.name} subtitle={`${r.pages} pages`} />
                        </FadeInUp>
                    ))}
                </HScroll>

                {/* DOCUMENTS — the real, downloadable guides. Placed next to
                    the resource shelf above because they are the same kind of
                    thing, and before Archive so live material outranks past
                    material. */}
                <SectionLabel label="Documents" />
                {documents.status === 'loading' ? (
                    <View style={prayerStyles.docsStatus}>
                        <ActivityIndicator color={theme.colors.pink} />
                    </View>
                ) : documents.status === 'error' ? (
                    // An inline retry, not a full-screen empty state: this is
                    // one section inside a screen whose other sections loaded
                    // fine, and blanking the page for it would be a lie about
                    // what failed.
                    <View style={prayerStyles.docsStatus}>
                        <Text style={prayerStyles.docsStatusText}>
                            Couldn't load documents. Check your connection.
                        </Text>
                        <Pressable onPress={documents.reload} hitSlop={8} accessibilityRole="button">
                            <Text style={prayerStyles.docsRetry}>Try again</Text>
                        </Pressable>
                    </View>
                ) : documents.items.length === 0 ? (
                    <View style={prayerStyles.docsStatus}>
                        <Text style={prayerStyles.docsStatusText}>
                            Prayer guides and timetables will appear here once they are published.
                        </Text>
                    </View>
                ) : (
                    <View style={prayerStyles.docsList}>
                        {documents.items.map((doc, i) => (
                            <FadeInUp key={doc.url} delay={staggerDelay(i)}>
                                <DocumentRow
                                    title={doc.title}
                                    sizeLabel={formatBytes(doc.sizeBytes)}
                                    onPress={() => openDocument(doc.url)}
                                />
                            </FadeInUp>
                        ))}
                    </View>
                )}

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
                onHeightChange={setAudioBarHeight}
            />
        </ScreenWithWatermark>
        </TabTransition>
    );
}

import { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { sharedStyles } from '../../constants/styles/sharedStyles';
import { prayerStyles } from '../../constants/styles/prayer.styles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { FocusCard } from '../../components/ui/FocusCard';
import { HScroll } from '../../components/ui/HScroll';
import { DocCard } from '../../components/ui/DocCard';
import { DocumentRow } from '../../components/ui/DocumentRow';
import { currentFocus, prayerResources, archivedFocuses } from '../../data/prayer';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { TabTransition, FadeInUp, staggerDelay } from '../../components/ui/motion';
import { useTabBottomClearance } from '../../hooks/useBottomClearance';
import { AudioListRow, AUDIO_ROW_ART } from '../../components/ui/AudioListRow';
import { useAudioManifest } from '../../hooks/useAudioManifest';
import { useAudioFiles, useAudioProgress } from '../../providers/AudioFileProvider';
import { buildTrackIndex } from '../../utils/audioTracks';
import { formatAudioDate, formatClock, groupAudio } from '../../utils/audioGrouping';
import { StyleSheet } from 'react-native';
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { useR2Manifest } from '../../hooks/useR2Manifest';
import { formatBytes } from '../../services/r2';

// THE AMBIENT-AUDIO CAPSULE THAT USED TO LIVE HERE IS GONE — read this before
// wiring Mixlr.
//
// This screen used to dock its own <AudioPlayer> bar at the bottom: title
// "Prayer & Fasting: Live", subtitle "Streaming audio · Tap to expand", a
// gradient play button. It was a SHELL. Its isPlaying was a local useState
// that flipped an icon and nothing else, its onPress was never passed, and no
// audio source existed anywhere behind it — confirmed by reading it: the
// component (components/ui/AudioPlayer.tsx, now deleted) took only strings and
// two callbacks and never touched an audio API.
//
// Once the Library's audio player shipped, that shell became a real problem
// rather than a harmless placeholder: two floating bars stacked at the bottom
// of this tab, one of them functional and one of them theatre. Moving them
// apart would have been a patch on the wrong layer, because a phone can play
// ONE audio source, and a live prayer stream and a sermon recording are both
// going to be real.
//
// So there is now exactly one now-playing surface for the whole app —
// components/player/AudioPlayerHost, driven by providers/AudioFileProvider —
// and it already renders over this tab like every other. If a sermon is
// playing, you see it here; if nothing is, you see nothing.
//
// WIRING MIXLR, when there is a stream to wire, is a single call into that
// same state — no new component, no second bar:
//
//   const audio = useAudioFiles();
//   audio.play({
//     id: 'live:prayer',
//     title: 'Prayer & Fasting: Live',
//     uri: <the Mixlr stream url>,
//     kind: 'live',
//     subtitle: 'Live now',
//   });
//
// Put that behind a card in this screen's content flow (NOT a floating bar —
// that surface is taken). kind: 'live' already tells the player to skip
// position restore, position saving and save-for-offline, and starting it
// replaces whatever was playing, which is the correct behaviour and is free.
export default function PrayerScreen() {
    const push = useGuardedPush();
    const bottomClearance = useTabBottomClearance();
    // The church's real PDFs, from the documents manifest in R2. Additive to
    // the sections above it: `prayerResources` and `archivedFocuses` are still
    // the hand-written data they always were, and are left untouched here.
    const documents = useR2Manifest('documents');

    // PRAYER RECORDINGS. The other half of the audio manifest — see
    // utils/audioPurpose for how a title is decided to be prayer rather than
    // teaching, and hooks/useAudioManifest for why the scope lives in one place.
    //
    // Note this list is NOT the complement of the Library's: the service-embedded
    // prayer segments appear in both, because they are prayer AND part of the
    // services they were recorded in.
    const prayerAudio = useAudioManifest('prayer');
    const audio = useAudioFiles();
    // Duration is a live reading off the player, so only the loaded row has one.
    const { duration } = useAudioProgress();

    // Memoised on the manifest identity. groupAudio is run only to supply the
    // series lookup buildTrackIndex expects; none of these 14 recordings is
    // expected to belong to a series, and the map is simply empty when so.
    const prayerTracks = useMemo(() => {
        const { seriesByUrl } = groupAudio(prayerAudio.items);
        return buildTrackIndex(prayerAudio.items, seriesByUrl).all;
    }, [prayerAudio.items]);

    const prayerSizeByUrl = useMemo(
        () => new Map(prayerAudio.items.map((i) => [i.url, formatBytes(i.sizeBytes)])),
        [prayerAudio.items]
    );

    // IN-APP now, not out to the system viewer.
    //
    // The old behaviour handed the file to Linking.openURL and the person left
    // for Drive or Chrome — which reads as the app ending rather than as a
    // document opening. A 21-day fasting guide is something you read ALONGSIDE
    // the prayer focus above it, so it stays inside the app; see app/document
    // for how it renders a PDF without a PDF library, and for the "open
    // externally" escape hatch that survives from the old behaviour.
    const openDocument = (url: string, title: string) =>
        push({ pathname: '/document', params: { url, title } });

    return (
        <TabTransition>
        <ScreenWithWatermark style={sharedStyles.container}>
            <ScrollView
                contentContainerStyle={[
                    prayerStyles.scrollContent,
                    // No local audio-bar height any more: useTabBottomClearance
                    // already accounts for the shared mini player whenever it
                    // is docked, on this tab exactly as on every other.
                    { paddingBottom: bottomClearance },
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

                {/* PRAYER AUDIO — recordings of prayer gatherings, split out
                    of the audio manifest by utils/audioPurpose.

                    ROWS ARE AudioListRow, the same component the Library's Audio
                    tab uses, not a Prayer-tab lookalike. This is the same kind of
                    object on a different tab: same artwork treatment, same
                    title/speaker/date/duration, same currently-playing marker,
                    and — because it goes through the same AudioFileProvider —
                    the same mini player and the same resume position. A person
                    who starts a recording here and opens the Library sees it
                    still playing, which only holds because nothing here is a
                    second implementation.

                    Sits directly above Documents so the two resource sections —
                    what you can listen to, what you can read — are neighbours.

                    The section is omitted entirely when empty rather than
                    showing a placeholder: on a manifest with no prayer
                    recordings, a header over nothing is worse than no header. */}
                {prayerTracks.length > 0 && (
                    <>
                        <SectionLabel label="Prayer Audio" />
                        <View style={prayerAudioStyles.list}>
                            {prayerTracks.map((track, i) => {
                                const isActive = audio.isActive(track.id);
                                return (
                                    <View key={track.id}>
                                        {i > 0 && <View style={prayerAudioStyles.divider} />}
                                        <AudioListRow
                                            title={track.title}
                                            series={track.series}
                                            speaker={track.speaker}
                                            date={formatAudioDate(track.date)}
                                            duration={
                                                isActive && duration > 0 ? formatClock(duration) : null
                                            }
                                            sizeLabel={
                                                track.sourceUrl
                                                    ? prayerSizeByUrl.get(track.sourceUrl)
                                                    : null
                                            }
                                            isActive={isActive}
                                            isPlaying={audio.isPlaying(track.id)}
                                            isLoading={audio.isLoading(track.id)}
                                            isSaved={
                                                !!track.sourceUrl && audio.isSaved(track.sourceUrl)
                                            }
                                            // The queue is this section, so
                                            // next/previous move through the
                                            // prayer recordings rather than
                                            // jumping into Library teachings.
                                            onPress={() =>
                                                audio.toggle(track, {
                                                    items: prayerTracks,
                                                    label: 'Prayer Audio',
                                                })
                                            }
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

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
                                    onPress={() => openDocument(doc.url, doc.title)}
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

        </ScreenWithWatermark>
        </TabTransition>
    );
}

const prayerAudioStyles = StyleSheet.create({
    list: {
        // SectionLabel owns the gap above; the list contributes nothing of its
        // own, the same rule every other section on this screen follows.
        marginTop: -theme.space.micro,
    },
    // The same hairline the Library's audio lists use, inset to the title's
    // left edge so a prayer recording looks identical in both places.
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.grayBorder,
        marginLeft: AUDIO_ROW_ART + theme.space.tight + 4,
    },
});

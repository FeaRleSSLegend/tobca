import { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { useSharedStyles } from '../../constants/styles/sharedStyles';
import { usePrayerStyles } from '../../constants/styles/prayer.styles';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { ContinueCard, ContinueCardEmpty } from '../../components/ui/ContinueCard';
import { DocumentRow } from '../../components/ui/DocumentRow';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useContinueListening } from '../../hooks/useContinueListening';
import { ScreenWithWatermark } from '../../components/ui/ScreenWithWatermark';
import { TabTransition, FadeInUp, staggerDelay } from '../../components/ui/motion';
import { useTabBottomClearance } from '../../hooks/useBottomClearance';
import { AudioListRow, AUDIO_ROW_ART } from '../../components/ui/AudioListRow';
import { useAudioManifest } from '../../hooks/useAudioManifest';
import { useAudioFiles, useAudioProgress } from '../../providers/AudioFileProvider';
import { buildTrackIndex } from '../../utils/audioTracks';
import { formatAudioDate, formatClock, groupAudio } from '../../utils/audioGrouping';
import { StyleSheet } from 'react-native';
import { makeThemedStyles, useThemeColors } from '../../hooks/useTheme';
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
// The same teaser count the Library's shelves and the Audio hub use, for the
// same reason: a capped preview says "there is more behind this header", and
// the full list is a place you navigate to rather than a tail you fall into.
// See components/library/AudioLibrary.tsx, which is where this pattern is
// written down.
const PREVIEW_COUNT = 6;

export default function PrayerScreen() {
    const prayerAudioStyles = usePrayerAudioStyles();
    const c = useThemeColors();
    const sharedStyles = useSharedStyles();
    const prayerStyles = usePrayerStyles();
    const push = useGuardedPush();
    const bottomClearance = useTabBottomClearance();
    // The church's real PDFs, from the documents manifest in R2. This is now
    // the ONLY document surface on the screen: the hand-written
    // `prayerResources` and `archivedFocuses` shelves that used to sit around
    // it — five cards, five invented page counts, no files — are gone, and
    // data/prayer.ts with them.
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

    // The six rows actually drawn. The QUEUE handed to the player stays
    // `prayerTracks` (the whole list) — capping the preview is a layout
    // decision and must not leak into the transport, or "next" would stop dead
    // at the sixth row.
    const prayerPreview = useMemo(
        () => prayerTracks.slice(0, PREVIEW_COUNT),
        [prayerTracks]
    );

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

    // THE ONE THING TO RESUME, if there is one. Scoped to `prayerTracks`, so a
    // half-finished Library teaching never surfaces on this tab. Re-read on
    // focus and whenever the loaded track changes — see the hook.
    const { entry: continueEntry, ready } = useContinueListening(
        prayerTracks,
        audio.track?.id ?? null
    );

    // Straight into the full player at the saved position. The seek is NOT
    // done here: providers/AudioFileProvider restores a 'recording' track's
    // position itself the moment the source loads, so passing the track is the
    // whole of "resume" — doing it again here would be a second implementation
    // of the same behaviour, and they would drift.
    //
    // Already-loaded is a separate branch on purpose: play() on the current
    // track rebuilds the player and would restart the file someone is
    // listening to right now. Expanding is what they actually want.
    const resumeContinue = () => {
        if (!continueEntry) return;
        if (!audio.isActive(continueEntry.track.id)) {
            audio.play(continueEntry.track, { items: prayerTracks, label: 'Prayer Audio' });
        }
        audio.expand();
    };

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
                <ScreenHeader title="Prayer" />

                {/* CONTINUE LISTENING — the slot the static "Prayer &
                    Fasting / Day 8 of 21" gradient card used to hold. That card
                    and its dead "View Full Focus" link are gone; see the note
                    in components/ui/ContinueCard for why nothing replaced them
                    in kind. This reads utils/playbackProgress, scoped to this
                    tab's own recordings, so it is only ever showing something
                    the person actually started here.

                    Nothing renders until the manifest has landed AND the store
                    has been read (`ready`): the alternative is the empty state
                    appearing for a frame on every visit and then being replaced,
                    which looks like a bug even though both states are true in
                    turn.

                    The "Prayer Resources" shelf that used to follow it is gone
                    too — its three cards were hand-written literals with
                    invented page counts and a fileUrl of 'REPLACE_ME'. The real
                    PDFs are the Documents section below, which reads the R2
                    manifest. */}
                {ready &&
                    (continueEntry ? (
                        <ContinueCard
                            title={continueEntry.track.title}
                            subtitle={
                                continueEntry.track.speaker ??
                                continueEntry.track.series ??
                                formatAudioDate(continueEntry.track.date)
                            }
                            positionSeconds={continueEntry.positionSeconds}
                            durationSeconds={continueEntry.durationSeconds}
                            onPress={resumeContinue}
                        />
                    ) : (
                        <ContinueCardEmpty />
                    ))}

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
                        {/* CAPPED, with the chevron into the full list — the
                            exact "All Recordings" pattern from the Library's
                            Audio hub, into the same collection screen
                            (app/audio-collection.tsx, now with a `prayer`
                            section that reads the prayer SCOPE of the
                            manifest). This was a flat list of every prayer
                            recording, which on a tab that also carries
                            Continue, Documents and whatever comes next made
                            the screen bottomless. */}
                        <SectionLabel
                            label="Prayer Audio"
                            onPress={
                                prayerTracks.length > PREVIEW_COUNT
                                    ? () =>
                                          push({
                                              pathname: '/audio-collection',
                                              params: { section: 'prayer', title: 'Prayer Audio' },
                                          })
                                    : undefined
                            }
                        />
                        <View style={prayerAudioStyles.list}>
                            {prayerPreview.map((track, i) => {
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
                        {prayerTracks.length > PREVIEW_COUNT && (
                            <Text style={prayerAudioStyles.moreHint}>
                                {prayerTracks.length} recordings
                            </Text>
                        )}
                    </>
                )}

                {/* DOCUMENTS — the real, downloadable guides. Placed next to
                    the resource shelf above because they are the same kind of
                    thing, and before Archive so live material outranks past
                    material. */}
                {/* Same compacting as Prayer Audio above, into
                    app/documents.tsx — the CollectionShell full list. Renamed
                    from "Documents" to "Prayer Resources" so the header and
                    the screen it opens agree on what this is; "Documents" was
                    a description of the file type rather than of the section.
                    The chevron only appears when there is genuinely more than
                    the preview shows. */}
                <SectionLabel
                    label="Prayer Resources"
                    onPress={
                        documents.items.length > PREVIEW_COUNT
                            ? () => push('/documents')
                            : undefined
                    }
                />
                {documents.status === 'loading' ? (
                    <View style={prayerStyles.docsStatus}>
                        <ActivityIndicator color={c.accent} />
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
                    <>
                        <View style={prayerStyles.docsList}>
                            {documents.items.slice(0, PREVIEW_COUNT).map((doc, i) => (
                                <FadeInUp key={doc.url} delay={staggerDelay(i)}>
                                    <DocumentRow
                                        title={doc.title}
                                        sizeLabel={formatBytes(doc.sizeBytes)}
                                        onPress={() => openDocument(doc.url, doc.title)}
                                    />
                                </FadeInUp>
                            ))}
                        </View>
                        {documents.items.length > PREVIEW_COUNT && (
                            <Text style={prayerAudioStyles.moreHint}>
                                {documents.items.length} documents
                            </Text>
                        )}
                    </>
                )}

                {/* The "Archive" shelf that used to close this screen is gone
                    with the rest of data/prayer: two DocCards titled "June
                    Focus" and "May Focus", each captioned with a page count
                    ("6 pages", "5 pages") for a PDF that does not exist and was
                    never linked — tapping one did nothing. There is no archive
                    behind it to render honestly, so nothing stands in its
                    place. */}
            </ScrollView>

        </ScreenWithWatermark>
        </TabTransition>
    );
}

const usePrayerAudioStyles = makeThemedStyles((c) => ({
    list: {
        // SectionLabel owns the gap above; the list contributes nothing of its
        // own, the same rule every other section on this screen follows.
        marginTop: -theme.space.micro,
    },
    // Byte-for-byte the Library hub's own "N recordings" footnote — same
    // placement, same register. It answers "how much is behind that chevron"
    // without making the person tap to find out.
    moreHint: {
        marginTop: theme.space.header,
        fontFamily: theme.fontFamily.body,
        fontSize: theme.fontSize.caption,
        color: c.textMuted,
        textAlign: 'center',
    },
    // The same hairline the Library's audio lists use, inset to the title's
    // left edge so a prayer recording looks identical in both places.
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: c.border,
        marginLeft: AUDIO_ROW_ART + theme.space.tight + 4,
    },
}));

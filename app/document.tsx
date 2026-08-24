// app/document.tsx
// In-app PDF viewer for the church's prayer documents.
//
// WHAT THIS REPLACES
// Tapping a document used to call Linking.openURL and hand the file to
// whatever PDF app the phone happened to have. That works, but it ends the
// session: the person is now in Drive or Chrome, the church app is in the
// background, and coming back is their problem. A 21-day fasting guide is
// something you read alongside the app, not instead of it.
//
// HOW IT RENDERS A PDF WITH NO PDF LIBRARY
// Google's public document viewer, in a WebView:
//
//   https://docs.google.com/viewer?url=<encoded>&embedded=true
//
// Google fetches the PDF server-side, rasterises it and serves back a plain
// HTML page, so the WebView never has to understand PDF at all. That is the
// whole reason no native dependency is needed — react-native-pdf and its peers
// ship a real renderer and would mean a new native module, a rebuild, and a
// second thing to keep on the Expo SDK's version treadmill. react-native-webview
// is already a dependency here (the YouTube player runs in one).
//
// THE ENCODING, WHICH IS EASY TO GET WRONG
// The manifest's urls contain raw spaces, and services/r2.ts normalizes them to
// %20 on the way in. That normalized string then has to be encoded AGAIN as a
// query-parameter VALUE, so '%20' correctly becomes '%2520' inside the viewer
// url — Google decodes the parameter once and fetches '…%20…', which is the
// url that actually exists. Encoding only once produces a viewer url whose
// query string contains a literal space, and Google fetches the wrong thing.
//
// WHAT THIS TRADES AWAY, STATED PLAINLY
//   - it needs a connection. The viewer is a remote service; there is no
//     offline path, and the error state says so rather than blaming the file.
//   - the PDF is fetched by Google, not by us. These documents are already
//     public on an unauthenticated R2 bucket, so nothing private is being
//     handed to a third party — but that is the reason it is acceptable here
//     and would not be for anything behind a login.
//   - Google's viewer occasionally cannot render a file (very large scans,
//     unusual producers). That is why "Open externally" exists — a SAFETY NET,
//     not the primary path, and it stays visible rather than only appearing
//     after a failure, because a viewer that has rendered a blank grey page has
//     not "errored" in any way the WebView can report.

import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { BrandLoader } from '../components/ui/BrandLoader';
import { EmptyState } from '../components/ui/EmptyState';

/** The viewer url for a public PDF. See the encoding note above. */
export function googleViewerUrl(pdfUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
}

export default function DocumentScreen() {
  const { url, title } = useLocalSearchParams<{ url?: string; title?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // Bumped to force a full WebView remount on retry. Reloading in place after
  // a failed navigation often re-serves the same cached error page.
  const [attempt, setAttempt] = useState(0);

  const viewerUrl = useMemo(() => (url ? googleViewerUrl(url) : null), [url]);

  const openExternally = useCallback(() => {
    if (!url) return;
    Linking.openURL(url).catch((e) => console.warn('Failed to open document externally:', e));
  }, [url]);

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Same back-header recipe as CollectionShell, rebuilt rather than
          reused: that component also owns a search field and a pill row, and a
          document has neither. The metrics are the shared tokens, so the two
          headers still line up. */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Document'}
          </Text>
          <Text style={styles.subtitle}>PDF</Text>
        </View>
        {/* The safety net. Always present, never promoted: a small icon button,
            not a call to action, because leaving the app is the fallback. */}
        <Pressable
          onPress={openExternally}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Open this document outside the app"
        >
          <Ionicons name="open-outline" size={20} color={theme.colors.grayIcon} />
        </Pressable>
      </View>

      <View style={styles.stage}>
        {!viewerUrl ? (
          <EmptyState
            icon="document-outline"
            title="No document"
            subtitle="This link didn't include a document to open."
          />
        ) : failed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't display this document"
            subtitle="The in-app viewer needs a connection, and very large files sometimes can't be shown here. You can try again, or open it outside the app."
            actionLabel="Try again"
            onAction={retry}
          />
        ) : (
          <>
            <WebView
              key={attempt}
              source={{ uri: viewerUrl }}
              style={styles.web}
              // The viewer is a plain HTML page; nothing here needs to open a
              // second window, and a stray target=_blank would look exactly
              // like a load failure.
              setSupportMultipleWindows={false}
              // Android composites a WebView badly against animated parents
              // without this — the same flag the YouTube host sets.
              androidLayerType="hardware"
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              // Only a hard navigation failure counts as failed. An HTTP error
              // on a SUBRESOURCE (a font, a tile) is routine inside Google's
              // viewer and must not blank a page that is rendering fine, so
              // onHttpError is deliberately not wired to setFailed.
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              startInLoadingState={false}
            />

            {loading && (
              <View style={styles.loading} pointerEvents="none">
                {/* The app's own loader, not a bare spinner — this wait is
                    long enough (Google rasterises the whole file before it
                    serves anything) that a branded hold reads as the app
                    working rather than as the app stuck. */}
                <BrandLoader width={132} />
                <Text style={styles.loadingLabel}>Preparing document…</Text>
                <Text style={styles.loadingHint}>Large files can take a moment</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* A text fallback pinned at the bottom, in addition to the header icon.
          Two routes to the same escape hatch is deliberate: someone staring at
          a viewer that rendered blank is not going to go looking in the header
          for a glyph they never noticed. */}
      {viewerUrl && !failed && (
        <Pressable
          onPress={openExternally}
          style={[styles.fallbackBar, { paddingBottom: insets.bottom + theme.spacing.md }]}
          accessibilityRole="button"
          accessibilityLabel="Open this document outside the app"
        >
          <Ionicons name="open-outline" size={15} color={theme.colors.graySecondary} />
          <Text style={styles.fallbackLabel}>Not displaying? Open externally</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.pageTitle,
    color: theme.colors.navy,
  },
  subtitle: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
  stage: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  web: {
    flex: 1,
    // The viewer's own page is white; matching it stops a grey flash between
    // the WebView attaching and the document painting.
    backgroundColor: theme.colors.surface,
  },
  // Covers the WebView rather than replacing it, so the page underneath is
  // already laid out and nothing jumps when the loader lifts.
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.tight,
    backgroundColor: theme.colors.surface,
  },
  loadingLabel: {
    marginTop: theme.space.tight,
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.body,
    color: theme.colors.navy,
  },
  loadingHint: {
    fontFamily: theme.fontFamily.body,
    fontSize: theme.fontSize.caption,
    color: theme.colors.grayIcon,
  },
  fallbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.micro + 2,
    paddingTop: theme.spacing.md,
    borderTopWidth: theme.layout.cardBorderWidth,
    borderTopColor: theme.colors.grayBorder,
    backgroundColor: theme.colors.bg,
  },
  fallbackLabel: {
    fontFamily: theme.fontFamily.bodyMedium,
    fontSize: theme.fontSize.caption,
    color: theme.colors.graySecondary,
  },
});

// Dedicated search screen, pushed from the Library tab. Search used to be
// an inline TextInput on the Library screen that grew a results list
// straight into the same ScrollView — fine while empty, but every
// keystroke added more views into a screen that already had a hero card,
// a filter row, and two horizontal lists competing for space. Giving it
// its own screen (same pattern reading.tsx uses for the scripture reader)
// means results have the whole screen to render into, and Library never
// has to reflow around them.
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { searchStyles } from '../constants/styles/search.styles';
import { MessageCard } from '../components/ui/MessageCard';
import { ScreenWithWatermark } from '../components/ui/ScreenWithWatermark';
import { messages, recentlyAdded } from '../data/content';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const results = query.trim().length > 0
    ? messages.filter((m) => m.title.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  return (
    <ScreenWithWatermark style={searchStyles.container}>
      <View style={searchStyles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={searchStyles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.navy} />
        </Pressable>

        <View style={searchStyles.inputWrap}>
          <Ionicons name="search" size={18} color={theme.colors.grayIcon} />
          <TextInput
            autoFocus
            placeholder="Search sermons, videos, and more"
            placeholderTextColor={theme.colors.grayIcon}
            value={query}
            onChangeText={setQuery}
            style={searchStyles.input}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} style={searchStyles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={theme.colors.grayIcon} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={searchStyles.scrollContent} keyboardShouldPersistTaps="handled">
        {query.trim().length === 0 ? (
          // Nothing typed yet — a blank screen right after opening search
          // reads as broken, and research on search UX backs up showing
          // something useful before the first keystroke rather than an
          // empty page. Recently Added is content the person already
          // recognizes from Library, so it orients rather than distracts.
          <>
            <Text style={searchStyles.sectionLabel}>Recently Added</Text>
            <View style={searchStyles.resultsList}>
              {recentlyAdded.map((msg) => (
                <MessageCard
                  key={msg.id}
                  id={msg.id}
                  title={msg.title}
                  speaker={msg.speaker}
                  duration={msg.duration}
                  series={msg.series}
                  type={msg.type}
                  publishedAt={msg.publishedAt}
                />
              ))}
            </View>
          </>
        ) : results.length > 0 ? (
          <View style={searchStyles.resultsList}>
            {results.map((msg) => (
              <MessageCard
                key={msg.id}
                id={msg.id}
                title={msg.title}
                speaker={msg.speaker}
                duration={msg.duration}
                series={msg.series}
                type={msg.type}
                publishedAt={msg.publishedAt}
              />
            ))}
          </View>
        ) : (
          <Text style={searchStyles.noResults}>No results for "{query}"</Text>
        )}
      </ScrollView>
    </ScreenWithWatermark>
  );
}

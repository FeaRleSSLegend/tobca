import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from "../../constants/theme";
import { useState } from 'react';
import { messages } from '../../data/content';
import { LibraryStyles } from '../../constants/styles/library.styles';
import { MessageCard } from './MessageCard';

export const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredMessages = messages.filter((msg) =>
        msg.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <View style={LibraryStyles.searchBar}>
                {/* Every comparable search field — podcast apps, Spotify,
                    the Bible apps this app sits next to — leads with a
                    glass icon so the field reads as "search" before anyone
                    taps in or starts typing. This one was icon-less. */}
                <Ionicons name="search" size={18} color={theme.colors.grayIcon} />
                <TextInput
                    placeholder='Search sermons, videos, and more'
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={LibraryStyles.searchInput}
                    placeholderTextColor={theme.colors.grayIcon}
                />
                {/* Standard search-field pattern — a way to clear without
                    backspacing character by character. Only appears once
                    there's something to clear. */}
                {searchQuery.length > 0 && (
                    <Pressable
                        onPress={() => setSearchQuery('')}
                        hitSlop={8}
                        style={LibraryStyles.clearBtn}
                    >
                        <Ionicons name="close-circle" size={18} color={theme.colors.grayIcon} />
                    </Pressable>
                )}
            </View>

            {searchQuery.length > 0 && (
                <View style={LibraryStyles.searchText}>
                    {filteredMessages.length > 0 ? (
                        filteredMessages.map((msg) => (
                            <MessageCard
                                key={msg.id}
                                id={msg.id}
                                title={msg.title}
                                speaker={msg.speaker}
                                duration={msg.duration}
                                series={msg.series}
                                publishedAt={msg.publishedAt}
                            />
                        ))
                    ) : (
                        // A blank scroll area after typing reads as broken,
                        // not "no matches" — say so explicitly.
                        <Text style={LibraryStyles.noResults}>
                            No results for "{searchQuery}"
                        </Text>
                    )}
                </View>
            )}
        </>
    );
};

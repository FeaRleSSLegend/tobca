import { View, Text, TextInput } from 'react-native';
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
                <TextInput
                    placeholder='Search sermons, videos, and more'
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={LibraryStyles.searchInput}
                />
            </View>

            {searchQuery.length > 0 && (
                <View style={LibraryStyles.searchText}>
                    {filteredMessages.map((msg) => (
                        <MessageCard
                            key={msg.id}
                            id={msg.id}
                            title={msg.title}
                            speaker={msg.speaker}
                            duration={msg.duration}
                            series={msg.series}
                            publishedAt={msg.publishedAt}
                        />
                    ))}
                </View>
            )}
        </>
    );
};
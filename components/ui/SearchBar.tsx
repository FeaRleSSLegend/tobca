import { Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from "../../constants/theme";
import { LibraryStyles } from '../../constants/styles/library.styles';

// Used to be a real TextInput that grew a results list straight into this
// screen as soon as someone typed — see app/search.tsx for why that moved
// to its own screen. This is now just a styled trigger: tapping it pushes
// Search, where the actual input lives (auto-focused, so the keyboard is
// already up by the time the screen finishes transitioning in).
export const SearchBar = () => {
    const router = useRouter();

    return (
        <Pressable style={LibraryStyles.searchBar} onPress={() => router.push('/search')}>
            <Ionicons name="search" size={18} color={theme.colors.grayIcon} />
            <Text style={LibraryStyles.searchPlaceholder}>Search sermons, videos, and more</Text>
        </Pressable>
    );
};

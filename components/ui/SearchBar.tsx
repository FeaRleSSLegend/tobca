import { Text, Pressable } from 'react-native';
import { PressableScale } from './motion';
import { Ionicons } from '@expo/vector-icons';
import { theme } from "../../constants/theme";
import { useLibraryStyles } from '../../constants/styles/library.styles';
import { useGuardedPush } from '../../hooks/useGuardedPush';
import { useThemeColors } from '../../hooks/useTheme';

// Used to be a real TextInput that grew a results list straight into this
// screen as soon as someone typed — see app/search.tsx for why that moved
// to its own screen. This is now just a styled trigger: tapping it pushes
// Search, where the actual input lives (auto-focused, so the keyboard is
// already up by the time the screen finishes transitioning in).
export const SearchBar = () => {
  const LibraryStyles = useLibraryStyles();
  const c = useThemeColors();
    // Guarded: this trigger stays on screen during the push transition, so a
    // quick double-tap used to open Search twice.
    const push = useGuardedPush();

    return (
        <PressableScale style={LibraryStyles.searchBar} onPress={() => push('/search')} accessibilityRole="search" accessibilityLabel="Search sermons, audio, and more">
            <Ionicons name="search" size={18} color={c.grayIcon} />
            <Text style={LibraryStyles.searchPlaceholder}>Search sermons, audio, and more</Text>
        </PressableScale>
    );
};

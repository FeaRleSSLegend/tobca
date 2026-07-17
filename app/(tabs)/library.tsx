import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {theme} from '../../constants/theme';
import {sharedStyles} from "../../constants/styles/sharedStyles"
import { SearchBar } from '../../components/ui/SearchBar';


export default function LibraryScreen() {
  return (
    <SafeAreaView style={sharedStyles.container}>
      <ScrollView>
        {/* Header row*/}
              <View style={sharedStyles.headerRow}>
                  
                  <Text style={{ fontSize: theme.fontSize.heroTitle, fontFamily: theme.fontFamily.display }}>
                    Library
                  </Text>
        
                <View style={sharedStyles.avatar}>
                  <Text style={{ fontSize: theme.fontSize.body, fontFamily: theme.fontFamily.display, color: theme.colors.white }}>
                    JN
                  </Text>
                </View>
              </View>

          {/*Search Bar*/}
          <SearchBar/>
      </ScrollView>
    </SafeAreaView>
  );
}
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { colors, layout} from '.././../constants/theme';
import TabIcon from '../../components/ui/TabIcon';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
        tabBarStyle: Tabstyles.tabBar, 
        headerShown: false, 
        tabBarShowLabel: false, // TabIcon renders its own label
        tabBarItemStyle: { paddingVertical: 16 },      
        }}>
      <Tabs.Screen
        name="live"
        options={{
            title: 'Live',
            tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Live" focused={focused} />
            ),
        }}
        />
        
       <Tabs.Screen
        name="library"
        options={{
            title: 'Library',
            tabBarIcon: ({ focused }) => (
                <TabIcon icon="book" label="Library" focused={focused} />
                ),
            }}
        />

        <Tabs.Screen
        name="prayer"
        options={{
            title: 'Prayer',
            tabBarIcon: ({ focused }) => (
                <TabIcon icon="pulse" label="Prayer" focused={focused} />
                ),
            }}
        />

        <Tabs.Screen
        name="bible-plan"
        options={{
            title: 'Plan',
                tabBarIcon: ({ focused }) => (
            <TabIcon icon="reader" label="Plan" focused={focused} />
            ),
        }}
        />
    </Tabs>
  );
}

const Tabstyles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.surface,
        height: layout.tabBarHeight,
    },
});
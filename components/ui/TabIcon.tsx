// components/ui/TabIcon.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  // pass the FILLED name, e.g. "home" — outline version is derived automatically
  icon: string;
  label: string;
  focused: boolean;
}

export default function TabIcon({ icon, label, focused }: TabIconProps) {
  const color = focused ? theme.colors.navy : theme.colors.grayIcon;
  const iconName = (focused ? icon : `${icon}-outline`) as IoniconName;

  return (
    <View style={[styles.wrapper, focused && styles.wrapperActive]}>
      <Ionicons name={iconName} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {focused && (
        <LinearGradient
          colors={theme.gradient.colors}
          start={theme.gradient.start}
          end={theme.gradient.end}
          style={styles.indicator}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minWidth: theme.layout.tabTapTarget + 16,
    minHeight: theme.layout.tabTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  wrapperActive: {
    backgroundColor: 'rgba(40,72,104,0.08)',
  },
  label: {
    fontFamily: theme.fontFamily.bodySemibold,
    fontSize: theme.fontSize.caption,
  },
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 100,
    marginTop: 1,
  },
});
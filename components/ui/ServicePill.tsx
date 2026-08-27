// ServicePill.tsx
import { View, Text } from 'react-native';
import { useSharedStyles } from "../../constants/styles/sharedStyles";
import { useLiveStyles } from '../../constants/styles/live.styles';
import { theme } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useTheme';

interface ServicePillProps {
  service: {
    id: string;
    day: string;
    time: string;
    name: string;
  };
  isToday: boolean;
}

export const ServicePill = ({ service, isToday }: ServicePillProps) => {
  const sharedStyles = useSharedStyles();
  const liveStyles = useLiveStyles();
  const c = useThemeColors();
  return (
    <View style={[liveStyles.servicePill, isToday && liveStyles.servicePillToday]}>
      <Text style={sharedStyles.overlineText}>{service.day}</Text>
      <Text style={[liveStyles.serviceTime, isToday && liveStyles.serviceTimeToday]}>
        {service.time}
      </Text>
      <Text style={[{ color: c.graySecondary }, isToday && liveStyles.serviceNameToday]}>
        {service.name}
      </Text>
    </View>
  );
};
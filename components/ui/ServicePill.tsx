// ServicePill.tsx
import { View, Text } from 'react-native';
import { sharedStyles } from "../../constants/styles/sharedStyles";
import { liveStyles } from '../../constants/styles/live.styles';
import { theme } from '../../constants/theme';

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
  return (
    <View style={[liveStyles.servicePill, isToday && liveStyles.servicePillToday]}>
      <Text style={sharedStyles.overlineText}>{service.day}</Text>
      <Text style={[liveStyles.serviceTime, isToday && liveStyles.serviceTimeToday]}>
        {service.time}
      </Text>
      <Text style={[{ color: theme.colors.graySecondary }, isToday && liveStyles.serviceNameToday]}>
        {service.name}
      </Text>
    </View>
  );
};
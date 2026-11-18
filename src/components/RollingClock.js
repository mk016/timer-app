import { Text } from 'react-native';

/** The clock string ("12:34"), drawn with tabular digits so it never shifts. */
export default function RollingClock({ value, style }) {
  return <Text style={[style, { fontVariant: ['tabular-nums'] }]}>{value}</Text>;
}

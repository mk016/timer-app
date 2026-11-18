import { Text } from 'react-native';

/** Renders `format(value)`. Kept as a component so callers don't change. */
export default function AnimatedNumber({ value, format = (n) => `${n}`, style }) {
  return <Text style={style}>{format(value)}</Text>;
}

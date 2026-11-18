import { Pressable } from 'react-native';

/** Plain pressable that dims slightly while held. No movement — the UI stays still. */
export default function PressableScale({ children, style, onPress, disabled, hitSlop, ...rest }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={hitSlop} style={({ pressed }) => [style, pressed && { opacity: 0.7 }]} {...rest}>
      {children}
    </Pressable>
  );
}

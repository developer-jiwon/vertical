import { Text, TextProps } from 'react-native';

export function MerriweatherText(props: TextProps & { bold?: boolean; italic?: boolean }) {
  const { style, bold, italic, ...otherProps } = props;
  
  let fontFamily = 'Merriweather_400Regular';
  
  if (bold && italic) {
    // Note: If you need bold italic, you would need to import that specific font variant
    fontFamily = 'Merriweather_700Bold';
  } else if (bold) {
    fontFamily = 'Merriweather_700Bold';
  } else if (italic) {
    fontFamily = 'Merriweather_400Regular_Italic';
  }
  
  return <Text style={[{ fontFamily }, style]} {...otherProps} />;
}

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
} 
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MerriweatherText } from './StyledText';

type ThemedTextType =
  | 'title'
  | 'subtitle'
  | 'default'
  | 'defaultSemiBold'
  | 'defaultBold'
  | 'defaultItalic'
  | 'small'
  | 'smallSemiBold'
  | 'smallBold'
  | 'smallItalic';

export function ThemedText(
  props: TextProps & {
    type?: ThemedTextType;
    lightColor?: string;
    darkColor?: string;
  }
) {
  const { style, lightColor, darkColor, type = 'default', ...otherProps } = props;
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? 'light'].text;

  let textStyle: TextStyle = {};
  let bold = false;
  let italic = false;

  switch (type) {
    case 'title':
      textStyle = styles.title;
      bold = true;
      break;
    case 'subtitle':
      textStyle = styles.subtitle;
      bold = true;
      break;
    case 'defaultSemiBold':
      textStyle = styles.defaultSemiBold;
      bold = true;
      break;
    case 'defaultBold':
      textStyle = styles.defaultBold;
      bold = true;
      break;
    case 'defaultItalic':
      textStyle = styles.defaultItalic;
      italic = true;
      break;
    case 'small':
      textStyle = styles.small;
      break;
    case 'smallSemiBold':
      textStyle = styles.smallSemiBold;
      bold = true;
      break;
    case 'smallBold':
      textStyle = styles.smallBold;
      bold = true;
      break;
    case 'smallItalic':
      textStyle = styles.smallItalic;
      italic = true;
      break;
    default:
      textStyle = styles.default;
  }

  return (
    <MerriweatherText
      style={[textStyle, { color: lightColor || darkColor || color }, style]}
      bold={bold}
      italic={italic}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  defaultItalic: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
  },
  smallSemiBold: {
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  smallItalic: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

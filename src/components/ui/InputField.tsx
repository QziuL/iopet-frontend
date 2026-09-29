import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, BorderRadius, Spacing } from '@/theme';

interface InputFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function InputField({
  label,
  hint,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  multiline,
  placeholderTextColor,
  ...rest
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.state.error
    : focused
    ? Colors.border.primary
    : Colors.border.default;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          multiline ? styles.inputWrapperMultiline : undefined,
          { borderColor },
          focused && styles.inputWrapperFocused,
        ]}
      >
        {leftIcon && (
          <View style={[styles.iconLeft, multiline ? styles.iconLeftMultiline : undefined]}>
            {leftIcon}
          </View>
        )}
        <TextInput
          multiline={multiline}
          placeholderTextColor={placeholderTextColor ?? Colors.text.secondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...rest}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeft : undefined,
            multiline ? styles.inputMultiline : undefined,
            style,
          ]}
        />
        {rightIcon && (
          <View style={[styles.iconRight, multiline ? styles.iconRightMultiline : undefined]}>
            {rightIcon}
          </View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {!error && hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing[1] + 2,
    width: '100%',
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minHeight: 52,
    width: '100%',
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  inputWrapperFocused: {
    backgroundColor: Colors.surface.glass,
  },
  input: {
    flex: 1,
    width: '100%',
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
  },
  inputWithLeft: {
    paddingLeft: Spacing[2],
  },
  iconLeft: {
    paddingLeft: Spacing[4],
  },
  iconLeftMultiline: {
    paddingTop: Spacing[3] + 2,
  },
  iconRight: {
    paddingRight: Spacing[4],
  },
  iconRightMultiline: {
    paddingTop: Spacing[3] + 2,
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.state.error,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
  },
});

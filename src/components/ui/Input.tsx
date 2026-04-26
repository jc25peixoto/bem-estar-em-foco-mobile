import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ style, label, error, ...props }, ref) => {
    return (
      <View style={styles.container}>
        {label && (
          <Typography variant="caption" style={styles.label}>
            {label}
          </Typography>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={tokens.colors.mutedForeground}
          {...props}
        />
        {error && (
          <Typography variant="caption" color="destructive" style={styles.errorText}>
            {error}
          </Typography>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    marginBottom: tokens.spacing.xs,
    color: tokens.colors.foreground,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: tokens.colors.input,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.foreground,
    backgroundColor: tokens.colors.background,
  },
  inputError: {
    borderColor: tokens.colors.destructive,
  },
  errorText: {
    marginTop: tokens.spacing.xs,
  },
});

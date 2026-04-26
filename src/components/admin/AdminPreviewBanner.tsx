import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AdminPreviewBanner() {
  const { isImpersonating, stopImpersonation, effectiveUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isImpersonating) return null;

  return (
    <View style={[styles.container, { top: insets.top || tokens.spacing.md }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Typography variant="caption" weight="bold" color="primaryForeground">
            Modo Visualização
          </Typography>
          <Typography variant="caption" color="primaryForeground" style={{ fontSize: 10 }}>
            Vendo como: {effectiveUser?.name?.split(' ')[0]}
          </Typography>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={stopImpersonation}>
          <Typography variant="caption" weight="bold" color="primary">
            Sair
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    zIndex: 9999, // Fica acima de tudo
  },
  content: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
  },
  button: {
    backgroundColor: tokens.colors.primaryForeground,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
  },
});

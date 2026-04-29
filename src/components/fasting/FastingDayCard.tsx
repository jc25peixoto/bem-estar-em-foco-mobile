import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { tokens } from '../../theme/tokens';
import { DAY_NAMES_SHORT, STATUS_CONFIG, type FastingProtocol, type FastingStatus } from '../../lib/fastingConfig';

interface Props {
  dayOfWeek: number;
  date: Date;
  protocol: FastingProtocol;
  status: FastingStatus;
  isToday: boolean;
  onClick: () => void;
}

export function FastingDayCard({ dayOfWeek, date, protocol, status, isToday, onClick }: Props) {
  const effectiveStatus = protocol.isFree ? 'free' : status;
  const config = STATUS_CONFIG[effectiveStatus];

  const dayNum = date.getDate();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onClick}
      disabled={protocol.isFree}
      style={[
        styles.container,
        isToday ? styles.todayContainer : styles.normalContainer,
        protocol.isFree && styles.freeContainer
      ]}
    >
      <Typography 
        variant="caption" 
        weight="medium"
        style={[styles.dayName, isToday && styles.textPrimary]}
      >
        {DAY_NAMES_SHORT[dayOfWeek]}
      </Typography>

      <Typography 
        variant="h3" 
        style={[styles.dayNum, isToday && styles.textPrimary]}
      >
        {dayNum}
      </Typography>

      <View style={[styles.protocolBadge, protocol.isFree ? styles.badgeFree : styles.badgeNormal]}>
        <Typography 
          style={[styles.protocolText, protocol.isFree ? styles.protocolTextFree : styles.protocolTextNormal]}
        >
          {protocol.label}
        </Typography>
      </View>

      <Typography style={styles.emoji}>
        {config.emoji}
      </Typography>

      {isToday && <View style={styles.todayIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 65,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 35, // large enough for pill shape
    borderWidth: 1.5,
    minHeight: 120,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  normalContainer: {
    borderColor: tokens.colors.border,
  },
  todayContainer: {
    borderColor: tokens.colors.primary,
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  freeContainer: {
    opacity: 0.6,
  },
  dayName: {
    color: tokens.colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  textPrimary: {
    color: tokens.colors.primary,
  },
  protocolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  badgeNormal: {
    backgroundColor: '#DE5D8315', // light pink hex
  },
  badgeFree: {
    backgroundColor: tokens.colors.muted,
  },
  protocolText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  protocolTextNormal: {
    color: tokens.colors.primary,
  },
  protocolTextFree: {
    color: tokens.colors.mutedForeground,
  },
  emoji: {
    fontSize: 16,
  },
  todayIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.primary,
  }
});

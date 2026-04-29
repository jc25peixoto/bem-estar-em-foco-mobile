import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { tokens } from '../../theme/tokens';
import {
  DAY_NAMES_FULL,
  type FastingProtocol,
  type FastingStatus,
  type FastingRecord,
} from '../../lib/fastingConfig';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  dayOfWeek: number;
  protocol: FastingProtocol;
  existingRecord: FastingRecord | null;
  onSave: (data: {
    status: FastingStatus;
    fast_start_time: string | null;
    fast_end_time: string | null;
    fasting_hours: number | null;
    observations: string | null;
  }) => void;
}

export function FastingRegistrationDialog({
  open,
  onOpenChange,
  date,
  dayOfWeek,
  protocol,
  existingRecord,
  onSave,
}: Props) {
  const [status, setStatus] = useState<FastingStatus>(existingRecord?.status || 'pending');
  const [startTime, setStartTime] = useState(existingRecord?.fast_start_time || '');
  const [endTime, setEndTime] = useState(existingRecord?.fast_end_time || '');
  const [observations, setObservations] = useState(existingRecord?.observations || '');

  useEffect(() => {
    if (open) {
      setStatus(existingRecord?.status || 'pending');
      setStartTime(existingRecord?.fast_start_time || '');
      setEndTime(existingRecord?.fast_end_time || '');
      setObservations(existingRecord?.observations || '');
    }
  }, [open, existingRecord]);

  const calculateHours = (): number | null => {
    if (!startTime || !endTime || !startTime.includes(':') || !endTime.includes(':')) {
      return protocol.fastingHours;
    }
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return protocol.fastingHours;

      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;
      if (endMin <= startMin) endMin += 1440; // next day
      return Math.round(((endMin - startMin) / 60) * 10) / 10;
    } catch {
      return protocol.fastingHours;
    }
  };

  const handleSave = () => {
    const hours = calculateHours();
    onSave({
      status,
      fast_start_time: startTime || null,
      fast_end_time: endTime || null,
      fasting_hours: hours,
      observations: observations || null,
    });
    onOpenChange(false);
  };

  const dayNum = date.getDate();
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const statusOptions: { value: FastingStatus; icon: string; label: string; activeColor: string; bgActive: string }[] = [
    { value: 'completed', icon: '✓', label: 'Concluído', activeColor: '#DE5D83', bgActive: '#DE5D8310' },
    { value: 'partial', icon: '!', label: 'Parcial', activeColor: '#DE5D83', bgActive: '#DE5D8310' },
    { value: 'missed', icon: '✕', label: 'Não fiz', activeColor: '#DE5D83', bgActive: '#DE5D8310' },
  ];

  const primaryDark = '#5C3A45'; // dark brownish color from the image text

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView contentContainerStyle={styles.scrollContent}>

            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.titleLeft}>
                  <Typography style={styles.titleIcon}>⏱️</Typography>
                  <Typography variant="h3" style={styles.title}>
                    {DAY_NAMES_FULL[dayOfWeek]}, {dayNum} de {monthNames[date.getMonth()]}
                  </Typography>
                </View>
                <TouchableOpacity onPress={() => onOpenChange(false)} style={styles.closeBtn}>
                  <Typography style={styles.closeIcon}>✕</Typography>
                </TouchableOpacity>
              </View>
              <Typography variant="body" color="mutedForeground" style={styles.subtitle}>
                Protocolo do dia: <Typography style={styles.highlight}>{protocol.label}</Typography> ({protocol.fastingHours}h de jejum)
              </Typography>
            </View>

            <View style={styles.section}>
              <Typography variant="body" weight="semibold" style={[styles.label, { color: primaryDark }]}>
                Como foi seu jejum?
              </Typography>
              <View style={styles.statusGrid}>
                {statusOptions.map((opt) => {
                  const isActive = status === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.7}
                      onPress={() => setStatus(opt.value)}
                      style={[
                        styles.statusCard,
                        isActive && { borderColor: opt.activeColor, backgroundColor: opt.bgActive }
                      ]}
                    >
                      <View style={[styles.iconCircle, isActive && { borderColor: opt.activeColor }]}>
                        <Typography style={[styles.statusIconText, isActive && { color: opt.activeColor }]}>
                          {opt.icon}
                        </Typography>
                      </View>
                      <Typography
                        variant="caption"
                        weight="semibold"
                        style={[{ color: primaryDark }, isActive && { color: opt.activeColor }]}
                      >
                        {opt.label}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Typography variant="body" weight="semibold" style={[styles.label, { color: primaryDark }]}>
                Horários (opcional)
              </Typography>
              <View style={styles.timeGrid}>
                <View style={styles.timeInputBox}>
                  <Typography variant="caption" weight="semibold" style={[styles.timeLabel, { color: primaryDark }]}>
                    Início do jejum
                  </Typography>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.timeInput}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="--:--"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                    <Typography style={styles.inputIcon}>🕒</Typography>
                  </View>
                </View>
                <View style={styles.timeInputBox}>
                  <Typography variant="caption" weight="semibold" style={[styles.timeLabel, { color: primaryDark }]}>
                    Fim do jejum
                  </Typography>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.timeInput}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="--:--"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                    <Typography style={styles.inputIcon}>🕒</Typography>
                  </View>
                </View>
              </View>
              {startTime !== '' && endTime !== '' && (
                <Typography variant="caption" color="mutedForeground" style={{ marginTop: 8 }}>
                  ⏱ Total estimado: <Typography weight="bold">{calculateHours()}h</Typography> de jejum
                </Typography>
              )}
            </View>

            <View style={styles.section}>
              <Typography variant="body" weight="semibold" style={[styles.label, { color: primaryDark }]}>
                Observações (opcional)
              </Typography>
              <TextInput
                style={styles.textArea}
                value={observations}
                onChangeText={setObservations}
                placeholder="Ex: quebrei o jejum mais cedo por conta de..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.saveBtn, status === 'pending' && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={status === 'pending'}
                activeOpacity={0.8}
              >
                <Typography style={styles.saveBtnText}>💾 Salvar</Typography>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: tokens.spacing.md,
  },
  dialog: {
    backgroundColor: '#FCFBF8', // light cream background
    borderRadius: 24,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  titleIcon: {
    fontSize: 20,
  },
  title: {
    color: '#5C3A45', // dark brownish red
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
    color: '#888',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
  },
  highlight: {
    color: '#DE5D83', // primary red/pink
    fontWeight: 'bold',
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  label: {
    marginBottom: tokens.spacing.md,
    fontSize: 14,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    padding: tokens.spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E4DF',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#5C3A45',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5C3A45',
  },
  timeGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  timeInputBox: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: tokens.spacing.sm,
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E4DF',
    borderRadius: 16,
    paddingHorizontal: tokens.spacing.md,
    height: 50,
  },
  timeInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    fontSize: 16,
    marginLeft: tokens.spacing.xs,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E4DF',
    borderRadius: 16,
    padding: tokens.spacing.md,
    color: '#333',
    minHeight: 100,
    fontSize: 15,
  },
  actions: {
    marginTop: tokens.spacing.xs,
  },
  saveBtn: {
    backgroundColor: '#DE5D83',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

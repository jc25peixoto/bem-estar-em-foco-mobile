import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../ui/Typography';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { tokens } from '../../theme/tokens';
import type { MealRecord } from '../../types/meal';
import { MEAL_TYPES, getMealTypeLabel } from '../../lib/mealConfig';

interface MealRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  slotIndex: number;
  existingRecord: MealRecord | null;
  initialMealType?: string;
  onSave: (data: {
    meal_type: string;
    meal_time: string | null;
    fasting_time: string | null;
    description: string | null;
    observations: string | null;
    photoBase64: string | null;
  }) => Promise<void>;
}

export function MealRegistrationDialog({
  open,
  onOpenChange,
  date,
  slotIndex,
  existingRecord,
  initialMealType,
  onSave,
}: MealRegistrationDialogProps) {
  const [mealType, setMealType] = useState<string>(initialMealType || MEAL_TYPES[0].id);
  const [mealTime, setMealTime] = useState('');
  const [fastingTime, setFastingTime] = useState('');
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showMealTypeSelector, setShowMealTypeSelector] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMealType(existingRecord?.meal_type || initialMealType || MEAL_TYPES[0].id);
      setMealTime(existingRecord?.meal_time || '');
      setFastingTime(existingRecord?.fasting_time || '');
      setDescription(existingRecord?.description || '');
      setObservations(existingRecord?.observations || '');
      setImageUri(null);
      setImageBase64(null);
      setSaving(false);
    }
  }, [open, existingRecord, initialMealType]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      meal_type: mealType,
      meal_time: mealTime || null,
      fasting_time: fastingTime || null,
      description: description || null,
      observations: observations || null,
      photoBase64: imageBase64,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setMealTime(`${hours}:${minutes}`);
    }
  };

  const pickFromCamera = async () => {
    setShowPhotoOptions(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const pickFromGallery = async () => {
    setShowPhotoOptions(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria para fazer upload de fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => onOpenChange(false)}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={24} color={tokens.colors.primary} />
              <View>
                <Typography variant="h3">{formattedDate}</Typography>
                <Typography variant="caption" color="mutedForeground">Registrar refeição — Slot {slotIndex}</Typography>
              </View>
            </View>
            <TouchableOpacity onPress={() => onOpenChange(false)} style={styles.closeBtn}>
              <Feather name="x" size={20} color={tokens.colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Tipo de Refeição */}
            <View style={styles.inputGroup}>
              <Typography variant="body" weight="bold" style={styles.label}>Tipo de refeição</Typography>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => setShowMealTypeSelector(true)}
              >
                <Typography variant="body">{getMealTypeLabel(mealType)}</Typography>
                <Feather name="chevron-down" size={18} color={tokens.colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Horário */}
            <View style={styles.inputGroup}>
              <Typography variant="body" weight="bold" style={styles.label}>Horário</Typography>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => setShowTimePicker(true)}
              >
                <Typography variant="body">
                  {mealTime || "Selecione o horário"}
                </Typography>
                <Feather name="chevron-down" size={18} color={tokens.colors.mutedForeground} />
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={(() => {
                    const [h, m] = (mealTime || "00:00").split(':');
                    const d = new Date();
                    d.setHours(parseInt(h || "0"), parseInt(m || "0"), 0, 0);
                    return d;
                  })()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}
            </View>

            {/* Tempo de Jejum */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Typography variant="body" weight="bold" style={styles.label}>Tempo de Jejum</Typography>
                <Typography variant="caption" color="mutedForeground"> (quando se aplica)</Typography>
              </View>
              <TextInput 
                style={styles.pickerTrigger}
                value={fastingTime}
                onChangeText={setFastingTime}
                placeholder="Ex: 14h, 16h30"
                placeholderTextColor={tokens.colors.mutedForeground}
              />
            </View>

            {/* Descrição */}
            <View style={styles.inputGroup}>
              <Typography variant="body" weight="bold" style={styles.label}>Descrição da refeição</Typography>
              <TextInput 
                style={[styles.pickerTrigger, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: 120g de frango grelhado, salada verde, arroz integral..."
                placeholderTextColor={tokens.colors.mutedForeground}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Foto */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="camera" size={16} color={tokens.colors.foreground} style={{ marginRight: 6 }} />
                <Typography variant="body" weight="bold" style={styles.label}>Foto da refeição</Typography>
                <Typography variant="caption" color="mutedForeground"> (opcional)</Typography>
              </View>
              
              <View style={styles.alertBox}>
                <Feather name="info" size={16} color={tokens.colors.primary} style={{ marginTop: 2 }} />
                <Typography variant="caption" style={styles.alertText}>
                  A foto da refeição é muito importante para o acompanhamento nutricional. Ela ajuda na avaliação detalhada da sua alimentação.
                </Typography>
              </View>

              <TouchableOpacity 
                style={styles.photoBox} 
                onPress={() => setShowPhotoOptions(true)}
                activeOpacity={0.7}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" transition={200} />
                ) : (
                  <View style={styles.placeholderBox}>
                    <Feather name="image" size={32} color={tokens.colors.mutedForeground} />
                    <Typography variant="caption" color="mutedForeground" style={{ marginTop: 8 }}>Toque para adicionar foto</Typography>
                  </View>
                )}
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 8 }} onPress={() => { setImageUri(null); setImageBase64(null); }}>
                  <Typography variant="caption" color="destructive">Remover foto</Typography>
                </TouchableOpacity>
              )}
            </View>

            {/* Observações */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Typography variant="body" weight="bold" style={styles.label}>Observações</Typography>
                <Typography variant="caption" color="mutedForeground"> (opcional)</Typography>
              </View>
              <TextInput 
                style={[styles.pickerTrigger, styles.textAreaSmall]}
                value={observations}
                onChangeText={setObservations}
                placeholder="Ex: comi fora de casa, senti muito apetite..."
                placeholderTextColor={tokens.colors.mutedForeground}
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
              onPress={handleSave} 
              disabled={saving}
            >
              <Feather name="save" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Typography variant="body" weight="bold" style={{ color: '#FFF' }}>
                {saving ? "Salvando..." : "Salvar refeição"}
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Meal Type Selector Modal */}
      <Modal visible={showMealTypeSelector} transparent animationType="fade" onRequestClose={() => setShowMealTypeSelector(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMealTypeSelector(false)}>
          <View style={styles.modalContent}>
            <Typography variant="body" weight="bold" style={{ textAlign: 'center', marginBottom: 10 }}>Selecione o tipo de refeição</Typography>
            {MEAL_TYPES.map(type => (
              <TouchableOpacity 
                key={type.id} 
                style={[styles.modalOption, mealType === type.id && styles.modalOptionActive]} 
                onPress={() => { setMealType(type.id); setShowMealTypeSelector(false); }}
              >
                <Typography variant="body" color={mealType === type.id ? 'primaryForeground' : 'foreground'}>{type.label}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Photo Options Modal */}
      <Modal visible={showPhotoOptions} transparent animationType="fade" onRequestClose={() => setShowPhotoOptions(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPhotoOptions(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalOption} onPress={pickFromCamera}>
              <Typography variant="body">Tirar Foto (Câmera)</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={pickFromGallery}>
              <Typography variant="body">Escolher da Galeria</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => setShowPhotoOptions(false)}>
              <Typography variant="body" color="mutedForeground">Cancelar</Typography>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  closeBtn: { padding: 4 },
  scrollContent: { padding: tokens.spacing.md, paddingBottom: 60 },
  inputGroup: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    marginBottom: 6,
    color: tokens.colors.foreground,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    backgroundColor: tokens.colors.card,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: tokens.colors.foreground,
    padding: 0,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  textAreaSmall: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  alertBox: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    backgroundColor: '#FFF5F6',
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 80, 101, 0.1)',
  },
  alertText: {
    flex: 1,
    color: tokens.colors.primary,
    lineHeight: 18,
  },
  photoBox: {
    width: '100%',
    height: 160,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderBox: { alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primary,
    paddingVertical: 16,
    borderRadius: tokens.radius.lg,
    marginTop: tokens.spacing.md,
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: tokens.colors.background,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  modalOption: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.muted,
    alignItems: 'center',
  },
  modalOptionActive: {
    backgroundColor: tokens.colors.primary,
  },
});

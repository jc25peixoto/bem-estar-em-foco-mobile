import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Typography } from './Typography';
import { tokens } from '../../theme/tokens';

interface PhotoUploadCardProps {
  position: 'frente' | 'lado' | 'costas';
  label: string;
  imageUri: string | null;
  onImageSelected: (uri: string | null) => void;
}

export function PhotoUploadCard({ position, label, imageUri, onImageSelected }: PhotoUploadCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  
  const pickFromCamera = async () => {
    setShowOptions(false);
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert("Erro", "Não foi possível abrir a câmera.");
    }
  };

  const pickFromGallery = async () => {
    setShowOptions(false);
    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (libraryPermission.granted === false) {
        Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria para fazer upload de fotos.");
        return;
      }

const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert("Erro", "Não foi possível abrir a galeria.");
    }
  };

  return (
    <>
      <View style={styles.container}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => setShowOptions(true)}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <Typography variant="h3" color="mutedForeground">📸</Typography>
          </View>
        )}
      </TouchableOpacity>
      <Typography variant="caption" weight="medium" style={styles.label}>{label}</Typography>
      {imageUri && (
        <TouchableOpacity onPress={() => onImageSelected(null)} style={styles.removeBtn}>
          <Typography variant="caption" color="destructive">Remover</Typography>
        </TouchableOpacity>
      )}
    </View>
    <Modal
      visible={showOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowOptions(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalOption} onPress={pickFromCamera}>
            <Typography variant="body">Câmera</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={pickFromGallery}>
            <Typography variant="body">Galeria</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={() => setShowOptions(false)}>
            <Typography variant="body" color="mutedForeground">Cancelar</Typography>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
  },
  removeBtn: {
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: tokens.colors.background,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  modalOption: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.muted,
    alignItems: 'center',
  },
});

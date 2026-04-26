import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Typography } from '../../components/ui/Typography';
import { tokens } from '../../theme/tokens';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const IMAGE_MARGIN = tokens.spacing.xs;
const IMAGE_SIZE = (width - tokens.spacing.lg * 2 - IMAGE_MARGIN * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

export function EvolutionScreen() {
  // Mock data for gallery
  const mockPhotos = Array.from({ length: 12 }).map((_, i) => ({
    id: `photo-${i}`,
    url: `https://picsum.photos/seed/${i + 100}/300/400`,
    week: `Semana ${Math.floor(i / 3) + 1}`,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Typography variant="h2">Sua Evolução 📸</Typography>
        <Typography variant="body" color="mutedForeground">
          Acompanhe seu progresso através de fotos.
        </Typography>
      </View>
      
      <ScrollView contentContainerStyle={styles.galleryContent}>
        {/* Simple Grid implementation */}
        <View style={styles.grid}>
          {mockPhotos.map((photo) => (
            <View key={photo.id} style={styles.imageContainer}>
              <Image
                style={styles.image}
                source={{ uri: photo.url }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
              <View style={styles.badge}>
                <Typography variant="caption" color="primaryForeground" style={{ fontSize: 10 }}>
                  {photo.week}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  galleryContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IMAGE_MARGIN,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 1.3, // slight vertical rectangle
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: tokens.colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: tokens.spacing.xs,
    left: tokens.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
});

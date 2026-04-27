import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Typography } from '../../components/ui/Typography';
import { tokens } from '../../theme/tokens';
import { useEffectiveUser } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

type PhotoPosition = 'frente' | 'lado' | 'costas';

type PhotoSet = {
  id: string;
  label: string;
  photos: {
    frente?: string;
    lado?: string;
    costas?: string;
  };
};

function SignedImage({ path, style }: { path?: string, style: any }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    
    // Se já for uma URL completa
    if (path.startsWith('http') || path.startsWith('file://') || path.startsWith('data:')) {
      setUrl(path);
      return;
    }

    async function fetchUrl() {
      const { data } = await supabase.storage.from('user-photos').createSignedUrl(path!, 3600);
      if (active && data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    }
    fetchUrl();

    return () => { active = false; };
  }, [path]);

  if (!url) {
    return (
      <View style={[style, styles.placeholderImage]}>
        <Typography variant="caption" color="mutedForeground">Sem foto</Typography>
      </View>
    );
  }

  return (
    <Image
      style={style}
      source={{ uri: url }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
}

export function EvolutionScreen() {
  const user = useEffectiveUser();
  const [loading, setLoading] = useState(true);
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [activeView, setActiveView] = useState<PhotoPosition>('frente');

  useEffect(() => {
    async function fetchPhotos() {
      if (!user?.id) return;
      setLoading(true);

      const [initRes, weeksRes] = await Promise.all([
        supabase.from('onboarding_initial').select('photos').eq('user_id', user.id).maybeSingle(),
        supabase.from('weekly_records').select('week, photos').eq('user_id', user.id).order('week', { ascending: true })
      ]);

      const newPhotoSets: PhotoSet[] = [];

      if (initRes.data?.photos) {
        newPhotoSets.push({
          id: 'initial',
          label: 'Inicial',
          photos: initRes.data.photos,
        });
      }

      if (weeksRes.data) {
        weeksRes.data.forEach(w => {
          if (w.photos) {
            newPhotoSets.push({
              id: `week-${w.week}`,
              label: `Semana ${w.week}`,
              photos: w.photos,
            });
          }
        });
      }

      setPhotoSets(newPhotoSets);
      setLoading(false);
    }
    
    fetchPhotos();
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Typography variant="h2">Sua Evolução 📸</Typography>
        <Typography variant="body" color="mutedForeground">
          Acompanhe seu progresso através de fotos.
        </Typography>
      </View>

      <View style={styles.tabsContainer}>
        {(['frente', 'lado', 'costas'] as PhotoPosition[]).map(pos => (
          <TouchableOpacity
            key={pos}
            style={[styles.tab, activeView === pos && styles.activeTab]}
            onPress={() => setActiveView(pos)}
          >
            <Typography 
              variant="body" 
              weight={activeView === pos ? "semibold" : "regular"}
              color={activeView === pos ? "primaryForeground" : "foreground"}
              style={{ textTransform: 'capitalize' }}
            >
              {pos}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : photoSets.length === 0 ? (
        <View style={styles.center}>
          <Typography variant="body" color="mutedForeground">Você ainda não enviou fotos.</Typography>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.galleryContent}>
          <View style={styles.grid}>
            {photoSets.map((set) => (
              <View key={set.id} style={styles.imageContainer}>
                <SignedImage
                  path={set.photos[activeView]}
                  style={styles.image}
                />
                <View style={styles.badge}>
                  <Typography variant="caption" color="primaryForeground" style={{ fontSize: 10 }}>
                    {set.label}
                  </Typography>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const IMAGE_MARGIN = tokens.spacing.xs;
const COLUMN_COUNT = 2;
const IMAGE_SIZE = (width - tokens.spacing.lg * 2 - IMAGE_MARGIN * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  tab: {
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.muted,
  },
  activeTab: {
    backgroundColor: tokens.colors.primary,
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
    height: IMAGE_SIZE * 1.5,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: tokens.colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.muted,
  },
  badge: {
    position: 'absolute',
    bottom: tokens.spacing.sm,
    left: tokens.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { AdminStack } from './AdminStack';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { tokens } from '../theme/tokens';
import { AdminPreviewBanner } from '../components/admin/AdminPreviewBanner';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { authReady, currentUser, isAdmin, isImpersonating, setSession, setAuthReady, setCurrentUser, setIsAdmin } = useAuthStore();

  useEffect(() => {
    const fetchAndSetUser = async (session: any) => {
      setSession(session);
      if (!session?.user) {
        setCurrentUser(null);
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_complete, tipo_acesso, full_name, type_profiles(nome)')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (!error && profile) {
          const userRole = Array.isArray(profile.type_profiles) ? profile.type_profiles[0]?.nome : profile.type_profiles?.nome;
          const isAdminRole = profile.tipo_acesso === 2 || userRole === 'admin' || userRole === 'Admin';
          
          setIsAdmin(isAdminRole);
          setCurrentUser({
            id: session.user.id,
            name: profile.full_name || session.user.user_metadata?.full_name || 'Usuária',
            email: session.user.email || '',
            onboardingComplete: profile.onboarding_complete || false,
            tipoAcesso: profile.tipo_acesso || 1,
            weeklyRecords: [] // Mock to satisfy UserData
          });
        } else {
          // Fallback
          const adminRole = session.user.email?.includes('admin') || false;
          setIsAdmin(adminRole);
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || 'Usuária',
            email: session.user.email || '',
            onboardingComplete: false,
            weeklyRecords: []
          });
        }
      } catch (e) {
        console.log('Error fetching profile:', e);
      } finally {
        setAuthReady(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchAndSetUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchAndSetUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    );
  }

  // Define which stack to show
  let content;
  if (!currentUser) {
    content = <Stack.Screen name="AuthStack" component={AuthStack} />;
  } else if (isAdmin && !isImpersonating) {
    content = <Stack.Screen name="AdminStack" component={AdminStack} />;
  } else {
    // Shows AppStack for normal users AND admins who are impersonating
    content = <Stack.Screen name="AppStack" component={AppStack} />;
  }

  return (
    <>
      <AdminPreviewBanner />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {content}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Mock checking for admin
        const adminRole = session.user.email?.includes('admin') || false;
        setIsAdmin(adminRole);
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || 'Usuária',
          email: session.user.email || '',
          onboardingComplete: true,
        });
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const adminRole = session.user.email?.includes('admin') || false;
        setIsAdmin(adminRole);
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || 'Usuária',
          email: session.user.email || '',
          onboardingComplete: true,
        });
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
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
    // Shows AppTabs for normal users AND admins who are impersonating
    content = <Stack.Screen name="AppTabs" component={AppTabs} />;
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

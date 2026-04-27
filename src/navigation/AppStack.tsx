import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabs } from './AppTabs';
import { RegistroSemanalScreen } from '../screens/main/RegistroSemanalScreen';
import { JejumSemanalScreen } from '../screens/main/JejumSemanalScreen';
import { OnboardingScreen } from '../screens/main/OnboardingScreen';
import { useEffectiveUser } from '../stores/useAuthStore';

const Stack = createNativeStackNavigator();

export function AppStack() {
  const user = useEffectiveUser();
  // We check if onboarding is complete. If undefined, assume false.
  const isOnboardingComplete = user?.onboardingComplete ?? false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={AppTabs} />
          <Stack.Screen name="RegistroSemanal" component={RegistroSemanalScreen} />
          <Stack.Screen name="JejumSemanal" component={JejumSemanalScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

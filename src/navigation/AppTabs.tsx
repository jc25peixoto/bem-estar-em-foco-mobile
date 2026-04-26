import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { MealsScreen } from '../screens/main/MealsScreen';
import { EvolutionScreen } from '../screens/main/EvolutionScreen';
import { RankingScreen } from '../screens/main/RankingScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { tokens } from '../theme/tokens';

export type AppTabsParamList = {
  Dashboard: undefined;
  Refeicoes: undefined;
  Evolucao: undefined;
  Ranking: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: tokens.colors.card,
          borderTopColor: tokens.colors.border,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarLabel: 'Início' }} 
      />
      <Tab.Screen 
        name="Refeicoes" 
        component={MealsScreen} 
        options={{ tabBarLabel: 'Refeições' }} 
      />
      <Tab.Screen 
        name="Evolucao" 
        component={EvolutionScreen} 
        options={{ tabBarLabel: 'Evolução' }} 
      />
      <Tab.Screen 
        name="Ranking" 
        component={RankingScreen} 
        options={{ tabBarLabel: 'Ranking' }} 
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Perfil' }} 
      />
    </Tab.Navigator>
  );
}

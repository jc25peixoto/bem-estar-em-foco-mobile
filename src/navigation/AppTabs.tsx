import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { EvolutionScreen } from '../screens/main/EvolutionScreen';
import { JejumSemanalScreen } from '../screens/main/JejumSemanalScreen';
import { RankingScreen } from '../screens/main/RankingScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { tokens } from '../theme/tokens';

export type AppTabsParamList = {
  Dashboard: undefined;
  Evolucao: undefined;
  Jejum: undefined;
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
        options={{ 
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="Evolucao" 
        component={EvolutionScreen} 
        options={{ 
          tabBarLabel: 'Evolução',
          tabBarIcon: ({ color, size }) => <Feather name="trending-up" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="Jejum" 
        component={JejumSemanalScreen} 
        options={{ 
          tabBarLabel: 'Jejum',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="Ranking" 
        component={RankingScreen} 
        options={{ 
          tabBarLabel: 'Ranking',
          tabBarIcon: ({ color, size }) => <Feather name="award" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />
        }} 
      />
    </Tab.Navigator>
  );
}

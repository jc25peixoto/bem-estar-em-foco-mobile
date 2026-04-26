import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashAdminScreen } from '../screens/admin/DashAdminScreen';
import { CrmAlunoScreen } from '../screens/admin/CrmAlunoScreen';

export type AdminStackParamList = {
  DashAdmin: undefined;
  CrmAluno: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashAdmin" component={DashAdminScreen} />
      <Stack.Screen name="CrmAluno" component={CrmAlunoScreen} />
    </Stack.Navigator>
  );
}

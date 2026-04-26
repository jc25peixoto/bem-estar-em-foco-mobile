import React from 'react';
import { View } from 'react-native';
import { Typography } from '../../components/ui/Typography';

export function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="h2">Login</Typography>
    </View>
  );
}

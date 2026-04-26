const fs = require('fs');
const path = require('path');

const screens = {
  'auth/LoginScreen.tsx': 'Login',
  'auth/SignupScreen.tsx': 'Signup',
  'auth/ResetPasswordScreen.tsx': 'Reset Password',
  'auth/OnboardingScreen.tsx': 'Onboarding',
  'main/DashboardScreen.tsx': 'Dashboard',
  'main/MealsScreen.tsx': 'Refeições',
  'main/EvolutionScreen.tsx': 'Evolução',
  'main/RankingScreen.tsx': 'Ranking',
  'main/ProfileScreen.tsx': 'Perfil'
};

Object.entries(screens).forEach(([file, name]) => {
  const fullPath = path.join(__dirname, 'src/screens', file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `import React from 'react';
import { View } from 'react-native';
import { Typography } from '../../components/ui/Typography';

export function ${file.split('/').pop().replace('.tsx', '')}() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="h2">${name}</Typography>
    </View>
  );
}
`);
});
console.log('Screens created!');

// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo'],
  plugins: ['react'],
  rules: {
    // Regra crítica do AGENTS.md para evitar crashes no React Native com &&
    'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary', 'coerce'] }],
  },
};

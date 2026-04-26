# Bem-Estar em Foco - Mobile

Este é o repositório do aplicativo mobile do **Bem-Estar em Foco**, construído inteiramente com **React Native (Expo)**. O projeto migra a experiência da aplicação web para o ecossistema mobile nativo, focado em performance, usabilidade touch e acessibilidade.

## Tecnologias e Arquitetura

O app segue rígidas diretrizes de performance para listas e animações (detalhadas no `AGENTS.md` do repositório), visando os 60 FPS contínuos:

- **Framework:** React Native + Expo
- **Roteamento:** React Navigation (`@react-navigation/native`)
  - `AuthStack`: Fluxo deslogado.
  - `AppTabs`: Fluxo logado (Aluno).
  - `AdminStack`: Fluxo administrativo avançado.
- **Gerenciamento de Estado:** Zustand (para sessão de Autenticação e Impersonation).
- **Backend/Database:** Supabase SDK (compatibilizado via `@react-native-async-storage/async-storage` e `react-native-url-polyfill`).
- **Performance de Listas:** `@legendapp/list` (Virtualização inteligente e reciclagens em listas).
- **Componentes Avançados:** 
  - `react-native-reanimated` (Animações de 120hz no core nativo).
  - `@gorhom/bottom-sheet` (Interações flutuantes naturais).
  - `expo-image` (Cache em disco e memória otimizado).

## Funcionalidades Prontas

1. **Autenticação:** Integração Supabase Auth com persistência nativa.
2. **Dashboard de Aluno:** Gráficos nativos com suporte ao Notch (SafeAreaView).
3. **Tracking & Refeições:** Formulários robustos que não são bloqueados pelo teclado virtual (`KeyboardAvoidingView`).
4. **Módulo CRM Administrativo:** Acesso de alto nível onde o Admin pode acessar e atuar como a aluna (Impersonation Mode) sem sujar o banco de dados e sempre suportado pelo `AdminPreviewBanner`.

## Rodando o Projeto Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o `.env`:**
   Crie um arquivo `.env` na raiz contendo as chaves do Supabase:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=seu_url_aqui
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
   ```

3. **Inicie o servidor do Expo:**
   ```bash
   npm start
   ```

## Boas Práticas Adotadas
- Nunca utilizamos `&&` para checagens de strings e números.
- Todos os estilos usam `StyleSheet.create` ao invés de inline objects.
- `FlashList/LegendList` é o substituto padrão de `FlatList` e `ScrollView` em listas médias/longas.

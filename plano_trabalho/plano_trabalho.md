# Plano de Trabalho: Bem-Estar em Foco Mobile

Este documento estabelece o plano detalhado e estruturado em fases para a recriação do projeto "Bem-Estar em Foco" como um aplicativo nativo para Android e iOS, garantindo alto nível de desempenho e fluidez baseados em padrões de React Native (LegendList, Reanimated, Navigation).

## Fase 1: Inicialização e Setup Arquitetural
**Objetivo:** Estabelecer o repositório base com ferramentas de performance e roteamento configurados.
- [ ] Inicializar o app com Expo (recomendado SDK mais recente).
- [ ] Configurar os serviços essenciais (variáveis de ambiente, inicialização do cliente Supabase).
- [ ] Configurar roteamento nativo: Instalar e configurar `@react-navigation/native`, `@react-navigation/native-stack` e `@react-navigation/bottom-tabs`.
- [ ] Configurar Ferramentas de Performance: `react-native-reanimated` (UI Thread), `react-native-gesture-handler`, e `expo-image`.
- [ ] Configurar o gerenciador de estado e data fetching: Integrar `@tanstack/react-query` e `zustand` (se necessário para substituição de contextos).
- [ ] Estabelecer as regras de Linting do `AGENTS.md` (como o erro para vazamento de renders condicionais `&&`).

## Fase 2: Design System e Componentes Core
**Objetivo:** Criar os building blocks visuais (baseados no Shadcn web) em formato nativo.
- [ ] Definir o arquivo de *Tokens* de Design: Cores (Brand, Neutras, Sucesso, Erro), Tipografia e Espaçamentos (baseados no projeto Web).
- [ ] Desenvolver Componentes Primitivos com Reanimated e StyleSheet:
  - [ ] `Button` (Usando `Pressable` e feedback de animação no eixo de scale).
  - [ ] `Input` (Otimizado como componentes não-controlados ou com debounce para evitar lag).
  - [ ] `Card` (Sombras com Platform.select para iOS vs Android).
  - [ ] `Typography` (Textos consistentes que não causam quebra).
- [ ] Substituir Componentes Complexos Web: Modais nativos e *Bottom Sheets* nativos (`@gorhom/bottom-sheet`) em substituição aos diálogos web.

## Fase 3: Roteamento e Autenticação
**Objetivo:** Garantir o acesso e transição entre telas com segurança.
- [ ] Migrar Contextos de Autenticação e Impersonation (lógica quase idêntica à web).
- [ ] Criar o `AuthStack` (Navegação deslogada):
  - Telas: `Login`, `Signup`, `ResetPassword`, `Onboarding`.
- [ ] Criar o `AppTabs` (Navegação logada do aluno):
  - Bottom Tab bar customizada e com ícones.
  - Abas: Dashboard, Refeições, Evolução, Ranking, Perfil.
- [ ] Proteger o acesso às rotas dependendo do estado global do usuário.

## Fase 4: Telas de Usuário Comum (Alunos)
**Objetivo:** Recriar a experiência principal mantendo a facilidade de interação em touch.
- [ ] **Dashboard (`Dashboard.tsx`):** View base com `ScrollView` e `SafeAreaView`. Adaptação dos gráficos com bibliotecas nativas de chart (`react-native-gifted-charts` ou similar, já que Recharts não roda nativo).
- [ ] **Registro de Refeições e Sintomas:** Telas com foco em forms. Utilização do `KeyboardAvoidingView` e `KeyboardAwareScrollView` para não esconder inputs do usuário.
- [ ] **Ranking:**
  - Migrar listagem para utilizar obrigatoriamente `FlashList` ou `LegendList`.
  - Componentizar as *Rows* do ranking isolando propriedades estáticas.
- [ ] **Evolução / Galeria de Fotos:** Usar `expo-image` para cache e redimensionamento; criar um carrossel / lightbox otimizado para o usuário navegar nas suas fotos.

## Fase 5: Módulo Administrativo e Ferramentas CRM
**Objetivo:** Adaptar o painel para uso esporádico ou gerencial nativo.
- [ ] Estruturar a Pilha Administrativa (`AdminStack`).
- [ ] **DashAdmin e CrmAluno:** Devido à densidade de dados, estas telas requerem máxima atenção à performance. Listagens grandes de alunos **precisam** usar `LegendList`. Componentes de filtro (`FilterBar`) e ordenação devem virar *Bottom Sheets* ou menus nativos, abandonando os comboboxes de web.
- [ ] Revisão do Impersonation (`AdminPreview.tsx`), exibindo o banner flutuante no nível raiz da navegação para alertar os admins e permitir o retorno.

## Fase 6: Polimento, Qualidade e Builds
**Objetivo:** Finalizar UX e preparar para distribuição nas lojas (Play Store / App Store).
- [ ] Verificar aderência às práticas "Strict" do `AGENTS.md`:
  - Varredura por operadores `&&`.
  - Avaliação de memória nas listas e descarte de referências instáveis.
- [ ] Ajustar espaçamentos nativos de SafeArea nos *notches* modernos.
- [ ] Adicionar Splash Screen e Ícone do Aplicativo.
- [ ] Builds de teste com Expo EAS (TestFlight/Internal App Sharing) para aprovação de performance em dispositivos físicos.

# Relatório de Avaliação: Bem-Estar em Foco (Web para Mobile)

Este relatório detalha a avaliação da base de código Web do projeto `bem-estar-em-foco` e descreve a estratégia, as lacunas e as melhores práticas para convertê-lo em um aplicativo nativo robusto (iOS e Android), utilizando os guias de desenvolvimento e design em React Native (`react-native-skills`, `react-native-best-practices`, `react-native-design`).

## 1. Visão Geral da Arquitetura Atual (Web)

O projeto original `bem-estar-em-foco` foi construído com foco em ambiente Web:
- **Core:** React 18, Vite.
- **Estilização:** Tailwind CSS combinado com componentes Shadcn UI (Radix UI).
- **Roteamento:** `react-router-dom` (Rotas declarativas em navegador).
- **Gerenciamento de Estado/Dados:** `@tanstack/react-query`, Contextos React e `@supabase/supabase-js`.
- **Formulários e Validação:** `react-hook-form` e `zod`.

### 1.1 Incompatibilidades com o Ambiente Nativo
A maior parte do esforço de reescrita será concentrada na camada de visualização e navegação:
- Elementos HTML (`<div>`, `<span>`, `<form>`, `<img>`) **não existem** no React Native e devem ser convertidos para `<View>`, `<Text>`, `<Pressable>`, `<Image>` (ou `expo-image`).
- O pacote Radix UI, que alimenta o Shadcn, foca exclusivamente na DOM. Não funcionará. Teremos que substituir os componentes primitivos por equivalentes nativos (Ex: *Bottom Sheets* nativos no lugar de modais JS puros, Menus contextuais nativos).
- O roteamento via `react-router-dom` precisará ser inteiramente reescrito utilizando o `React Navigation` (Stack e Bottom Tabs).

## 2. Recomendações Críticas de Performance e Design (Skills)

Baseado nas guidelines fornecidas, a migração deverá seguir regras rígidas desde o início para evitar gargalos e quedas de quadros (FPS):

### 2.1 Renderização de UI (Core Rendering)
- **Strings e Textos:** Diferente da Web, qualquer texto deve obrigatoriamente estar envolvido num componente `<Text>`. Falhar nisso causa `runtime crash` no app.
- **Renderizações Condicionais:** Substituir o uso da sintaxe lógica `&&` (ex: `count && <Component />`) que causa crash no RN caso seja *falsy*, por operadores ternários (`count ? <Component /> : null`) ou retorno antecipado.
- **Áreas Seguras:** Em dispositivos móveis (especialmente iPhones com Notch/Dynamic Island), devemos aplicar amplamente `SafeAreaView` e tratar o *contentInsetAdjustmentBehavior* em áreas com scroll.

### 2.2 Desempenho em Listagens (List Performance)
O projeto Web contém módulos pesados de listagem (ex: `DashAdmin.tsx`, `Ranking.tsx`, `RegistroSemanal.tsx`).
- **Proibido ScrollView com `.map()`:** O aplicativo nativo não pode renderizar listas longas via ScrollView e `map`. Deverá ser utilizado obrigatoriamente o `LegendList` ou `FlashList`.
- **Referências Estáveis:** Em listas grandes (como a de admin), as propriedades enviadas para os cards não podem ser declaradas *inline*. Objetos devem manter as referências para otimizar o reaproveitamento e reciclagem dos itens.

### 2.3 Estilização e Design System
A adaptação das telas precisará respeitar o visual existente, porém otimizando para os fluxos móveis:
- **Tailwind x StyleSheet:** É recomendável transcrever as regras do Tailwind presentes no Shadcn Web para o `StyleSheet` nativo (Flexbox), utilizando tokens centralizados para manter a identidade visual do app. Alternativamente, adotar o *NativeWind* caso a equipe precise manter a paridade com as classes CSS, porém com ressalvas de perfomance.
- **Interações Nativas (Design):** Substituir as interações de *hover* da web por respostas de *feedback tátil* no mobile usando `Pressable` em conjunto com a API do `Reanimated 3` para micro-animações (ex: diminuir escala ao ser pressionado).
- **Imagens:** Listagens complexas (ex: Galeria, Evolução) deverão substituir as tags de imagem web pela biblioteca nativa otimizada `expo-image` para utilizar o cache agressivo e as requisições de thumbnail sob demanda.

### 2.4 Gerenciamento e Data Fetching
- A lógica de banco de dados e as *Queries* do `react-query` (`useQuery`, `useMutation`) e o Supabase Client já são independentes da plataforma. Essa camada (presente em `hooks/`, `lib/`, `contexts/`) pode ser copiada quase integralmente para o mobile, economizando muito tempo.

## 3. Conclusão da Avaliação

O projeto Web está estruturado de maneira profissional (separando lógicas de contexto, serviços de API e componentes de UI), o que torna a migração em nível de negócio muito previsível. O grande trabalho estará em converter os 17 arquivos de página (`pages/`) e os dezenove diretórios de componentes (`components/`) para usar as APIs nativas de UI, garantindo interações a 60 fps, navegação baseada em pilha/tabs e listas virtualizadas de alto desempenho.

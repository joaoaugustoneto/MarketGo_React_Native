# Relatório de Resolução de Problemas e Soluções Implementadas

Este documento serve como um registro técnico das dificuldades encontradas durante o desenvolvimento do aplicativo **MarketGo**, desenvolvido com React Native, Expo, TypeScript e Supabase. O objetivo é detalhar os erros, as interações com a Inteligência Artificial (prompts e respostas) e as exatas modificações de código realizadas para garantir a continuidade e estabilidade do projeto.

---

### 1. Etapa 6: Conflito de Execução do Jest com ES Modules (Testes do Supabase)

#### Descrição do Erro

Ao final da Etapa 6 do guia de desenvolvimento, o comando `npm run test:app` foi executado para rodar a suíte de testes do frontend. No entanto, o terminal retornou o seguinte erro crítico, interrompendo a execução:

```text
FAIL supabase/tests/db.test.mjs
  ● Test suite failed to run

    Must use import to load ES Module: .../marketgo/supabase/tests/db.test.mjs

    The file contains ESM syntax (import/export) that could not be executed as CommonJS.
```

**Análise Técnica:**
O erro ocorreu porque o comando executava o Jest na raiz do projeto sem filtros rigorosos de diretório. Com isso, o Jest tentou ler e executar o arquivo `supabase/tests/db.test.mjs`. Como este arquivo foi escrito utilizando a sintaxe de ES Modules (`.mjs`) para ser executado com o _test runner_ nativo do Node.js (`node --test`), o Jest (configurado por padrão para CommonJS no ambiente Expo) falhou ao tentar interpretá-lo.

#### Prompt Utilizado

> "Ocorreu um erro ao executar `npm run test:app`. O terminal exibe 'Must use import to load ES Module' no arquivo `supabase/tests/db.test.mjs` e informa que a suíte de testes falhou. Como resolvo esse conflito?" (Juntamente com o envio da captura de tela do terminal `image_a8bc81.png`).

#### Resposta da IA (Síntese)

A IA diagnosticou prontamente o conflito de ambientes de teste. A explicação técnica foi de que o projeto possui duas camadas de testes distintas:

1.  **Frontend (App):** Executado pelo Jest (arquivos `.test.ts`).
2.  **Backend/Banco de Dados:** Executado nativamente pelo Node.js com PGlite (arquivos `.test.mjs`).

A solução proposta foi instruir o Jest a ignorar explicitamente a pasta do Supabase durante a sua execução, isolando os ambientes.

#### Como a Solução foi Implementada

Para corrigir o comportamento do Jest, o arquivo de configuração raiz do projeto (`package.json`) foi modificado. Foi adicionada a propriedade `testPathIgnorePatterns` dentro do bloco de configuração do `"jest"`.

**Código Adicionado no `package.json`:**

```json
  "jest": {
    "preset": "jest-expo",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    "testPathIgnorePatterns": [
      "/node_modules/",
      "/supabase/"
    ]
  }
```

#### Resultado

Após a implementação e salvamento do `package.json`, os comandos de teste passaram a funcionar de forma independente e com sucesso:

- A execução de `npm run test:app` ignorou a pasta `/supabase/`, focando apenas nas lógicas do React Native, resultando em **37 testes passando**.
- A execução de `npm run test:db` manteve seu funcionamento esperado, utilizando o Node para testar as regras de banco via PGlite, resultando em **13 testes passando**.

---

### 2. Etapa 8: Falha de Importação no StateViews (Nome Incorreto do Arquivo de Ícones)

#### Descrição do Erro

No início da Etapa 8 (Design system: componentes de interface), ao construir e compilar o componente `src/components/StateViews.tsx`, o arquivo não conseguia importar o utilitário de ícones a partir de `@/utils/icons`.

**Análise Técnica:**
O arquivo de ícones criado na Etapa 5 havia sido nomeado por engano com dois pontos antes da extensão (`icons..ts` / `icons..tsx`). Dessa forma, a resolução de módulos do TypeScript e do bundler não encontrava o arquivo esperado em `src/utils/icons.ts`, impedindo a importação correta de tipos como `IconName`.

#### Como a Solução foi Implementada

A correção foi realizada diretamente no sistema de arquivos através da renomeação do arquivo, retirando o ponto extra:
- De: `src/utils/icons..ts`
- Para: `src/utils/icons.ts`

Essa correção foi versionada e registrada no commit `2a531b9` (*"feat: Etapa 8 - Concluída, Componentes feitos"*).

#### Resultado

Após a renomeação, o caminho `@/utils/icons` passou a ser resolvido normalmente pelo TypeScript e pelo ambiente Expo, permitindo que o `StateViews.tsx` e os demais componentes utilizassem os ícones e a tipagem sem erros.

---

### 3. Etapa 10: Incompatibilidade de Tipagem em `app/(app)/(tabs)/_layout.tsx` (`ColorValue` vs `Ionicons`)

#### Descrição do Erro

Durante a execução da verificação estática de tipos (`pnpm run typecheck`) na Etapa 10, o TypeScript acusou o seguinte erro em `app/(app)/(tabs)/_layout.tsx`:

```text
app/(app)/(tabs)/_layout.tsx(10,39): error TS2322: Type '____ColorValue_Internal' is not assignable to type 'string | NativeColorValue | undefined'.
  Type 'null' is not assignable to type 'string | NativeColorValue | undefined'.
```

**Análise Técnica:**
O guia especifica a assinatura da função auxiliar de ícones como `({ color, size }: { color: ColorValue; size: number })`. No entanto, no React Native 0.88, o tipo `ColorValue` admite `null` (via `____ColorValue_Internal`), enquanto o prop `color` do componente `<Ionicons />` do `@expo/vector-icons` aceita apenas `string | undefined`. Como a tipagem estrita do TypeScript (`strict: true`) impede a atribuição de um valor potencialmente `null` a uma propriedade que exige `string`, a compilação falhava.

#### Como a Solução foi Implementada

No arquivo `app/(app)/(tabs)/_layout.tsx`, manteve-se o parâmetro compatível com o Expo Router (`color: ColorValue`), convertendo com asserção de tipo segura ao repassar ao componente do ícone (`color as string`):

```tsx
function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
}
```

#### Resultado

A verificação de tipos (`pnpm run typecheck`) foi executada novamente e concluída com **código 0 e nenhum erro encontrado**.

---

### 4. Etapa 14: Falha no Script Prettier por Caminho Inexistente (`package.json`)

#### Descrição do Erro

Durante a execução das verificações automáticas de qualidade da Etapa 14.1 com o comando `pnpm run format`, o Prettier encerrou com erro:

```text
[error] No files matching the pattern were found: "tests".
 ELIFECYCLE  Command failed with exit code 2.
```

**Análise Técnica:**
O script `"format"` no `package.json` estava configurado como `"prettier --write app src tests supabase/tests"`. No entanto, a pasta de testes unitários do Jest no projeto é nomeada como `__tests__` (com dois underlines no início e fim). O Prettier, ao não encontrar nenhuma pasta chamada `tests`, interrompeu o processo com código de erro.

#### Como a Solução foi Implementada

O arquivo `package.json` foi ajustado no campo `scripts.format` para apontar corretamente para a pasta `__tests__`, exatamente como especificado no Código 1 do guia:

```json
"format": "prettier --write app src __tests__ supabase/tests"
```

#### Resultado

O comando `pnpm run format` passou a executar perfeitamente, formatando todos os arquivos das pastas `app`, `src`, `__tests__` e `supabase/tests`.

---

### 5. Etapa 14: Incompatibilidade de Tipo no `RefreshControl` (`onRefresh={refetch}`)

#### Descrição do Erro

Na verificação estática com `pnpm run typecheck` da Etapa 14.1, foram apontados erros nas telas `app/(app)/(tabs)/index.tsx` e `app/(app)/(tabs)/orders.tsx`:

```text
error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: RefreshControlProps): RefreshControl', gave the following error.
    Type '(options?: RefetchOptions | undefined) => Promise<QueryObserverResult<...>>' is not assignable to type '() => void | Promise<void>'.
```

**Análise Técnica:**
A propriedade `onRefresh` do `RefreshControl` (React Native) exige um callback que devolva `void` ou `Promise<void>`. Contudo, o método `refetch` do TanStack Query v5 retorna uma `Promise<QueryObserverResult<TData, TError>>`. Pela checagem estrita de tipos do TypeScript, uma Promise que resolve um objeto complexo não é diretamente compatível com `Promise<void>`.

#### Como a Solução foi Implementada

Em `app/(app)/(tabs)/index.tsx` e `app/(app)/(tabs)/orders.tsx`, o callback foi envolvido em uma função anônima que descarta o valor de retorno da Promise, garantindo retorno `void`:

```tsx
refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
```

#### Resultado

A suíte completa de verificação da Etapa 14 (`pnpm run typecheck`, `pnpm test` e `pnpm run format`) passou a rodar com **100% de sucesso**.

---

### 6. Etapa 14.3: Erro no Login e Cadastro ("Invalid path specified in request URL")

#### Descrição do Erro

Durante o teste manual no celular (roteiro da Etapa 14.3), ao submeter o formulário de login ou cadastro, a interface exibia a seguinte mensagem em vermelho:

```text
Invalid path specified in request URL
```

Impossibilitando a criação de conta ou autenticação de usuários.

#### Análise Técnica

O erro originou-se na configuração da variável de ambiente `EXPO_PUBLIC_SUPABASE_URL` no arquivo `.env`. Em vez da URL base do projeto, foi copiado acidentalmente o endpoint da API REST:

```text
# Incorreto:
EXPO_PUBLIC_SUPABASE_URL=https://<id>.supabase.co/rest/v1/
```

O cliente do Supabase (`@supabase/supabase-js`) espera apenas a URL raiz (`https://<id>.supabase.co`). Quando métodos de autenticação como `supabase.auth.signInWithPassword` ou `signUp` eram chamados, o cliente anexava o caminho do serviço de autenticação (`/auth/v1/...`) após a URL base, gerando uma URL malformada com duplo caminho:

```text
https://<id>.supabase.co/rest/v1/auth/v1/token
```

O API Gateway do Supabase não reconhece esse caminho e respondeu com `404 - Invalid path specified in request URL`.

#### Como a Solução foi Implementada

1. O arquivo `.env` foi corrigido removendo o sufixo `/rest/v1/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xwkjusugsmpuukutqjcr.supabase.co
```

2. Foi orientado o reinício do servidor Expo com cache limpo:

```bash
npx expo start -c
```

#### Resultado

Com a URL base correta, as requisições de autenticação passaram a ser enviadas para o endpoint correto (`/auth/v1/token`), restabelecendo o funcionamento do cadastro e do login.





---

### 7. Resolução de Dependências do Jest com pnpm (`@babel/runtime`) e Reinício Limpo do Expo

#### Descrição do Erro

Durante a reinstalação e limpeza das dependências com o gerenciador de pacotes `pnpm`, ao rodar os testes com `pnpm test`, o Jest falhou na inicialização dos testes com o seguinte erro de resolução de módulos:

```text
Cannot find module '@babel/runtime/helpers/interopRequireDefault'
```

Além disso, durante tentativas de remoção da pasta `node_modules`, o Windows retornava erro de permissão (`EPERM: operation not permitted`) devido a processos em segundo plano do Node.js (`expo start`) travando arquivos em cache.

#### Análise Técnica

O `pnpm` adota uma arquitetura de armazenamento global com links simbólicos (*symlinks*) e isolamento rígido de dependências transitivas. Enquanto o npm tradicional achata (*hoisting*) todas as subdependências na raiz do `node_modules`, o pnpm só disponibiliza na raiz os pacotes explicitamente declarados no `package.json`. O `babel-jest` necessita internamente do `@babel/runtime` para importar os *helpers* de compilação; ao não encontrá-lo como dependência direta, o módulo falhava em tempo de execução dos testes.

#### Como a Solução foi Implementada

1. Os processos órfãos do Node que bloqueavam os arquivos foram identificados e encerrados.
2. O `@babel/runtime` foi adicionado como dependência de desenvolvimento no projeto via `pnpm`:
   ```bash
   pnpm add -D @babel/runtime
   ```
3. As dependências foram reinstaladas de forma limpa com `pnpm install`.
4. O servidor de desenvolvimento do Expo foi iniciado com a flag de limpeza de cache:
   ```bash
   pnpm expo start -c
   ```

#### Resultado

A suíte de testes passou a rodar com 100% de sucesso sem qualquer erro de resolução de dependências no Jest, e o servidor Metro passou a responder de forma estável na porta 8081.

---

### 8. Implementação dos Desafios de Evolução do Apêndice C (Nível Iniciante)

Conforme os desafios propostos no Apêndice C do guia (Página 103), foram implementadas todas as funcionalidades de nível iniciante:

#### 8.1. Desafio 1: Integração Contínua com GitHub Actions

- **Arquivo:** `.github/workflows/ci.yml`
- **Descrição:** Pipeline automatizada de CI que dispara a cada `push` ou `pull request` direcionado para a branch `main`.
- **Etapas da Pipeline:**
  1. Checkout do código fonte.
  2. Instalação e configuração do `pnpm` v10.
  3. Configuração do ambiente Node.js 22 com cache de dependências do pnpm.
  4. Instalação determinística de dependências (`pnpm install --frozen-lockfile`).
  5. Verificação estática de tipos (`pnpm run typecheck`).
  6. Checagem de formatação de código (`pnpm run format -- --check`).
  7. Execução de todos os testes unitários e de banco de dados (`pnpm test`).

#### 8.2. Desafio 2: Avaliação do Pedido (1 a 5 Estrelas) após a Entrega

- **Banco de Dados e RLS (`supabase/schema.sql`):**
  - Criação da tabela `public.order_reviews` com campos: `id`, `order_id` (único, garantindo apenas uma avaliação por pedido), `user_id`, `rating` (inteiro de 1 a 5 com `check constraint`), `comment` e `created_at`.
  - Habilitação de Row Level Security (RLS) com duas políticas restritas:
    - Leitura: o usuário só pode consultar as avaliações dos seus próprios pedidos (`auth.uid() = user_id`).
    - Inserção: o usuário só pode criar uma avaliação se for o dono do pedido e **se o pedido estiver estritamente com status `delivered`** (`status = 'delivered'`).
- **Testes do Banco no PGlite (`supabase/tests/db.test.mjs`):**
  - Adicionado novo bloco de teste unitário verificando que pedidos em status anterior (`received`) não aceitam avaliação, que outros usuários não conseguem avaliar pedidos alheios, que o dono avalia com sucesso após o status `delivered`, e que tentativas de avaliação duplicada são rejeitadas.
  - A suíte de testes de banco subiu para **14 testes passando**.
- **Tipagem TypeScript (`src/types/index.ts`):**
  - Interfaces `OrderReview` e `CreateOrderReviewInput`.
- **Serviços e Hooks TanStack Query (`src/services/orders.ts` e `src/hooks/useOrders.ts`):**
  - Funções `getOrderReview` e `createOrderReview`.
  - Hooks `useOrderReview` e `useCreateOrderReview` com invalidação de cache automática.
- **Componente de Interface (`src/components/StarRating.tsx`):**
  - Componente de estrelas interativo e acessível com suporte a seleção de 1 a 5 estrelas e modo somente leitura (`readOnly`).
- **Tela de Detalhes do Pedido (`app/(app)/order/[id].tsx`):**
  - Quando o pedido atinge o status de `delivered`, um cartão de avaliação é renderizado. Se o pedido ainda não foi avaliado, exibe o seletor de estrelas, campo de comentário opcional e botão "Enviar avaliação". Caso já tenha sido avaliado, exibe a nota e o comentário gravados.

---

### 9. Etapa 15: Documentação (README), Vitrine de Imagens e Build Android (APK)

#### 9.1. README.md e Pasta de Imagens (`docs/`)

- Foi criado o `README.md` na raiz e na pasta do projeto seguindo a estrutura completa do guia oficial (Código 66).
- Criada a pasta `docs/` para inclusão das capturas de tela do app (`lojas.png`, `cardapio.png`, `carrinho.png`, `pedido.png`), com espaço reservado e tabela explicativa.

#### 9.2. Configuração do EAS Build para Geração de APK Android (`eas.json`)

- O perfil `preview` do arquivo `marketgo/eas.json` foi ajustado especificando:
  - `"android": { "buildType": "apk" }`: Gera diretamente o arquivo `.apk` instalável no celular sem exigir publicação na Google Play Store.
  - Variáveis de ambiente embarcadas: `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY` configuradas no perfil, garantindo que a compilação em nuvem do EAS contenha a conexão ativa com o backend Supabase.

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




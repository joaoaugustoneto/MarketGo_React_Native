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

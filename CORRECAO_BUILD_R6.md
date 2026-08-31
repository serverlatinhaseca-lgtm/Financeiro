# Correção de build R6

O build R5 avançava até a análise de referências do servidor, mas falhava porque `CODIGO_FONTE_COMPLETO.zip` não continha dois módulos-base referenciados pelos componentes shadcn:

- `lib/utils.ts`
- `hooks/use-mobile.ts`

A R6 inclui os dois arquivos e adiciona `tests/alias-imports.test.mjs`, que percorre os fontes e falha se qualquer import `@/...` apontar para um arquivo ausente. A varredura antes do empacotamento encontrou 0 aliases ausentes.

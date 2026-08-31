# Relatório de validação — 31/08/2026

## PASSOU
- Compilação sintática do backend Python (`main.py` e `reset_admin.py`).
- Verificação sintática do `frontend/runtime-server.mjs`.
- Verificação sintática do bundle servido `frontend/dist/server/index.js`.
- Teste `rendered-html.test.mjs` corrigido para apontar para o artefato real e aprovado (1/1).
- Frontend pré-compilado respondeu HTTP 200 e retornou o título `Gestão Operacional`.
- Estrutura do pacote contém backend, frontend pré-compilado, código-fonte, Docker, Nginx e instalador.

## CORRIGIDO DURANTE A AUDITORIA
- Teste de HTML apontava incorretamente para `frontend/source/dist`; corrigido para `frontend/dist`.

## LIMITAÇÕES DESTE AMBIENTE
- O diretório `frontend/source/node_modules` não está incluído; portanto os testes que dependem de Vite/TypeScript/React não puderam ser executados aqui sem baixar dependências externas.
- Não foi possível executar o stack Docker completo neste ambiente de auditoria.
- Testes de CEP/CNPJ/geocodificação dependem de serviços externos e devem ser validados no servidor com acesso à internet.

Este relatório não afirma validação funcional completa de todos os fluxos. Ele registra apenas os testes realmente executados nesta versão.

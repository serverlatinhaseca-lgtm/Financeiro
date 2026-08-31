# Validação das correções — 31/08/2026

Esta revisão muda o fluxo de publicação para impedir que código-fonte novo seja entregue junto com um `dist` antigo.

## Mudança estrutural obrigatória

- `frontend/dist` antigo foi removido do pacote.
- `frontend/CODIGO_FONTE_COMPLETO.zip` contém a fonte corrigida desta revisão.
- `frontend/Dockerfile` extrai essa fonte, executa `npm ci`, compila com `vinext build` e só finaliza a imagem após os testes automatizados.
- O `.dockerignore` não exclui mais o ZIP da fonte.
- Nginx envia `Cache-Control: no-store` para evitar que o navegador continue mostrando uma versão anterior após atualização.

## Correções verificadas por contrato automatizado

10/10 verificações das últimas solicitações passaram localmente:

1. Tema claro: laranja + azul-marinho + bege da marca; dark mode em roxos profundos.
2. Score inicial 1000 + cálculo de penalidades financeiras + explicação do score.
3. Mapa sem coordenadas fictícias, com geocodificação, localização de paradas, recomendação e linha animada.
4. Planner operacional compacto com modal de detalhes.
5. Gerador de documentos com snapshot, histórico e preview, sem redirecionar para página vazia.
6. Busca global e login por usuário ou e-mail.
7. Camada visual profissional global e breakpoints para uso em zoom 100%.
8. Consulta de CEP/CNPJ e CRUD de grupos.
9. Operações críticas da Central de Rotas presentes na interface.
10. Remoção da aba redundante de importação de clientes.

## Outras verificações executadas

- `python -m py_compile` no backend e reset administrativo: aprovado.
- `bash -n install.sh`: aprovado.
- Integridade de `CODIGO_FONTE_COMPLETO.zip`: aprovada.
- Inspeção do ZIP final confirma que a fonte empacotada contém as correções, e não somente a pasta de trabalho.

## Validação durante instalação

A construção da imagem do frontend executa também todos os testes existentes em `tests/*.test.mjs` após o build. Se a compilação ou qualquer teste falhar, o Docker não conclui a imagem do frontend.

Observação: o ambiente de criação deste pacote não conseguiu acessar `registry.npmjs.org` (erro DNS `EAI_AGAIN`), portanto não foi possível repetir aqui o download das dependências e o build Vinext. Por isso o build/teste completo foi transformado em etapa obrigatória do Dockerfile, evitando publicar silenciosamente uma versão antiga caso a compilação não aconteça.

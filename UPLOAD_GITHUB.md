# Versão pronta para upload manual no GitHub

Esta distribuição foi reduzida para ficar abaixo do limite de arquivos do upload manual do GitHub.

## Frontend
O container de produção usa somente:
- `frontend/dist/`
- `frontend/runtime-server.mjs`
- `frontend/Dockerfile`

A pasta de desenvolvimento `frontend/source/` foi removida desta distribuição porque não é usada pelo Docker em produção e elevava a quantidade de arquivos.

O código-fonte completo continua arquivado em:
- `frontend/CODIGO_FONTE_COMPLETO.zip`

## Atualização no servidor
Após enviar os arquivos ao repositório:

```bash
cd ~/Financeiro
git pull
chmod +x install.sh
./install.sh
```

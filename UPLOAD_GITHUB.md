# Upload manual para GitHub

Esta distribuição foi reduzida para upload manual e NÃO contém `node_modules` nem um `dist` antigo.

1. Extraia este ZIP.
2. Envie o conteúdo da pasta extraída para o repositório, preservando as pastas.
3. Confirme que `frontend/CODIGO_FONTE_COMPLETO.zip` foi enviado. Ele é necessário para construir o frontend novo.
4. No servidor:

```bash
cd ~/Financeiro
git pull
chmod +x install.sh
./install.sh
```

O instalador construirá o frontend a partir da fonte corrigida e não reutilizará a interface pré-compilada das entregas anteriores.

Se quiser acompanhar a compilação:

```bash
docker compose --progress plain build frontend
```

O build só termina se `vinext build` e os testes automatizados passarem.

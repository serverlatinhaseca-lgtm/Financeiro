# Instalação por SSH

O projeto deve ser instalado pelo `install.sh`. Não use `docker compose up -d --build` diretamente: o instalador verifica o Buildx, recupera cache Docker corrompido, sincroniza credenciais e só então inicia os serviços.

## Primeira instalação

```bash
cd ~/Financeiro
git pull
chmod +x install.sh scripts/*.sh
./install.sh
```

O instalador cria o `.env`, constrói as imagens, inicia PostgreSQL, API, frontend e Nginx, aguarda os testes de saúde e exibe o endereço e o acesso inicial.

## Atualização de uma instalação existente

```bash
cd ~/Financeiro
git pull
chmod +x install.sh scripts/*.sh
./install.sh
```

O banco e os uploads são preservados.

## Corrigir a senha do administrador

Se o login retorna `401` ou o `.env` foi substituído, execute:

```bash
./install.sh --reset-admin-password
```

Esse comando sincroniza o usuário `admin` com `ADMIN_EMAIL` e `ADMIN_PASSWORD` sem apagar os demais usuários ou dados.

## Verificação

```bash
docker compose ps
curl -s http://localhost/api/health
```

A API deve responder `{"status":"ok"}` e todos os serviços devem estar ativos ou saudáveis.

## Importante

- Não execute `docker compose down -v`: a opção `-v` apaga o banco e os uploads.
- Não execute `npm audit fix --force`: isso pode introduzir versões incompatíveis.
- O aviso `invalid tar header` ou `gzip: invalid checksum` é tratado pelo instalador com Buildx e uma reconstrução limpa.
- Se o servidor não permitir `sudo`, peça ao administrador para instalar `docker-buildx-plugin` uma única vez.

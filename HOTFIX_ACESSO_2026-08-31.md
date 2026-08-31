# HOTFIX DE ACESSO — 31/08/2026

Esta revisão corrige o problema em que o sistema podia subir, porém o usuário não conseguia entrar.

## Correções

- Login agora aceita **nome de usuário ou e-mail** no mesmo campo.
- `admin` e o valor configurado em `ADMIN_EMAIL` funcionam com a mesma senha administrativa.
- O instalador sincroniza o administrador com `ADMIN_PASSWORD` em toda atualização, sem apagar o banco.
- O instalador testa `/api/health`, a página inicial e o login real antes de informar sucesso.
- Migração de usuários antigos protegida contra nomes de usuário duplicados gerados a partir do prefixo do e-mail.
- Caso o login não funcione, o `install.sh` falha explicitamente em vez de concluir uma instalação aparentemente saudável.

## Acesso administrativo

Após executar `./install.sh`, use:

- Usuário: `admin`
- ou e-mail: valor de `ADMIN_EMAIL` no `.env`
- Senha: valor de `ADMIN_PASSWORD` no `.env`

Para consultar sem alterar:

```bash
grep -E '^(ADMIN_EMAIL|ADMIN_PASSWORD)=' .env
```

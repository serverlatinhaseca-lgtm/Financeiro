# Gestão Operacional

Sistema web integrado e personalizável para centralizar clientes, financeiro, cobranças, tarefas, bases de rotas, documentos e gestão de acesso. Os módulos são áreas completas, com painéis, calendários, abas operacionais, histórico, regras e relatórios — não são apenas itens isolados do menu.

## O que está incluído

- Dashboard operacional com indicadores e prioridades do dia.
- Administração completa de usuários e perfis, com criação, edição, ativação, exclusão e matriz de permissões por módulo e ação.
- Módulos ativáveis, renomeáveis e associados aos perfis pelo administrador.
- Personalização de nome do sistema, títulos, logos, fundo de login, miniatura, cores, densidade, arredondamento, empresas, assinaturas, carimbos e dados bancários.
- Cadastro unificado de clientes, perfil, score, métricas, tags e regras financeiras.
- Contas a emitir com emissão manual, adiantamento registrado, múltiplas NFs e vencimento editável.
- Agenda financeira automática com todas as ocorrências do mês atual e seguinte, sem criar abas ou datas manualmente.
- Planner visual em formato diário, três dias ou semana, com mini calendário, filtros, busca, horários e eventos coloridos.
- Filtros imediatos para notas de hoje, atrasadas, próximas e histórico completo.
- Verificação de pedido para clientes de demanda variável, com “Tem pedido” e “Sem pedido”.
- Construtores visuais e editáveis de fechamento, vencimento e políticas de cobrança.
- Políticas corretas por cliente: verde sem limite/cancelamento, amarelo até duas pendências e vermelho sem pendência vencida.
- Grupos de faturamento centralizado, incluindo SR. Mignon e suas 20 unidades.
- Importação de clientes e regras por planilhas XLSX ou CSV.
- Criação automática de cobrança ao concluir uma emissão.
- Cobranças com planner próprio, lembrete configurável, tentativas, histórico, promessa de pagamento, comprovante, reagendamento, cancelamento, seleção em massa e baixa final por diretoria.
- Checklist diário com natureza obrigatória: Emissão, Verificação, Execução ou Lembrete.
- Tarefas recorrentes de quinta-feira, sábado e domingo descritas no escopo.
- Base de rotas com 685 registros importados, visão do que cadastrar hoje, bases mensais, regras, divergências, edição, exclusão, conferência e indicadores de retrabalho.
- Geradores A4 de Cotação, Comprovante de Entrega e Declaração de Dados Bancários.
- Identidade visual e assinaturas das duas empresas conforme os modelos fornecidos.
- Recados internos com opção de gerar tarefa.
- Relatórios visuais de cobrança, inadimplência e performance.
- Modelos documentais editáveis, com textos, disponibilidade, identidade, assinatura, carimbo e conta bancária definidos por empresa.
- Configurações de empresas, usuários, perfis, permissões, módulos, abas, vencimentos, cores, campos personalizados e feriados.
- Backup e restauração em JSON e trilha de auditoria.
- API com autenticação JWT, PostgreSQL e upload protegido de arquivos de até 5 MB.

## Instalação no servidor com Docker

Com Docker Engine e Docker Compose v2 instalados, execute apenas:

```bash
docker compose up -d --build
```

Na primeira inicialização sem `.env`, o acesso é `admin@gestao.local` / `Admin@123`. O `.env.example` está incluído para configurar senhas próprias antes do uso em produção.

O instalador:

- cria o `.env` com senhas aleatórias quando ele ainda não existe;
- valida Docker, Compose e as variáveis obrigatórias;
- constrói a API e empacota o frontend pré-compilado;
- recupera automaticamente cache de construção corrompido quando o Docker retorna `invalid tar header`;
- utiliza o frontend já compilado e validado, sem executar `npm ci` no servidor e sem criar a camada de 1,2 GB que provocava `invalid tar header` e `gzip: invalid checksum`;
- sincroniza a senha do `.env` com um volume PostgreSQL já existente sem apagar dados;
- permite sincronizar explicitamente o acesso do administrador sem apagar usuários ou dados;
- inicia PostgreSQL, API, frontend e Nginx;
- aguarda os serviços ficarem saudáveis;
- testa a API e mostra o IP, usuário e senha inicial.

Se esta for uma primeira instalação e já existir um `.env` que deve ser descartado, use:

```bash
./install.sh --regenerate-env
```

O arquivo anterior será preservado como backup. O instalador sincroniza a nova senha com o banco existente; ainda assim, mantenha backups antes de qualquer mudança de credenciais em produção.

Se a senha administrativa do `.env` não corresponde mais ao banco, execute:

```bash
./install.sh --reset-admin-password
```

Acesse `http://IP_DO_SERVIDOR` sem informar porta.

O Nginx publica o sistema na porta 80. O banco e a API não ficam expostos diretamente.

## Acesso inicial

- E-mail: valor de `ADMIN_EMAIL` no `.env` (padrão `admin@gestao.local`).
- Senha sem `.env`: `Admin@123`. Com `.env`, use o valor de `ADMIN_PASSWORD`.

Troque a senha antes do uso real. As senhas são armazenadas com hash bcrypt.

## Comandos úteis

```bash
docker compose ps
docker compose logs -f --tail=100
docker compose restart
docker compose down
```

Para atualizar após enviar uma nova versão ao GitHub:

```bash
git pull
docker compose up -d --build
```

Consulte também `INSTALACAO_SSH.md`. Não use `docker compose down -v`, pois isso remove o banco e os uploads.

## Backup

A interface permite exportar e restaurar o estado completo em JSON. O volume `postgres_data` preserva o banco entre reconstruções dos contêineres e `uploads_data` preserva anexos.

Para um backup adicional do PostgreSQL:

```bash
docker compose exec -T database pg_dump -U gestao -d gestao > backup_gestao.sql
```

## Desenvolvimento sem Docker

```bash
cd frontend
npm ci
npm run dev
```

O frontend mantém um modo local no navegador quando a API não está disponível. Para uso corporativo multiusuário, utilize o ambiente Docker completo.

## Estrutura

- `frontend/`: aplicação web completa, incluindo Dockerfile, componentes, arquivos públicos e scripts de build.
- `frontend/app/`: interface web.
- `frontend/app/data/route-data.json`: dados estruturados das planilhas de rotas.
- `backend/`: API FastAPI, autenticação, persistência e arquivos.
- `nginx/`: proxy reverso para acesso pela porta 80.
- `docker-compose.yml`: frontend, backend, PostgreSQL e Nginx.
- `frontend/public/brand/`: logos, carimbo e assinaturas fornecidos nos modelos.
- `REQUISITOS_CONVERSAS.md`: matriz detalhada das solicitações extraídas das quatro conversas e sua implementação.

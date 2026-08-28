# Gestão Operacional

Sistema web integrado para substituir planilhas e controles manuais de clientes, contas a emitir, cobranças, tarefas diárias, bases de rotas e documentos corporativos.

## O que está incluído

- Dashboard operacional com indicadores e prioridades do dia.
- Cadastro unificado de clientes, perfil, score, métricas, tags e regras financeiras.
- Contas a emitir com emissão manual, adiantamento registrado, múltiplas NFs e vencimento editável.
- Agenda financeira automática com todas as ocorrências do mês atual e seguinte, sem criar abas ou datas manualmente.
- Filtros imediatos para notas de hoje, atrasadas, próximas e histórico completo.
- Verificação de pedido para clientes de demanda variável, com “Tem pedido” e “Sem pedido”.
- Construtores visuais e editáveis de fechamento, vencimento e políticas de cobrança.
- Políticas corretas por cliente: verde sem limite/cancelamento, amarelo até duas pendências e vermelho sem pendência vencida.
- Grupos de faturamento centralizado, incluindo SR. Mignon e suas 20 unidades.
- Importação de clientes e regras por planilhas XLSX ou CSV.
- Criação automática de cobrança ao concluir uma emissão.
- Cobranças com lembrete, tentativas, histórico, pagamento, reagendamento, cancelamento, seleção em massa e baixa.
- Checklist diário com natureza obrigatória: Emissão, Verificação, Execução ou Lembrete.
- Tarefas recorrentes de quinta-feira, sábado e domingo descritas no escopo.
- Base de rotas com 685 registros importados das planilhas anexadas, filtros por dia e entregador, status Cadastrado/Conferido e bloqueio de publicação.
- Geradores A4 de Cotação, Comprovante de Entrega e Declaração de Dados Bancários.
- Identidade visual e assinaturas das duas empresas conforme os modelos fornecidos.
- Recados internos com opção de gerar tarefa.
- Relatórios visuais de cobrança, inadimplência e performance.
- Configurações de empresas, usuários, perfis, permissões, vencimentos, cores, campos personalizados e feriados.
- Backup e restauração em JSON e trilha de auditoria.
- API com autenticação JWT, PostgreSQL e upload protegido de arquivos de até 5 MB.

## Instalação no servidor com Docker

Com Docker Engine e Docker Compose v2 instalados, execute apenas:

```bash
chmod +x install.sh
./install.sh
```

O instalador:

- cria o `.env` com senhas aleatórias quando ele ainda não existe;
- valida Docker, Compose e as variáveis obrigatórias;
- constrói backend e frontend com todas as dependências necessárias;
- inicia PostgreSQL, API, frontend e Nginx;
- aguarda os serviços ficarem saudáveis;
- testa a API e mostra o IP, usuário e senha inicial.

Se esta for uma primeira instalação e já existir um `.env` que deve ser descartado, use:

```bash
./install.sh --regenerate-env
```

O arquivo anterior será preservado como backup. Não use essa opção em uma instalação que já possua dados sem antes conferir as credenciais do banco.

Acesse `http://IP_DO_SERVIDOR` sem informar porta.

O Nginx publica o sistema na porta 80. O banco e a API não ficam expostos diretamente.

## Acesso inicial

- E-mail: valor de `ADMIN_EMAIL` no `.env` (padrão `admin@gestao.local`).
- Senha: valor de `ADMIN_PASSWORD` no `.env` (padrão de exemplo `Admin@123`).

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

## Backup

A interface permite exportar e restaurar o estado completo em JSON. O volume `postgres_data` preserva o banco entre reconstruções dos contêineres e `uploads_data` preserva anexos.

Para um backup adicional do PostgreSQL:

```bash
docker compose exec -T database pg_dump -U gestao -d gestao > backup_gestao.sql
```

## Desenvolvimento sem Docker

```bash
npm ci
npm run dev
```

O frontend mantém um modo local no navegador quando a API não está disponível. Para uso corporativo multiusuário, utilize o ambiente Docker completo.

## Estrutura

- `app/`: interface web.
- `app/data/route-data.json`: dados estruturados das planilhas de rotas.
- `backend/`: API FastAPI, autenticação, persistência e arquivos.
- `nginx/`: proxy reverso para acesso pela porta 80.
- `docker-compose.yml`: frontend, backend, PostgreSQL e Nginx.
- `public/brand/`: logos, carimbo e assinaturas fornecidos nos modelos.

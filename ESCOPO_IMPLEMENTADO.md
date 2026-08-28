# Matriz de cobertura integral

Este documento registra a cobertura funcional da reconstrução. A análise considera as solicitações do usuário nas três conversas compartilhadas do DeepSeek, na conversa compartilhada do ChatGPT, nos anexos operacionais e na referência visual do calendário.

## Arquitetura modular e administração

| Necessidade                         | Implementação                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Módulos completos, não simples abas | Dez áreas de primeiro nível: Visão geral, Clientes, Financeiro, Cobranças, Tarefas, Base de rotas, Documentos, Recados, Relatórios e Administração. Cada área operacional possui abas e fluxos próprios.      |
| Perfis vinculados aos módulos       | Matriz por perfil e módulo com ações `visualizar`, `criar`, `editar`, `excluir`, `aprovar`, `exportar` e `configurar`. O menu é filtrado conforme o perfil autenticado.                                       |
| CRUD de usuários e perfis           | Administrador cria, edita, ativa/desativa e exclui usuários e perfis; define perfil e acesso às empresas. API administrativa protegida persiste as contas e senhas bcrypt.                                    |
| Personalização integral             | Nome, título lateral, chamada de login, logo, fundo, miniatura, paleta, superfície, texto, raio e densidade; identidade e dados das empresas; campos e listas; nomes, descrição, ativação e abas dos módulos. |
| Segurança e continuidade            | JWT, hash bcrypt, trilha de auditoria, backup/restauração JSON, PostgreSQL e anexos persistentes.                                                                                                             |

## Clientes e Financeiro

| Solicitação                    | Implementação                                                                                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadastro único                 | Nome, CNPJ/CPF, e-mail, WhatsApp, empresa, grupo, emissor, cobradores, pagamento, envio, faturamento, tags, observações e estado ativo.                                                                                            |
| Fechamentos configuráveis      | Diário; diário com confirmação de pedido; segunda; quarta de congelados; sexta; quinzenal; dias 20 e 25; dias fixos arbitrários; fim do mês com emissão no primeiro dia seguinte. Regras podem ser criadas e editadas visualmente. |
| Vencimentos configuráveis      | 15, 28 e 30 dias; quarta da mesma semana; 15 dias seguido do próximo dia 10/20/30; janelas quinzenais; tabela/calendário manual.                                                                                                   |
| Políticas exatas por cor       | Verde permite várias pendências e nunca cancela fornecimento; amarelo limita a duas pendências; vermelho não aceita vencida, cobra no dia seguinte e encaminha cancelamento. A escolha é cadastral, não score automático.          |
| Grupo centralizado             | Cadastro de grupos e pagador central, incluindo SR. Mignon e suas 20 unidades.                                                                                                                                                     |
| SESI e demanda variável        | Ação `Tem pedido`/`Sem pedido`; sem pedido encerra a ocorrência e não cria cobrança.                                                                                                                                               |
| Contas a emitir                | Visão de hoje, atrasadas, próximas e histórico, múltiplas NFs, adiantamento, vencimento editável, responsável e observações.                                                                                                       |
| Planner financeiro             | Mini mês, busca, filtros por categoria, navegação, hoje, 1 dia/3 dias/semana, grade horária, emissões e vencimentos coloridos.                                                                                                     |
| Importação                     | XLSX/CSV para clientes e regras financeiras, com reconhecimento dos principais cabeçalhos.                                                                                                                                         |
| Ligação Financeiro → Cobranças | Emissão concluída cria a cobrança correspondente; `Sem pedido` não gera cobrança.                                                                                                                                                  |

## Cobranças

| Solicitação          | Implementação                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Agenda própria       | Planner equivalente ao Financeiro com vencimentos, início da cobrança e retornos reagendados.                   |
| Momento da ação      | Lembrete no vencimento, se habilitado no cliente, e cobrança a partir do dia seguinte conforme a política.      |
| Fila e prioridade    | Organização por política Verde/Amarelo/Vermelho, data disponível, valor, responsável e tentativas.              |
| Histórico detalhado  | Mensagem, resposta, promessa, horário, usuário, canal, resumo, tentativas e próximo contato.                    |
| Estados operacionais | Pendente, Em andamento, Paga, Reagendada, Cancelamento pendente, Cancelado, Baixada e Arquivada.                |
| Pagamento e baixa    | Natanael registra o pagamento e o comprovante; o item continua aberto até a baixa final por Marcelo/Jessica.    |
| Cancelamento         | Data e motivo ficam registrados; Willians visualiza a lista; cancelado pode retornar à fila para nova cobrança. |
| Negociação           | Reagendamento e pendência de decisão ficam visíveis à diretoria sem cancelamento automático imediato.           |
| Ações em massa       | Seleção múltipla e ações por tags para lembretes e fila.                                                        |

## Tarefas e checklist de Willians

| Solicitação              | Implementação                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estrutura flexível       | Tarefa recorrente ou pontual, dias configuráveis, horário, natureza obrigatória, prioridade, responsável, observações, subitens, duplicação, edição e exclusão.                                         |
| Naturezas                | Emissão, Verificação, Execução e Lembrete visíveis nas listagens.                                                                                                                                       |
| Quinta-feira             | Johnson e extras; SESIs para verificar; Toder, Plastic, Alojamento, César, Gerdau, Brazul, Iramec, Santa Casa, Embraer/Gláucia/Marinela e Etec; produções, romaneios, etiquetas e relatórios 17h/20h30. |
| Sábado/domingo           | Oxiteno, Jarinu, Santa Casa, Vivalle, Johnson, SESIs; produção para domingo/segunda; romaneios; líderes 14h/21h; etiquetas, folhas e relatórios de merendas.                                            |
| Conferências importantes | Planilhas de entrega, pedidos alterados, Hospital São José, Vivalle, Pró Infância, Santa Casa, Santos Dumont, Francisca Júlia e quadro de OK.                                                           |
| Planner e indicadores    | Meu dia, calendário, catálogo completo, recorrências e indicadores de conclusão.                                                                                                                        |

## Base de rotas

| Solicitação                       | Implementação                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Complemento ao sistema de pedidos | Base oficial de organização; não substitui a digitação de pedidos no sistema externo.                                         |
| Dados importados                  | 685 registros estruturados com dia, entregador, viagem, horário, cliente, quantidades, regra e conferência.                   |
| Fluxo mensal                      | O que cadastrar hoje, bases mensais, regras fixas/programadas/sob demanda, revisão do mês seguinte e histórico de alterações. |
| Conferência                       | Estados cadastrado, conferido, divergente e corrigido; edição e exclusão; bloqueio de liberação enquanto houver divergência.  |
| Métricas                          | Erros, causas, retrabalho, tempo de preparação e entrada. Estrutura pronta para futura integração por API.                    |

## Documentos, recados e relatórios

| Solicitação             | Implementação                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Geradores               | Cotação, Comprovante de Entrega e Declaração Bancária em formato A4, com histórico e reimpressão.                             |
| Modelos personalizáveis | Nome, título, abertura, observações, ativação, empresa, logo, cores, assinatura, carimbo, banco, agência, conta e favorecido. |
| Recados                 | Prioridade, destinatários, vínculo ao cliente, andamento e conversão em tarefa.                                               |
| Relatórios              | Painéis visuais de financeiro, cobranças, tarefas e rotas, sem depender de relatório manual.                                  |

## Implantação

O pacote inclui frontend, FastAPI, PostgreSQL, Nginx, Docker Compose, volumes, health checks e `install.sh`. O instalador cria o `.env`, restaura permissões, cria a configuração local, protege credenciais do contexto Docker, tenta reparar cache `invalid tar header`, sincroniza a senha com volume PostgreSQL existente, inicia os serviços e testa a API.

Para os requisitos item a item e critérios de aceite, consulte `REQUISITOS_CONVERSAS.md`.

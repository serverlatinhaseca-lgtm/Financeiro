# Requisitos consolidados das conversas

## Fontes analisadas

- DeepSeek — Financeiro: `h5wf3mfujqzy1j3pld`.
- DeepSeek — Cobranças: `qdzjbswhaix181ytt2`.
- DeepSeek — Checklist/Tarefas: `zouz2jop4max1egvre`.
- ChatGPT — Base de rotas: `6a91ad62-0174-83e9-a1dd-42b2c8678d1d`.
- Escopos, planilhas e modelos documentais fornecidos anteriormente.
- Imagem de referência do planner no estilo Notion Calendar.

## Princípios que não podem ser reduzidos

1. Cada item do menu principal é um módulo, com abas, regras, cadastros, histórico e relatórios próprios.
2. O Administrador controla os módulos disponíveis em cada perfil e as ações permitidas.
3. Identidade, logos, fundos, miniaturas, cores, textos, campos, listas, empresas, regras e modelos devem ser editáveis pela interface.
4. Financeiro, Cobranças, Tarefas e Rotas compartilham clientes, responsáveis, empresas, recados e documentos.
5. O sistema externo de pedidos continua existindo; rotas e romaneios organizam e conferem o trabalho, sem fingir uma integração inexistente.
6. Regras por cor são políticas cadastrais exatas, e não uma pontuação automática.
7. Lembretes de vencimento podem ser desativados por cliente; o dever de cobrar permanece.
8. `Sem pedido` não pode gerar cobrança.
9. `Paga` não significa `Baixada`: Marcelo ou Jessica fazem a baixa final.
10. Nenhum cadastro operacional deve ficar sem editar, duplicar quando aplicável, inativar ou excluir conforme a permissão.

## Critérios de aceite por módulo

### Financeiro

- O calendário apresenta grade horária, mini mês, filtros, pesquisa e visões de 1 dia, 3 dias e semana.
- Fechamentos e vencimentos são criados por seletores, dias da semana, dias do mês ou tabela manual.
- Hoje e atrasadas ficam identificáveis imediatamente.
- A emissão permite confirmar pedido, registrar ausência, informar NFs, valor, adiantamento, vencimento e observações.
- Concluir emissão cria cobrança; ausência de pedido não cria.

### Cobranças

- O calendário diferencia vencimento, data de cobrança e retorno reagendado.
- O histórico registra quem contatou, quando, por qual meio, o conteúdo e a resposta/promessa.
- O comprovante é registrado antes da baixa final.
- Cancelamentos têm data/motivo, ficam visíveis a operações e podem voltar à fila.
- A diretoria enxerga itens críticos, negociações e pagamentos pendentes de baixa.

### Tarefas

- Frequência pode ser fixa em qualquer combinação de dias ou pontual.
- Natureza é obrigatória e visível.
- Quinta, sábado e domingo vêm pré-cadastrados com os clientes, produções, relatórios, folhas, etiquetas e conferências solicitados.
- Todas as tarefas aceitam alteração de responsável, horário, prioridade, observação e subitens.

### Rotas

- O usuário vê o que precisa ser cadastrado hoje.
- Bases mensais preservam validade e alterações.
- Divergências e correções ficam registradas.
- Indicadores mostram erro, retrabalho e andamento.

### Administração

- Usuários e perfis têm CRUD completo.
- A matriz permite definir ações por módulo.
- O menu respeita os módulos autorizados.
- Logos, imagens, títulos e tema têm prévia e upload/URL.
- Empresas guardam identidade, assinatura, carimbo e dados bancários.
- Módulos e suas listas de abas são administráveis.

## Dados iniciais

Os dados iniciais são operacionais para demonstrar os fluxos: duas empresas, perfis de Administrador, Financeiro, Cobranças, Operações e Diretoria; usuários de referência; políticas; regras; grupos; checklist; documentos e 685 registros de rotas. Tudo pode ser ajustado após o primeiro acesso.

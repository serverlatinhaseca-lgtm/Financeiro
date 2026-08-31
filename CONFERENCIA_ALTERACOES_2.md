# Conferência das Alterações 2

Esta distribuição contém o sistema completo, e não somente uma correção do módulo Financeiro.

## Design e experiência

- Login, navegação, cabeçalhos, cartões, formulários, tabelas, diálogos e botões redesenhados.
- Identidade Nova Esperança preservada, com logo secundário Excelência do Pão.
- Tema escuro em tons roxos.
- Visão Geral com indicadores e prioridades diferentes para Financeiro, Cobranças, Operações, Diretoria e Administração.
- Tipografia, espaçamento, contraste, responsividade e estados de interação revisados.

## Clientes

- Consulta de CNPJ via BrasilAPI e preenchimento automático.
- Consulta de CEP via ViaCEP e preenchimento automático do endereço.
- Score de 0 a 1000 em medidor semicircular colorido.
- Grupos e unidades com seleção, criação, edição e exclusão confirmada.
- “Lembretes em massa” renomeado para “Alertas de cobrança”.
- Aba redundante de importação removida; importação útil permanece na listagem.

## Financeiro

- Painel financeiro e indicadores modernizados.
- Planner mostra somente títulos compactos.
- Clique no evento abre os detalhes completos em diálogo.
- Agenda, contas a emitir, recorrências, histórico, relatórios e regras preservados.

## Base de Rotas

- Consulta para cadastro transformada em fila operacional com busca, filtros, resumo, conferência e ações.
- Mapa Leaflet/OpenStreetMap real com marcadores numerados, linhas, estilos claro/detalhado/noturno roxo e legenda.
- Painel com distância estimada, tempo de percurso, paradas, saída e chegada.
- Clique na parada abre cliente, endereço, motorista, viagem, ordem e horário.
- Cores das rotas editáveis.
- Cadastro e edição de rotas, motoristas, paradas, ordem e mudanças entre rotas preservados.
- Gráficos, métricas, indicadores, histórico, divergências, feriados e conferências preservados.

## Administração

- Usuários, perfis, módulos, abas e permissões continuam cadastráveis, editáveis e removíveis pelo administrador.
- Logos, fundos, miniaturas, cores, empresas, campos, regras, documentos, assinaturas e carimbos continuam personalizáveis.

## Implantação

- Estrutura explícita: `frontend/`, `backend/`, `nginx/` e `docker-compose.yml`.
- `frontend/dist` incluído e validado; o servidor não executa `npm ci` durante o Docker build.
- Inicialização direta: `docker compose up -d --build`.
- Banco e uploads mantidos em volumes.

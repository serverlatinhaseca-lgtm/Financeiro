# Alterações 2 — matriz de implementação

## Identidade e experiência

- Redesenho visual global do login, navegação, cabeçalhos, cartões, formulários, tabelas, diálogos e ações.
- Aplicação da identidade Nova Esperança com tons de forno, trigo, creme, cobre e marrom.
- Logo atual da Nova Esperança e logo secundário Excelência do Pão.
- Linguagem visual coerente com indústria de pães, produção, clientes e distribuição.
- Tipografia moderna e responsiva.
- Tema escuro reconstruído em roxo.
- Componentes, cores, logos, fundos, miniaturas e regras continuam editáveis pelo administrador.

## Visão Geral

- Novo painel de boas-vindas e prioridades.
- Indicadores e ação principal mudam conforme o perfil ativo: Financeiro, Cobranças, Operações ou gestão executiva.
- Cartões e listas redesenhados para leitura rápida.

## Clientes

- Consulta real de CNPJ com preenchimento automático via BrasilAPI.
- Consulta real de CEP com preenchimento automático via ViaCEP.
- Score redesenhado como medidor de crédito com escala colorida de 0 a 1000.
- Grupos e unidades agora podem ser criados, selecionados, editados e apagados.
- “Lembretes em massa” foi substituído por “Alertas de cobrança”, com objetivo mais claro.
- Aba redundante de importação removida; a importação permanece na listagem.

## Financeiro

- Painel financeiro modernizado.
- Calendário/planner mantém títulos limpos e sem sobreposição.
- Clique no título abre a ficha completa da atividade financeira.

## Base de Rotas

- Consulta para cadastro reconstruída com filtros, indicadores, fila, conferência e ações em lote.
- Mapa cartográfico real e interativo com três estilos visuais.
- Cores das rotas personalizáveis pelo administrador.
- Marcadores bonitos e numerados, linhas coloridas, legenda e detalhes ao clicar.
- Distância estimada, tempo de percurso, paradas, saída e chegada exibidos no painel.
- Aparência e textos alinhados à logística de uma indústria de pães.

## Administração e segurança

- Perfis, módulos e permissões existentes foram preservados.
- Os demais módulos e suas funções não foram removidos.
- A persistência local, API, PostgreSQL, Nginx, Docker Compose e instalador foram preservados.
- O arquivo `.env` permanece excluído do pacote e do contexto Docker.

## Validação

O pacote deve passar por lint, build de produção, testes automatizados, compilação da API e validação visual antes da entrega.

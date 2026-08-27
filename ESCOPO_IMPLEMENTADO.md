# Matriz de cobertura do escopo

Este arquivo registra como os materiais fornecidos foram incorporados ao sistema.

| Origem / necessidade | Implementação entregue |
|---|---|
| Escopo geral | Aplicação integrada com dashboard, clientes, financeiro, cobranças, tarefas, rotas, documentos, recados, relatórios e configurações. |
| Cadastro de clientes | Base única, pesquisa, filtros, inclusão, edição, inativação, perfil, métricas, tags, responsáveis e regras financeiras. |
| Contas a emitir | Agenda de emissões, cadastro manual, múltiplas NFs, vencimento editável, observações, status “Sem pedido” e geração automática de cobranças. |
| Cobranças | Prioridades por cor, tentativas, histórico, contato, reagendamento, pagamento com comprovante obrigatório, cancelamento, baixa e ações em massa. |
| Checklist diário | Natureza obrigatória (Emissão, Verificação, Execução ou Lembrete), dias configuráveis, subitens, observações e duplicação. |
| Quinta-feira | Notas Johnson, SESI e demais clientes; produção; romaneios; etiquetas; folhas e relatórios de 17h e 20h30. |
| Sábado e domingo | Emissões de domingo/segunda, produções, romaneios, relatórios de líderes, etiquetas, folhas, merendas e conferências importantes. |
| Planilhas de rotas | 685 registros convertidos para dados estruturados, separados em dias úteis, sábado e domingo, com entregador, viagem, horário, cliente, quantidades, regra e conferência. |
| Comprovante de Entrega | Gerador A4 com empresa, cliente, NF, data, valor, carimbo e assinatura. |
| Declaração de Dados Bancários | Gerador A4 com dados configuráveis da empresa e assinatura. |
| Cotações | Gerador A4 com itens, quantidades, unidade, preço, total, empresa e histórico. |
| Empresas e identidade | Nova Esperança e Excelência do Pão com logos, cores, dados cadastrais, carimbo e assinaturas extraídos dos modelos. |
| Usuários e segurança | Login JWT, senha com hash bcrypt, perfis, permissões, auditoria e API protegida. |
| Infraestrutura | Frontend, FastAPI, PostgreSQL, Nginx na porta 80, volumes persistentes, backup/restauração e Docker Compose. |

## Observação de implantação

O modo de desenvolvimento funciona localmente no navegador. Para persistência centralizada e uso multiusuário, utilize o ambiente Docker descrito no `README.md`.

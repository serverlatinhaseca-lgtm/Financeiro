# Últimas correções — 31/08/2026

Pacote preparado especificamente a partir das últimas solicitações do chat.

## Corrigido nesta revisão
- Score de novos clientes alterado para 1000 em cadastro, normalização e dados iniciais.
- Score do perfil continua dinâmico: pendências vencidas e reagendamentos reduzem a pontuação; pagamentos/baixas deixam de contar como pendência.
- Consulta de CEP no mapa corrigida no backend: CEP de 8 dígitos é resolvido primeiro pelo ViaCEP e o endereço completo é geocodificado em seguida.
- Consulta de endereço/CEP no mapa passa a selecionar automaticamente a rota existente mais próxima para comparação, exibindo a rota sugerida ao usuário.
- Linha que conecta a sequência das paradas permanece visível com fluxo animado (`route-flow`).
- Mapa mantém cálculo de melhor sequência viária e opção para aplicar a ordem sugerida.
- Tema escuro força a barra lateral para a paleta roxa, evitando mistura com as cores do tema claro.
- Tema claro mantém a linguagem visual baseada na marca, sem substituir a identidade por lilás genérico.
- Diálogos, cards, perfil do cliente e gerador de documentos receberam reforço de dimensionamento, sombras e limites de viewport para evitar telas vazias/sobrepostas em zoom 100%.
- O botão “+ Gerar documento” permanece como abertura de modal interno, sem navegação para página vazia.
- Fonte completa atualizada novamente em `frontend/CODIGO_FONTE_COMPLETO.zip`.

## Validações executadas nesta revisão
- `python -m py_compile` no backend: aprovado.
- `node --check` no JavaScript pré-compilado do cliente: aprovado.
- `node --check` no JavaScript SSR pré-compilado: aprovado.
- Verificação de integridade do ZIP final: executada antes da entrega.

## Observação de build
O pacote de implantação usa o frontend pré-compilado em `frontend/dist`, portanto o servidor não precisa instalar dependências Node para servir o site. A árvore de dependências de desenvolvimento não é incluída no ZIP.

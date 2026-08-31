# Gestão Operacional — R3 Full Stack

Versão: `2026.08.31-R3-FULLSTACK`

## Correções desta revisão

- Frontend identificado por versão na tela de login e sidebar.
- Tema claro com cores da marca e dark mode roxo.
- Proteções adicionais para zoom 100% e overflow horizontal.
- Clientes iniciam com score 1000 e score financeiro calculado.
- CEP e CNPJ consultados pelo backend com tratamento de erro 404/502.
- Mapa sem coordenadas fictícias; geocodificação de paradas reais, busca de endereço/CEP, sugestão de melhor rota, otimização e linha animada.
- Planner compacto com detalhes em modal.
- Gerador de documentos com preview e snapshot do documento.
- CRUD de grupos/unidades e operações de rotas presentes na interface.
- Backend com auditoria de seções alteradas no estado.
- Uploads ampliados para 20 MB.
- PostgreSQL via rede interna Docker (`database:5432`) em vez de socket compartilhado.
- Frontend e backend com healthchecks; Nginx só inicia quando ambos estiverem saudáveis.
- Nginx com cache da aplicação desabilitado e headers de segurança.
- `install.sh` recompila backend e frontend com `--no-cache`, força recriação dos containers e confere a mesma assinatura de versão na API e no HTML servido.
- Login é testado por usuário e por e-mail durante a instalação.
- Estado autenticado `/api/state` é testado durante a instalação.
- Corrigido teste do frontend que procurava `backend/app/main.py` dentro do ZIP do frontend e fazia o build falhar.
- `verificar_servidor.sh` permite validar a instalação novamente a qualquer momento.

## Instalação SSH

```bash
cd ~/Financeiro
git pull
chmod +x install.sh verificar_servidor.sh validar_pacote.sh
./install.sh
./verificar_servidor.sh
```

O instalador NÃO apaga os volumes do PostgreSQL nem uploads.

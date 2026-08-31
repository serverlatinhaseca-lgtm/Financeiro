# Correção de build R5

Erro observado no servidor:
`Could not resolve './build/sites-vite-plugin' in vite.config.ts`.

Correção aplicada:
- removida a dependência de `./build/sites-vite-plugin`;
- removido o plugin Cloudflare/Site Creator do build de produção;
- `vite.config.ts` usa apenas `vinext()` para o frontend Docker/Node;
- varredura de imports locais: nenhum import relativo ausente;
- validador do pacote agora rejeita novamente qualquer fonte que dependa de `sites-vite-plugin`.

Release: `2026.08.31-R5-FULLSTACK`.

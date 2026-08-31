FROM node:22-alpine AS builder

RUN apk add --no-cache unzip
WORKDIR /src

COPY CODIGO_FONTE_COMPLETO.zip /tmp/CODIGO_FONTE_COMPLETO.zip
RUN unzip -q /tmp/CODIGO_FONTE_COMPLETO.zip -d /src \
 && rm /tmp/CODIGO_FONTE_COMPLETO.zip

# A versão publicada é SEMPRE recompilada a partir do código corrigido.
RUN npm ci --no-audit --no-fund
RUN ./node_modules/.bin/vinext build

# O build só é aceito se todos os contratos automatizados passarem.
RUN node --test --test-concurrency=1 tests/*.test.mjs

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=builder /src/dist ./dist
COPY runtime-server.mjs ./runtime-server.mjs
EXPOSE 3000
CMD ["node", "runtime-server.mjs"]

FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY dist ./dist
COPY runtime-server.mjs ./runtime-server.mjs

EXPOSE 3000

CMD ["node", "runtime-server.mjs"]

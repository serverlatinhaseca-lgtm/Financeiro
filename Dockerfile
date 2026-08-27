FROM node:22-alpine AS build
RUN apk add --no-cache bash coreutils
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/app ./app
COPY --from=build /app/components ./components
COPY --from=build /app/public ./public
COPY --from=build /app/vendor ./vendor
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/vite.config.ts /app/tsconfig.json /app/postcss.config.mjs ./
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "3000"]

# Estágio 1: Instalação das dependências de produção
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---

# Estágio 2: Construção da aplicação final
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules

# Gera o Prisma Client a partir do schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copia o resto do código da aplicação
COPY . .

# Diretório do banco SQLite (montado como volume no docker-compose)
RUN mkdir -p /app/data && chown -R node:node /app/data && chmod +x docker-entrypoint.sh
USER node

EXPOSE 3000

# Aplica as migrations pendentes, garante o seed e inicia o servidor
ENTRYPOINT [ "./docker-entrypoint.sh" ]

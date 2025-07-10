# Estágio 1: Instalação das dependências
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---

# Estágio 2: Construção da aplicação final
FROM node:20-alpine
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules

# Copia o schema do Prisma PRIMEIRO
COPY prisma ./prisma/

# =========================================================
# ==                 A CORREÇÃO ESTÁ AQUI                ==
# ==  Gera o Prisma Client para que a aplicação possa usá-lo ==
# =========================================================
RUN npx prisma generate

# Copia o resto do código da aplicação
COPY . .

EXPOSE 3000

# Comando de inicialização
CMD [ "node", "index.js" ]
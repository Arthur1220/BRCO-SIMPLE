# Estágio 1: Instalação das dependências
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copia os arquivos de definição de dependências
COPY package*.json ./

# Usa 'npm ci' que é mais rápido e seguro para produção
RUN npm ci

# ---

# Estágio 2: Construção da aplicação final
FROM node:20-alpine

WORKDIR /app

# Copia as dependências já instaladas do estágio anterior
COPY --from=dependencies /app/node_modules ./node_modules

# Copia o resto do código da aplicação
COPY . .

# Instala o PM2 globalmente dentro da imagem
RUN npm install pm2 -g

# Expõe a porta que a aplicação usa
EXPOSE 3000

# Comando para iniciar a aplicação com PM2 em modo de container.
# Ele irá automaticamente usar todos os núcleos de CPU disponíveis.
CMD [ "pm2-runtime", "index.js", "-i", "0" ]
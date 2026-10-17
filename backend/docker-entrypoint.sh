#!/bin/sh
set -e

# Aplica as migrations pendentes (não apaga dados existentes)
npx prisma migrate deploy

# Seed idempotente: só cria os alimentos que ainda não existem
node prisma/seed.js

exec node index.js

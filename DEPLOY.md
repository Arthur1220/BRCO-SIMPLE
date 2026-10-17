# Deploy do BRCO

Arquitetura em produção:

```
Navegador ──HTTPS──▶ Netlify (frontend + proxy /api, assinado) ──HTTPS──▶ EC2: Caddy :443 ──▶ backend :3000 (rede interna do Docker)
```

- O navegador nunca fala direto com o EC2 e **não carrega nenhuma chave**.
- O Netlify assina cada requisição do proxy (header `X-Nf-Sign`). O backend recusa (403) tudo o que não vem assinado.
- O Caddy emite e renova o certificado HTTPS sozinho (Let's Encrypt). O domínio padrão é o `sslip.io`, que é gratuito e resolve direto para o IP: `98-94-173-47.sslip.io` → `98.94.173.47`.
- O SQLite fica no volume Docker `brco_data` e sobrevive a rebuilds.

## Variáveis de ambiente

### Backend (`backend/.env` no EC2)

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `production` |
| `PANEL_PASSWORD` | Senha do painel `/admin` |
| `ADMIN_JWT_SECRET` | Segredo do token de sessão (≥ 32 caracteres) |
| `NETLIFY_PROXY_SECRET` | Mesmo valor de `API_SIGNATURE_TOKEN` no Netlify |
| `FRONTEND_URL` | `https://brco.netlify.app` (opcional) |

O `DATABASE_URL` é definido pelo `docker-compose.yml` (`file:/app/data/brco.db`).

Para gerar os segredos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Raiz do projeto no EC2 (`.env` ao lado do `docker-compose.yml`)

```
API_DOMAIN=98-94-173-47.sslip.io
```

### Netlify (Site settings → Environment variables)

| Variável | Ação |
|---|---|
| `API_SIGNATURE_TOKEN` | **Criar**, com o mesmo valor de `NETLIFY_PROXY_SECRET` |
| `VITE_ADMIN_API_KEY`, `VITE_PUBLIC_API_KEY`, `VITE_API_URL` | **Remover** (não são mais usadas) |

## Migração do servidor atual (uma vez)

> O banco atual está **dentro** do container (`/app/prisma/dev.db`) e seria perdido no rebuild. Copie-o **antes** de qualquer outro passo.

```bash
# 1. Backup do banco atual
docker cp backend:/app/prisma/dev.db ~/brco-backup-$(date +%F).db

# 2. Atualizar o código
git pull   # branch com estas mudanças

# 3. Ajustar backend/.env (ver tabela acima) e criar .env na raiz com API_DOMAIN

# 4. Criar o volume e copiar o banco antigo para dentro dele
docker compose create backend
docker run --rm -v brco-simple_brco_data:/data -v ~/:/backup alpine \
  sh -c "cp /backup/brco-backup-$(date +%F).db /data/brco.db && chown 1000:1000 /data/brco.db"

# 5. Subir tudo (as migrations são aplicadas automaticamente no start)
docker compose up -d --build
docker compose logs -f backend
```

O nome do volume depende da pasta do projeto. Confira com `docker volume ls`.

Se o `migrate deploy` falhar com **P3005** (banco sem histórico de migrations), marque a migration inicial como aplicada e reinicie:

```bash
docker compose run --rm --entrypoint "" backend npx prisma migrate resolve --applied 20251119152811_init_com_categorias
docker compose restart backend
```

### AWS Security Group

- **Abrir**: 80/tcp e 443/tcp (0.0.0.0/0). O Caddy precisa da porta 80 para emitir o certificado.
- **Fechar**: 3000/tcp e 8080/tcp. O backend não publica mais nenhuma porta.
- Manter o 22/tcp (SSH) restrito ao seu IP.

### Depois do deploy

1. Faça um novo deploy no Netlify, para aplicar o `netlify.toml` e as variáveis.
2. Teste a calculadora e o login do `/admin`.
3. Confirme o bloqueio do acesso direto: `curl https://98-94-173-47.sslip.io/api/foods` deve responder **403**.
4. Troque a `PANEL_PASSWORD` se ela já foi compartilhada. As antigas `ADMIN_API_KEY` e `PUBLIC_API_KEY` ficaram públicas no bundle e não têm mais uso: apague-as do `.env`.

## Backups

```bash
docker compose exec backend npm run backup   # grava em /app/data/backups (mantém os 7 últimos)
```

Os backups ficam no mesmo volume e protegem contra erros e corrupção, mas não contra a perda do disco. Para isso, ative snapshots do EBS ou copie os backups para fora do servidor:

```bash
docker cp backend:/app/data/backups ./backups
```

Sugestão de cron no EC2 (diário, às 3h):

```
0 3 * * * cd /caminho/BRCO-SIMPLE && docker compose exec -T backend npm run backup
```

## Logs

Os logs vão só para o stdout. O Docker rotaciona: no máximo 3 arquivos de 10 MB por serviço.

```bash
docker compose logs --tail 200 backend
```

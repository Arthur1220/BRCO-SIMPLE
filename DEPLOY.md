# Deploy do BRCO

Arquitetura em produção:

```
Navegador ──HTTPS──▶ Netlify (frontend + proxy /api, assinado) ──HTTPS──▶ Lambda Function URL (sa-east-1) ──▶ DynamoDB
```

- O navegador nunca fala direto com a Lambda e **não carrega nenhuma chave**.
- O Netlify assina cada requisição do proxy (header `X-Nf-Sign`). A API recusa (403) tudo o que não vem assinado, inclusive acessos diretos à Function URL.
- A Lambda roda a mesma aplicação Express do desenvolvimento (`backend/lambda.js`, via `serverless-http`).
- Os dados ficam em 3 tabelas DynamoDB sob demanda, com backup contínuo (PITR, 35 dias) e `DeletionPolicy: Retain`: apagar a stack **não** apaga os dados.

Toda a infraestrutura está em `backend/template.yaml` (AWS SAM).

## Pré-requisitos

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) e AWS CLI com acesso à conta (`aws sso login --profile organizador`)
- Node.js 24

## Primeiro deploy

```bash
cd backend
sam build
sam deploy --guided --profile organizador
```

O `--guided` pergunta os parâmetros e grava as respostas não secretas no `samconfig.toml` (stack `brco-api`, região `sa-east-1`):

| Parâmetro | Descrição |
|---|---|
| `PanelPassword` | Senha do painel `/admin` |
| `AdminJwtSecret` | Segredo do token de sessão (≥ 32 caracteres) |
| `NetlifyProxySecret` | Mesmo valor de `API_SIGNATURE_TOKEN` no Netlify |
| `FrontendUrl` | `https://brco.netlify.app` (padrão) |

Para gerar os segredos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

No fim, o deploy mostra os **Outputs**: `ApiUrl` (a Function URL) e os nomes das tabelas.

## Migração dos dados do servidor antigo (uma vez)

O servidor antigo (Lightsail `brosimple-lightsail`, us-east-1) guarda o SQLite **dentro** do container.

```bash
# 1. No servidor antigo: copiar o banco para fora do container
docker cp backend:/app/prisma/dev.db ~/brco.db
# (se o servidor já estiver na versão com volume: docker cp backend:/app/data/brco.db ~/brco.db)

# 2. Na sua máquina: baixar o arquivo
scp ubuntu@98.94.173.47:brco.db ./brco.db

# 3. Conferir o que será importado (não grava nada)
cd backend
FOODS_TABLE=<FoodsTableName> CALCULATIONS_TABLE=<CalculationsTableName> USAGE_LOGS_TABLE=<UsageLogsTableName> \
AWS_PROFILE=organizador AWS_REGION=sa-east-1 npm run migrate:sqlite -- ../brco.db --dry-run

# 4. Importar (mesmo comando, sem --dry-run)
```

A importação mantém os ids dos alimentos (os novos continuam a numeração), todo o histórico de uso e os cálculos ainda válidos. Pode ser repetida sem duplicar nada.

Se o banco antigo não tiver alimentos, cadastre os iniciais com `npm run seed` (mesmas variáveis de ambiente).

## Netlify

1. Em `frontend/netlify.toml`, troque o destino do proxy `/api/*` pela `ApiUrl` do deploy:
   ```toml
   to = "https://<id>.lambda-url.sa-east-1.on.aws/api/:splat"
   ```
2. Em **Site settings → Environment variables**: `API_SIGNATURE_TOKEN` com o mesmo valor de `NetlifyProxySecret`. Remova `VITE_ADMIN_API_KEY`, `VITE_PUBLIC_API_KEY` e `VITE_API_URL`, se ainda existirem.
3. Faça o deploy do frontend.

## Depois do deploy

1. Teste a calculadora (exigências, NDT e dieta), o link de um cálculo salvo, o CSV e o login do `/admin`.
2. Confirme o bloqueio do acesso direto: `curl <ApiUrl>api/v1/foods` deve responder **403**.
3. Confira se o país e o estado aparecem no histórico do admin. Eles vêm do header de geolocalização do Netlify; se vierem como `Unknown`, o proxy não está repassando esse header.
4. Deixe o Lightsail antigo ligado por cerca de uma semana como plano B. Depois, faça um snapshot e apague a instância e o IP estático.

## Atualizações

```bash
cd backend
sam build && sam deploy --profile organizador
```

## Retenção dos cálculos

Os cálculos ficam guardados por **6 meses**. Cada item tem o atributo `ttl` e o próprio DynamoDB apaga os vencidos (pode levar alguns dias; enquanto isso a API já responde 404). As estatísticas do admin não guardam entrada nem resultado e não expiram.

## Backups

O PITR das tabelas permite restaurar qualquer momento dos últimos 35 dias (console do DynamoDB → tabela → *Backups* → *Restore to point in time*). Para uma cópia avulsa:

```bash
aws dynamodb create-backup --table-name <FoodsTableName> --backup-name brco-foods-$(date +%F) --profile organizador --region sa-east-1
```

## Logs

Os logs da Lambda ficam no CloudWatch, no grupo `/aws/lambda/brco-api` (retenção de 30 dias):

```bash
sam logs --stack-name brco-api --tail --profile organizador
```

## Limites e custos

- A Lambda, as Function URLs e o DynamoDB sob demanda cabem no nível gratuito com o volume atual.
- O limite de requisições (`express-rate-limit`) fica em memória: na Lambda, cada instância tem o próprio contador, então ele é só uma proteção de melhor esforço. A assinatura do Netlify continua barrando quem chama a Function URL diretamente.

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

Depois que o CI/CD (abaixo) estiver configurado, basta fazer merge na `main`. Para um deploy manual do backend:

```bash
cd backend
sam build && sam deploy --profile organizador
```

## CI/CD

Tudo o que entra na `main` é publicado sozinho:

| O quê | Quem faz | Quando |
|---|---|---|
| Testes do backend (com DynamoDB Local) e build do frontend | GitHub Actions (`.github/workflows/ci.yml`) | Todo PR e todo push |
| Deploy do backend (`sam build` + `sam deploy`) | GitHub Actions, job `deploy-backend` | Push na `main` que muda `backend/**`, **só se os testes passarem** |
| Deploy do frontend | Netlify (deploy contínuo pelo Git, site `brcosimple`) | Push na `main` que muda `frontend/**` (`ignore` no `frontend/netlify.toml`) |

O GitHub Actions entra na AWS por **OIDC**: o workflow troca um token do próprio GitHub por credenciais temporárias de uma role IAM. Não existe chave de acesso guardada em lugar nenhum, e a role só pode ser assumida por workflows da branch `main` deste repositório.

### 1. Aplicar o template do OIDC (uma vez)

`infra/github-oidc.yaml` cria o provider OIDC do GitHub e a role `brco-github-deploy`, com permissão só para o que o `sam deploy` da stack `brco-api` precisa (a stack, o bucket de artefatos do SAM, a Lambda, as tabelas, a role de execução da Lambda e o grupo de logs).

Antes, faça o **primeiro deploy manual** (seção "Primeiro deploy"): ele cria o bucket de artefatos do SAM (`aws-sam-cli-managed-default`), que a role de deploy só usa e não pode criar.

```bash
aws cloudformation deploy \
  --template-file infra/github-oidc.yaml \
  --stack-name brco-github-oidc \
  --capabilities CAPABILITY_NAMED_IAM \
  --region sa-east-1 --profile organizador
```

Se a conta já tiver um provider para `token.actions.githubusercontent.com` (só pode existir um por conta), acrescente `--parameter-overrides CreateOidcProvider=false`. Para conferir:

```bash
aws iam list-open-id-connect-providers --profile organizador
```

O ARN da role sai nos Outputs da stack:

```bash
aws cloudformation describe-stacks --stack-name brco-github-oidc --region sa-east-1 --profile organizador \
  --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" --output text
```

### 2. Configurar o GitHub

Em **Settings → Secrets and variables → Actions** do repositório:

| Tipo | Nome | Valor |
|---|---|---|
| Variable | `AWS_DEPLOY_ROLE_ARN` | `DeployRoleArn` do passo anterior |
| Secret | `PANEL_PASSWORD` | Mesmo `PanelPassword` do primeiro deploy |
| Secret | `ADMIN_JWT_SECRET` | Mesmo `AdminJwtSecret` |
| Secret | `NETLIFY_PROXY_SECRET` | Mesmo `NetlifyProxySecret` (= `API_SIGNATURE_TOKEN` no Netlify) |

Os três segredos são reenviados a cada deploy (`--parameter-overrides`). Se algum mudar, atualize o secret e o próximo deploy aplica; o `NETLIFY_PROXY_SECRET` tem que mudar junto com o `API_SIGNATURE_TOKEN` do Netlify.

O ARN da role não é segredo (sem a trust policy ninguém o assume), mas fica numa variável para não deixar o ID da conta no código.

### 3. Conferir o Netlify

O site `brcosimple` já publica a `main` pelo Git. Em **Site configuration → Build & deploy → Build settings**, confira:

- **Base directory**: `frontend` (é onde fica o `netlify.toml`);
- **Production branch**: `main`;
- **Builds**: ativos (não pausados).

Comando, pasta de publicação, versão do Node e a regra que pula o build quando `frontend/` não mudou estão no `frontend/netlify.toml`. O Netlify publica o frontend sem esperar o CI do GitHub; se o build falhar lá, o site continua na versão anterior.

### Como funciona um deploy do backend

1. Push na `main` (normalmente o merge de um PR).
2. O job `changes` verifica se `backend/**` mudou nesse push.
3. `backend-test` roda `npm ci` e `npm test` contra o DynamoDB Local.
4. Se os dois anteriores passarem, `deploy-backend` assume a role por OIDC, roda `sam build` e `sam deploy --no-confirm-changeset` (stack, região e bucket vêm do `samconfig.toml`). Um push sem mudança na infraestrutura nem no código não falha (`--no-fail-on-empty-changeset`).
5. Deploys nunca rodam em paralelo: um push novo espera o anterior terminar.

Para refazer o deploy do backend sem mudar código (por exemplo, depois de trocar um secret): **Actions → CI → Run workflow** na `main`. Os testes rodam antes, como num push.

Se o deploy falhar no meio, o CloudFormation desfaz sozinho e a versão anterior continua no ar. Os eventos ficam no console do CloudFormation (stack `brco-api`) e no log do job.

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

# Design do BRCO

O BRCO é um **instrumento científico**, não uma landing page. A interface prioriza a leitura dos números e o caminho até o resultado. Decoração só entra quando ajuda a entender.

Os tokens e componentes ficam em [`frontend/src/assets/main.css`](../frontend/src/assets/main.css). Antes de criar um estilo novo num componente, verifique se ele já existe lá.

## Princípios

1. **Superfícies planas.** Bordas de 1px (`--line`) separam as áreas. Sombra só em diálogos.
2. **O laranja guia a ação.** `#f58220` é a cor do livro BR-Caprinos & Ovinos e aparece apenas em:
   - botões de ação principal;
   - item ativo do menu e etapa atual da dieta;
   - o valor-chave de cada resultado (barra à esquerda);
   - barras de inclusão;
   - foco dos campos.
3. **Números em fonte mono tabular** (classe `.num`), para que as colunas de resultado se alinhem.
4. **Texto em sentença, não em Título.** "Calcular exigências", não "Calcular Exigências". Sem emojis na interface.
5. **Movimento mínimo.** Transições de 120–150 ms em hover, foco e troca de página. Nada de animação de scroll. `prefers-reduced-motion` é respeitado.
6. **Sem esperas artificiais.** O botão mostra "Calculando…" pelo tempo real da requisição.
7. **O backend fala, o frontend mostra.** Labels, unidades, limites e mensagens de erro vêm da API (ver README). O Vue só decide layout e aparência.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--brand` | `#f58220` | Ações principais e destaques (com texto `--ink` por cima: 6,6:1) |
| `--brand-hover` | `#e8740f` | Hover do botão principal |
| `--brand-text` | `#a85008` | Laranja para **texto** sobre fundo claro (5,2:1) |
| `--brand-soft` | `#fef1e6` | Fundo de destaque sutil |
| `--ink` / `--ink-2` / `--ink-3` | `#1d1b18` / `#4a4640` / `#6f6a62` | Texto principal, secundário e legendas (todos ≥ 4,5:1) |
| `--bg` / `--surface` / `--surface-2` | `#faf9f6` / `#fff` / `#f3f1ec` | Fundo da página, painéis e áreas neutras |
| `--line` / `--line-strong` | `#e6e2da` / `#d3cec4` | Divisórias e bordas de campos |
| `--ok`, `--warn`, `--danger` | verde, âmbar, vermelho contidos | Status (sempre com o fundo `*-soft`) |

**Não use texto branco sobre o laranja:** o contraste é de 2,6:1, abaixo do mínimo AA.

**Tipografia:** IBM Plex Sans (interface) e IBM Plex Mono (números e rótulos técnicos). As fontes vêm do `@fontsource`, sem CDN externo. Corpo em 15px.

## Componentes base (classes globais)

| Classe | Para quê |
|---|---|
| `.container`, `.page`, `.page-head` | Largura máxima de 1120px, respiro vertical da página e título com subtítulo |
| `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger`, `.btn-sm`, `.btn-block` | Botões |
| `.field`, `.label`, `.input`, `.select`, `.field-error` | Formulários. Campos numéricos do catálogo usam `NumberField.vue` |
| `.segmented` | Escolha entre poucas opções (espécie, idioma, período, abas) |
| `.panel`, `.panel-head`, `.panel-body` | Blocos de conteúdo |
| `.stats`, `.stat`, `.stat.is-key` | Faixa de números principais |
| `.table`, `.table-wrap`, `td.num` | Tabelas de dados (números alinhados à direita) |
| `.pill-ok` / `.pill-warn` / `.pill-info` / `.pill-brand` | Status |
| `.alert-error` / `.alert-info`, `.empty` | Mensagens e estados vazios |
| `.dialog-backdrop`, `.dialog`, `.dialog-head/body/foot` | Diálogos (`role="dialog"` e `aria-modal`) |
| `.spinner` | Indicador inline dentro de botões |

## Acessibilidade

- Link "Pular para o conteúdo", foco visível laranja em todos os elementos interativos e `aria-current` na navegação.
- Todo campo tem `<label>` ligado ao `id`. Erros usam `aria-invalid` e `aria-describedby`.
- Resultados ficam em região `aria-live="polite"`. Os grupos recolhíveis usam `aria-expanded` e `aria-controls`.
- Layout testado em 375px (sem rolagem horizontal) e em desktop.

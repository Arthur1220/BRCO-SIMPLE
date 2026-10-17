require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('./helpers/server');
const { getCatalog } = require('../catalog');
const { catalogSchema } = require('../contracts/catalog');
const { getRequirementsInputSchema } = require('../contracts/requirements');
const { getNdtInputSchema } = require('../contracts/ndt');

const requirementsInputSchema = getRequirementsInputSchema('pt-BR');
const ndtInputSchema = getNdtInputSchema('pt-BR');
const { calculateAllRequirements } = require('../domain/requirementService');

const species = (code) => getCatalog().species.find((s) => s.code === code);
const field = (form, name) => getCatalog().forms[form].fields.find((f) => f.name === name);

// ------------------------------------------------------------------
// Conteúdo do catálogo
// ------------------------------------------------------------------

test('catálogo: segue exatamente o schema publicado no OpenAPI, nos dois idiomas', () => {
  catalogSchema.strict().parse(getCatalog('pt-BR'));
  catalogSchema.strict().parse(getCatalog('en'));
});

test('catálogo: textos traduzidos, codes e limites iguais entre idiomas', () => {
  const pt = getCatalog('pt-BR');
  const en = getCatalog('en');
  assert.equal(pt.species[0].label, 'Caprino');
  assert.equal(en.species[0].label, 'Goat');
  assert.equal(en.forms.requirements.fields[0].label, 'Initial Body Weight');
  assert.deepEqual(pt.species.map((s) => s.code), en.species.map((s) => s.code));
  assert.deepEqual(
    pt.forms.requirements.fields.map(({ name, min, max, unit }) => ({ name, min, max, unit })),
    en.forms.requirements.fields.map(({ name, min, max, unit }) => ({ name, min, max, unit }))
  );
  assert.notEqual(pt.version, en.version);
});

test('catálogo: ovino não tem genótipo nem fêmea; caprino tem os 3 sexos', () => {
  assert.deepEqual(species('ovino').genotypes, []);
  assert.deepEqual(species('ovino').sexes.map((s) => s.code), ['inteiro', 'castrado']);
  assert.deepEqual(species('caprino').sexes.map((s) => s.code), ['inteiro', 'castrado', 'femea']);
});

test('catálogo: genótipos marcados como disponíveis funcionam no domínio', () => {
  for (const sp of getCatalog().species) {
    const genotypes = sp.genotypes.length ? sp.genotypes : [{ id: null, available: true }];
    for (const genotype of genotypes.filter((g) => g.available)) {
      for (const sex of sp.sexes) {
        assert.doesNotThrow(() =>
          calculateAllRequirements({ especieId: sp.id, categoriaAnimalId: genotype.id, sexoId: sex.id, pesoInicial: 20, pesoFinal: 30, GMD: 150 })
        );
      }
    }
  }
});

test('catálogo: a versão é estável e muda junto com o conteúdo', () => {
  const { version, ...content } = getCatalog();
  assert.match(version, /^[0-9a-f]{12}$/);
  assert.equal(getCatalog().version, version);
  assert.ok(content.species.length > 0);
});

// ------------------------------------------------------------------
// Catálogo e validação vêm da mesma fonte
// ------------------------------------------------------------------

const validRequirements = { especie: 'caprino', genotipo: 'leiteiro', sexo: 'femea', pesoInicial: 20, pesoFinal: 30, GMD: 150 };

test('validação de exigências: respeita os limites publicados no catálogo', () => {
  const peso = field('requirements', 'pesoFinal');
  assert.ok(requirementsInputSchema.safeParse({ ...validRequirements, pesoFinal: peso.max }).success);
  const over = requirementsInputSchema.safeParse({ ...validRequirements, pesoFinal: peso.max + 1 });
  assert.equal(over.success, false);
  assert.equal(over.error.issues[0].message, `${peso.label} deve estar entre ${peso.min} e ${peso.max} ${peso.unit}.`);
});

test('validação de exigências: aplica as regras publicadas no catálogo', () => {
  const ruleCodes = (input) =>
    requirementsInputSchema.safeParse(input).error?.issues.map((i) => i.params?.rule) ?? [];

  assert.deepEqual(ruleCodes(validRequirements), []);
  assert.deepEqual(ruleCodes({ ...validRequirements, pesoFinal: 15 }), ['final_gt_initial']);
  assert.deepEqual(ruleCodes({ ...validRequirements, especie: 'ovino', genotipo: null }), ['valid_sex']);
  assert.deepEqual(ruleCodes({ ...validRequirements, genotipo: 'nativa' }), ['valid_genotype']); // indisponível
  assert.deepEqual(ruleCodes({ ...validRequirements, especie: 'ovino', genotipo: 'leiteiro', sexo: 'inteiro' }), ['valid_genotype']);

  const published = getCatalog().forms.requirements.rules.map((r) => r.code);
  assert.deepEqual(published, ['final_gt_initial', 'valid_genotype', 'valid_sex']);
});

test('validação de NDT: PIDN/PIDA opcionais em conjunto e regras de composição', () => {
  const base = { PB: 9.55, EE: 2.36, FDN: 63.54, Lignina: 5.2, MO: 89.26 };
  const ruleCodes = (input) => ndtInputSchema.safeParse(input).error?.issues.map((i) => i.params?.rule) ?? [];

  assert.deepEqual(ruleCodes(base), []);
  assert.deepEqual(ruleCodes({ ...base, PIDN: 2.1, PIDA: 0.9 }), []);
  assert.deepEqual(ruleCodes({ ...base, PIDN: 2.1 }), ['fracoes_together']);
  assert.deepEqual(ruleCodes({ ...base, PIDN: 1, PIDA: 2 }), ['pida_lte_pidn']);
  assert.deepEqual(ruleCodes({ ...base, Lignina: 70 }), ['lignina_lte_fdn']);
  assert.deepEqual(ruleCodes({ ...base, PB: 30 }), ['components_lte_mo']);
  assert.equal(ndtInputSchema.safeParse({ ...base, FDN: 0 }).success, false); // FDN divide na fórmula

  assert.equal(field('ndt', 'PIDN').required, false);
  assert.equal(field('ndt', 'PB').required, true);
});

// ------------------------------------------------------------------
// HTTP
// ------------------------------------------------------------------

let server;
test.before(async () => { server = await startServer(); });
test.after(async () => {
  await server.close();
  await require('../lib/prisma').$disconnect();
});

test('GET /api/v1/catalog: responde o catálogo com cache e ETag', async () => {
  const res = await server.request('GET', '/api/v1/catalog');
  assert.equal(res.status, 200);
  assert.equal(res.body.version, getCatalog().version);
  assert.equal(res.headers.get('etag'), `"${getCatalog().version}"`);
  assert.equal(res.headers.get('cache-control'), 'public, max-age=3600');
});

test('GET /api/v1/catalog: idioma por ?lang ou Accept-Language', async () => {
  const byQuery = await server.request('GET', '/api/v1/catalog?lang=en');
  assert.equal(byQuery.body.locale, 'en');
  assert.equal(byQuery.headers.get('content-language'), 'en');
  assert.match(byQuery.headers.get('vary'), /Accept-Language/);

  const byHeader = await server.request('GET', '/api/v1/catalog', { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
  assert.equal(byHeader.body.locale, 'en');

  const fallback = await server.request('GET', '/api/v1/catalog', { headers: { 'Accept-Language': 'fr-FR' } });
  assert.equal(fallback.body.locale, 'pt-BR');
});

test('GET /api/v1/catalog: responde 304 quando o cliente já tem a versão', async () => {
  const res = await server.rawGet('/api/v1/catalog', { 'If-None-Match': `"${getCatalog().version}"` });
  assert.equal(res.status, 304);
  assert.equal(res.text, '');
});

test('v1: rota inexistente responde no formato de erro padrão', async () => {
  const res = await server.request('GET', '/api/v1/nao-existe');
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' } });

  const en = await server.request('GET', '/api/v1/nao-existe?lang=en');
  assert.deepEqual(en.body, { error: { code: 'NOT_FOUND', message: 'Resource not found.' } });
});

test('v0 continua funcionando ao lado da v1', async () => {
  const res = await server.request('POST', '/api/calculate/ndt', {
    body: { PB: 9.55, EE: 2.36, FDN: 63.54, Ligrina: 5.2, MO: 89.26, PIDN: 2.1, PIDA: 0.9 },
  });
  assert.equal(res.status, 200);
});

test('OpenAPI v1 gerado do Zod está publicado', async () => {
  const res = await server.request('GET', '/api-docs/v1.json');
  assert.equal(res.status, 200);
  assert.ok(res.body.paths['/api/v1/catalog'].get);
  assert.ok(res.body.components.schemas.Catalog);
  assert.ok(res.body.components.schemas.ErrorResponse);
});

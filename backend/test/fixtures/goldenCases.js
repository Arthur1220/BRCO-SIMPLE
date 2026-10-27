/**
 * Casos de entrada usados nos testes "golden" das fórmulas científicas.
 * Os resultados esperados ficam em golden.json e foram gerados a partir do código
 * atual (regressão). Valide-os contra a planilha/livro BR-CORTE e, ao corrigir uma
 * fórmula de propósito, regenere com: npm run test:update-golden
 */
const requirementCases = [];
// Caprinos leiteiros (categoria 1) x sexos 1 (inteiro), 2 (castrado), 3 (fêmea).
// As categorias 2 (nativa) e 3 (corte) hoje quebram: ver test.todo em requirementService.test.js.
for (const sexoId of [1, 2, 3]) {
  requirementCases.push({
    name: `caprino categoria 1 sexo ${sexoId}`,
    input: { especieId: 1, categoriaAnimalId: 1, sexoId, pesoInicial: 20, pesoFinal: 30, GMD: 150 },
  });
}
// Ovinos: sexos 1, 2, 3
for (const sexoId of [1, 2, 3]) {
  requirementCases.push({
    name: `ovino sexo ${sexoId}`,
    input: { especieId: 2, categoriaAnimalId: null, sexoId, pesoInicial: 25, pesoFinal: 35, GMD: 200 },
  });
}

const ndtCases = [
  { name: 'com frações proteicas', input: { PB: 9.55, EE: 2.36, FDN: 63.54, Ligrina: 5.2, MO: 89.26, PIDN: 2.1, PIDA: 0.9 } },
  { name: 'sem PIDN/PIDA', input: { PB: 17.45, EE: 3.81, FDN: 38.34, Ligrina: 4.0, MO: 94.06, PIDN: 0, PIDA: 0 } },
];

module.exports = { requirementCases, ndtCases };

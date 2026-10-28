/**
 * Arredondamento para a dieta e sua apresentação.
 *
 * O `round` de domain/calculationConstants (usado nas exigências, que não mudam sem
 * revisão técnica) monta "valor + 'e' + casas" e devolve NaN para números muito
 * pequenos em notação científica (ex.: 1e-13, resto do solver). Este não tem esse
 * problema e mantém o mesmo comportamento para valores ausentes (0).
 */
function round(value, decimals = 2) {
    if (!value && value !== 0) return 0;
    const factor = 10 ** decimals;
    return Math.round((value + Math.sign(value) * Number.EPSILON) * factor) / factor;
}

module.exports = { round };

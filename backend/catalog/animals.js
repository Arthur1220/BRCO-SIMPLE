/**
 * Espécies, genótipos e sexos aceitos pelos cálculos.
 * Os `id` são os usados pelo domínio (requirementService); os `code` são os
 * identificadores estáveis da API v1.
 * A estrutura já expressa as combinações válidas: o frontend só lista o que
 * vem aqui, sem regras próprias.
 */
const SEXES = {
    inteiro: { id: 1, code: 'inteiro', label: 'Macho Inteiro' },
    castrado: { id: 2, code: 'castrado', label: 'Macho Castrado' },
    femea: { id: 3, code: 'femea', label: 'Fêmea' },
};

const SPECIES = [
    {
        id: 1,
        code: 'caprino',
        label: 'Caprino',
        genotypes: [
            { id: 1, code: 'leiteiro', label: 'Leiteiro', available: true },
            // Hoje o domínio quebra para estes genótipos (constantes sem divisão por sexo).
            // Ficam indisponíveis até a equipe definir a fórmula correta.
            { id: 2, code: 'nativa', label: 'Nativa', available: false, unavailableReason: 'Em revisão pela equipe técnica.' },
            { id: 3, code: 'corte', label: 'Corte', available: false, unavailableReason: 'Em revisão pela equipe técnica.' },
        ],
        sexes: [SEXES.inteiro, SEXES.castrado, SEXES.femea],
    },
    {
        id: 2,
        code: 'ovino',
        label: 'Ovino',
        genotypes: [],
        sexes: [SEXES.inteiro, SEXES.castrado],
    },
];

function findSpecies(code) {
    return SPECIES.find((species) => species.code === code);
}

module.exports = { SPECIES, SEXES, findSpecies };

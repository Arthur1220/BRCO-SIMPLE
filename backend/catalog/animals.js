const { L } = require('../lib/i18n');

/**
 * Espécies, genótipos e sexos aceitos pelos cálculos.
 * Os `id` são os usados pelo domínio (requirementService); os `code` são os
 * identificadores estáveis da API v1.
 * A estrutura já expressa as combinações válidas: o frontend só lista o que
 * vem aqui, sem regras próprias.
 */
const SEXES = {
    inteiro: { id: 1, code: 'inteiro', label: L('Macho Inteiro', 'Intact Male') },
    castrado: { id: 2, code: 'castrado', label: L('Macho Castrado', 'Castrated Male') },
    femea: { id: 3, code: 'femea', label: L('Fêmea', 'Female') },
};

const UNDER_REVIEW = L('Em revisão pela equipe técnica.', 'Under review by the technical team.');

const SPECIES = [
    {
        id: 1,
        code: 'caprino',
        label: L('Caprino', 'Goat'),
        genotypes: [
            { id: 1, code: 'leiteiro', label: L('Leiteiro', 'Dairy'), available: true },
            // Hoje o domínio quebra para estes genótipos (constantes sem divisão por sexo).
            // Ficam indisponíveis até a equipe de cálculo validar a fórmula.
            { id: 2, code: 'nativa', label: L('Nativa', 'Native'), available: false, unavailableReason: UNDER_REVIEW },
            { id: 3, code: 'corte', label: L('Corte', 'Meat'), available: false, unavailableReason: UNDER_REVIEW },
        ],
        sexes: [SEXES.inteiro, SEXES.castrado, SEXES.femea],
    },
    {
        id: 2,
        code: 'ovino',
        label: L('Ovino', 'Sheep'),
        genotypes: [],
        sexes: [SEXES.inteiro, SEXES.castrado],
    },
];

function findSpecies(code) {
    return SPECIES.find((species) => species.code === code);
}

/**
 * Converte os codes da v1 nos ids usados pelo domínio.
 */
function toDomainAnimal({ especie, genotipo, sexo, pesoInicial, pesoFinal, GMD }) {
    const species = findSpecies(especie);
    const genotype = species.genotypes.find((g) => g.code === genotipo);
    return {
        especieId: species.id,
        categoriaAnimalId: genotype ? genotype.id : null,
        sexoId: SEXES[sexo].id,
        pesoInicial,
        pesoFinal,
        GMD,
    };
}

module.exports = { SPECIES, SEXES, findSpecies, toDomainAnimal };

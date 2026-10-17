const { t } = require('../lib/i18n');
const { round } = require('../domain/calculationConstants');
const { findCategory, DIET_RULES } = require('../catalog/diet');
const {
    REQUIREMENT_GROUPS, REQUIREMENT_HIGHLIGHTS, requirementOutputs,
    NDT_GROUPS, NDT_HIGHLIGHTS, ndtOutputs,
    DIET_BALANCE, BALANCE_STATUS, DIET_OPTIONS, DIET_STATUS,
    normalizeUnit,
} = require('../catalog/outputs');
const { presentGroupedResult } = require('./results');

const REQUIREMENTS_LAYOUT = { outputs: requirementOutputs, groups: REQUIREMENT_GROUPS, highlights: REQUIREMENT_HIGHLIGHTS };
const NDT_LAYOUT = { outputs: ndtOutputs, groups: NDT_GROUPS, highlights: NDT_HIGHLIGHTS };

/**
 * Status de um nutriente da dieta (regra antes duplicada no DietResultsTable).
 * Ideal: diferença dentro da tolerância, ou sobra < 0,1.
 */
function balanceStatus(required, diff) {
    if (required === 0) return 'info';
    const percentDiff = (diff / required) * 100;
    if (Math.abs(percentDiff) <= DIET_RULES.tolerancePercent || (diff >= 0 && diff < 0.1)) return 'ideal';
    return diff < 0 ? 'deficit' : 'excess';
}

/**
 * Converte uma solução do solver (processSolution) no formato da v1.
 */
function presentSolution(solution, locale) {
    const intakeG = solution.dietSupply['Consumo Estimado (g)'];

    const ingredients = solution.optimizedIngredients.map((ing) => {
        const kgPerDay = (intakeG * (ing.percent / 100)) / 1000;
        const category = findCategory(ing.category);
        return {
            foodId: ing.foodId ?? null,
            name: ing.name,
            category: ing.category,
            categoryLabel: category ? t(category.label, locale) : ing.category,
            percent: ing.percent,
            kgPerDay: round(kgPerDay, 3),
            costPerDay: round(kgPerDay * Number(ing.price || 0), 2),
            min: ing.min,
            max: ing.max,
            price: ing.price,
        };
    });

    const balance = DIET_BALANCE.map((meta) => {
        const raw = solution.dietBalance[meta.key];
        const status = balanceStatus(raw.required, raw.diff);
        return {
            code: meta.code,
            label: t(meta.label, locale),
            unit: normalizeUnit(raw.unit),
            required: raw.required,
            supplied: raw.supplied,
            diff: raw.diff,
            status,
            statusLabel: t(BALANCE_STATUS[status], locale),
        };
    });

    return {
        feasible: solution.isFeasible,
        ingredients,
        totals: {
            intakeKgPerDay: round(intakeG / 1000, 3),
            costPerDay: round(solution.dietSupply['Custo Total'], 2),
        },
        balance,
    };
}

/**
 * Cabeçalho comum de qualquer cálculo salvo.
 */
function presentHeader(record) {
    return {
        calculationId: record.id,
        type: record.type,
        engineVersion: record.engineVersion,
        createdAt: record.createdAt.toISOString(),
        expiresAt: record.expiresAt.toISOString(),
        input: record.input,
    };
}

/**
 * Resposta completa de um cálculo no idioma pedido.
 * `record` = { id, type, engineVersion, createdAt, expiresAt, input, output } (output = resultado bruto do domínio).
 */
function presentCalculation(record, locale) {
    const header = presentHeader(record);

    if (record.type === 'requirements') {
        return { ...header, ...presentGroupedResult(record.output, REQUIREMENTS_LAYOUT, locale) };
    }

    if (record.type === 'ndt') {
        return { ...header, ...presentGroupedResult(record.output, NDT_LAYOUT, locale) };
    }

    // Dieta
    const { output } = record;
    const requirements = presentGroupedResult(output.animalRequirements, REQUIREMENTS_LAYOUT, locale);

    if (!output.hasConflict) {
        return {
            ...header,
            status: 'optimal',
            statusLabel: t(DIET_STATUS.optimal, locale),
            solution: presentSolution(output.result, locale),
            requirements,
        };
    }

    return {
        ...header,
        status: 'conflict',
        statusLabel: t(DIET_STATUS.conflict, locale),
        options: [
            { code: 'ideal', label: t(DIET_OPTIONS.ideal.label, locale), description: t(DIET_OPTIONS.ideal.description, locale), solution: presentSolution(output.resultIdeal, locale) },
            { code: 'realistic', label: t(DIET_OPTIONS.realistic.label, locale), description: t(DIET_OPTIONS.realistic.description, locale), solution: presentSolution(output.resultRealistic, locale) },
        ],
        requirements,
    };
}

module.exports = { presentCalculation, presentSolution, balanceStatus };

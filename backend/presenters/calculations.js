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
const { SAFETY_CHECKS, DIET_WARNINGS, SEVERITY_LABELS, NUTRIENT_LABELS } = require('../catalog/dietSafety');

const REQUIREMENTS_LAYOUT = { outputs: requirementOutputs, groups: REQUIREMENT_GROUPS, highlights: REQUIREMENT_HIGHLIGHTS };
const NDT_LAYOUT = { outputs: ndtOutputs, groups: NDT_GROUPS, highlights: NDT_HIGHLIGHTS };

/**
 * Status de um nutriente da dieta (regra antes duplicada no DietResultsTable).
 * Ideal: diferença dentro da tolerância, ou sobra < 0,1.
 */
function balanceStatus(required, diff) {
    if (!required) return 'info'; // exigência indisponível ou zero
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
        // Cálculos salvos antes das travas de segurança não têm estes campos.
        safetyChecks: (solution.safetyChecks ?? []).map((check) => presentSafetyCheck(check, locale)),
        warnings: (solution.warnings ?? []).map((item) => presentWarning(item, locale)),
    };
}

const SAFETY_CHECKS_BY_CODE = new Map(SAFETY_CHECKS.map((check) => [check.code, check]));

function presentSafetyCheck(check, locale) {
    const meta = SAFETY_CHECKS_BY_CODE.get(check.code);
    return { ...check, label: t(meta.label, locale), unit: meta.unit };
}

/**
 * Aviso no idioma pedido: os parâmetros (códigos de nutriente, de trava e
 * listas de alimentos) viram texto dentro da mensagem.
 */
function presentWarning({ code, severity, params = {} }, locale) {
    const number = (value) => (typeof value === 'number' ? value.toLocaleString(locale) : value);
    const text = {
        ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, number(value)])),
        nutrient: params.nutrient && NUTRIENT_LABELS[params.nutrient] ? t(NUTRIENT_LABELS[params.nutrient], locale) : params.nutrient,
        foods: Array.isArray(params.foods) ? params.foods.join(', ') : params.foods,
        checks: Array.isArray(params.checks)
            ? params.checks.map((c) => (SAFETY_CHECKS_BY_CODE.has(c) ? t(SAFETY_CHECKS_BY_CODE.get(c).label, locale) : c)).join(', ')
            : params.checks,
    };
    const message = t(DIET_WARNINGS[code].message, locale).replace(/\{(\w+)\}/g, (_, key) => String(text[key] ?? ''));
    return { code, severity, severityLabel: t(SEVERITY_LABELS[severity], locale), message };
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

    const noSafeDiet = !output.resultIdeal.isFeasible && !output.resultRealistic.isFeasible;
    return {
        ...header,
        status: 'conflict',
        statusLabel: t(noSafeDiet ? DIET_STATUS.blocked : DIET_STATUS.conflict, locale),
        options: [
            { code: 'ideal', label: t(DIET_OPTIONS.ideal.label, locale), description: t(DIET_OPTIONS.ideal.description, locale), solution: presentSolution(output.resultIdeal, locale) },
            { code: 'realistic', label: t(DIET_OPTIONS.realistic.label, locale), description: t(DIET_OPTIONS.realistic.description, locale), solution: presentSolution(output.resultRealistic, locale) },
        ],
        requirements,
    };
}

module.exports = { presentCalculation, presentSolution, balanceStatus };

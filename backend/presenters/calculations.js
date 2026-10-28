const { t } = require('../lib/i18n');
const { round } = require('../domain/calculationConstants');
const { findCategory, DIET_RULES } = require('../catalog/diet');
const {
    REQUIREMENT_GROUPS, REQUIREMENT_HIGHLIGHTS, requirementOutputs,
    NDT_GROUPS, NDT_HIGHLIGHTS, ndtOutputs,
    DIET_BALANCE, BALANCE_STATUS, DIET_OPTIONS, DIET_STATUS, COST_INSIGHTS, NUTRIENT_SHORT,
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

const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
const money = (value, locale) => `R$ ${Number(value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;

// kg de matéria natural a partir de kg de MS (null se a MS do alimento não é conhecida).
const asFed = (kgDryMatter, ms) => (Number(ms) > 0 ? kgDryMatter / (Number(ms) / 1000) : null);

/**
 * Explicação do custo no idioma pedido. Preços na base escolhida pelo usuário.
 */
function presentCostInsights(insights, ingredients, priceBasis, locale) {
    if (!insights) return null;
    const byName = new Map(ingredients.map((ing) => [ing.name, ing]));
    const priceIn = (pricePerKgMS, name) => {
        const ms = Number(byName.get(name)?.MS) / 1000;
        const value = priceBasis === 'MN' && ms > 0 ? pricePerKgMS * ms : pricePerKgMS;
        return `${money(value, locale)}/kg ${priceBasis}`;
    };
    const SAFETY = new Map(SAFETY_CHECKS.map((c) => [c.code, c]));
    return {
        limiting: insights.limiting.map((item) => {
            const values = {
                value: item.deltaPerDay === undefined ? '' : money(Math.abs(item.deltaPerDay), locale),
                food: item.foodName,
                limit: item.limit,
                label: item.kind === 'safety' ? t(SAFETY.get(item.code).label, locale) : t(NUTRIENT_SHORT[item.code] ?? { 'pt-BR': item.code, en: item.code }, locale),
            };
            return { ...item, message: fill(t(COST_INSIGHTS[item.kind], locale), values) };
        }),
        unusedFoods: insights.unusedFoods.map((item) => ({
            ...item,
            message: item.breakEvenPrice === null
                ? fill(t(COST_INSIGHTS.unusedNever, locale), { food: item.foodName })
                : fill(t(COST_INSIGHTS.unusedEnters, locale), {
                    food: item.foodName,
                    price: priceIn(item.breakEvenPrice, item.foodName),
                    current: priceIn(item.price, item.foodName),
                }),
        })),
    };
}

/**
 * Converte uma solução do solver (processSolution) no formato da v1.
 * `input` (entrada validada da dieta) traz lote, base do preço e GMD.
 */
function presentSolution(solution, locale, input = {}) {
    const intakeG = solution.dietSupply['Consumo Estimado (g)'];
    const priceBasis = input.priceBasis ?? 'MS';
    const lot = { animals: input.lot?.animals ?? 1, feedingsPerDay: input.lot?.feedingsPerDay ?? 1 };

    const ingredients = solution.optimizedIngredients.map((ing) => {
        const kgPerDay = (intakeG * (ing.percent / 100)) / 1000;
        const kgAsFed = asFed(kgPerDay, ing.MS);
        const category = findCategory(ing.category);
        return {
            foodId: ing.foodId ?? null,
            name: ing.name,
            category: ing.category,
            categoryLabel: category ? t(category.label, locale) : ing.category,
            percent: ing.percent,
            kgPerDay: round(kgPerDay, 3),
            kgAsFedPerDay: kgAsFed === null ? null : round(kgAsFed, 3),
            costPerDay: round(kgPerDay * Number(ing.price || 0), 2),
            min: ing.min,
            max: ing.max,
            price: ing.price,
            priceAsFed: Number(ing.MS) > 0 ? round(Number(ing.price || 0) * (Number(ing.MS) / 1000), 3) : null,
            dryMatter: ing.MS ?? null,
        };
    });

    // Cocho: kg de matéria natural por animal, por lote e por trato.
    const missingDryMatter = ingredients.some((ing) => ing.percent > 0 && ing.kgAsFedPerDay === null);
    const kgAsFedPerDay = missingDryMatter ? null : ingredients.reduce((sum, ing) => sum + (ing.kgAsFedPerDay ?? 0), 0);
    const costPerDay = solution.dietSupply['Custo Total'];
    const gainKg = Number(input.animal?.GMD ?? 0) / 1000;
    const feeding = {
        animals: lot.animals,
        feedingsPerDay: lot.feedingsPerDay,
        kgDryMatterPerDay: round((intakeG / 1000) * lot.animals, 2),
        kgAsFedPerDay: kgAsFedPerDay === null ? null : round(kgAsFedPerDay * lot.animals, 2),
        costPerDay: round(costPerDay * lot.animals, 2),
        perFeeding: ingredients.filter((ing) => ing.percent > 0).map((ing) => ({
            foodId: ing.foodId,
            name: ing.name,
            kgAsFed: ing.kgAsFedPerDay === null ? null : round((ing.kgAsFedPerDay * lot.animals) / lot.feedingsPerDay, 2),
            kgDryMatter: round((ing.kgPerDay * lot.animals) / lot.feedingsPerDay, 2),
        })),
    };

    const balance = DIET_BALANCE.filter((meta) => solution.dietBalance[meta.key]).map((meta) => {
        const raw = solution.dietBalance[meta.key];
        const status = raw.supplied === null ? 'info' : balanceStatus(raw.required, raw.diff);
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
            intakeKgAsFedPerDay: kgAsFedPerDay === null ? null : round(kgAsFedPerDay, 3),
            costPerDay: round(costPerDay, 2),
            costPerKgGain: gainKg > 0 ? round(costPerDay / gainKg, 2) : null,
        },
        priceBasis,
        feeding,
        balance,
        costInsights: presentCostInsights(solution.costInsights, solution.optimizedIngredients, priceBasis, locale),
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
            solution: presentSolution(output.result, locale, record.input),
            requirements,
        };
    }

    const noSafeDiet = !output.resultIdeal.isFeasible && !output.resultRealistic.isFeasible;
    return {
        ...header,
        status: 'conflict',
        statusLabel: t(noSafeDiet ? DIET_STATUS.blocked : DIET_STATUS.conflict, locale),
        options: [
            { code: 'ideal', label: t(DIET_OPTIONS.ideal.label, locale), description: t(DIET_OPTIONS.ideal.description, locale), solution: presentSolution(output.resultIdeal, locale, record.input) },
            { code: 'realistic', label: t(DIET_OPTIONS.realistic.label, locale), description: t(DIET_OPTIONS.realistic.description, locale), solution: presentSolution(output.resultRealistic, locale, record.input) },
        ],
        requirements,
    };
}

module.exports = { presentCalculation, presentSolution, balanceStatus };

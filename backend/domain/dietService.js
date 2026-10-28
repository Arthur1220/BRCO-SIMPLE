const { calculateAllRequirements } = require('./requirementService');
const { round } = require('./calculationConstants');
const solver = require('javascript-lp-solver');
const {
    DIET_SAFETY, UREA_PB_EQUIVALENT, TRUE_PROTEIN_MAX, SPECIES_CODES, MALE_SEX_IDS, DIET_WARNINGS,
} = require('../catalog/dietSafety');

/**
 * Formulação de dieta de custo mínimo.
 *
 * Usa as exigências de requirementService sem alterá-las: aqui só ficam a
 * otimização, o balanço e as travas de segurança da dieta (catalog/dietSafety).
 * Todos os nutrientes dos alimentos chegam em g/kg MS (Cu e Mo em mg/kg MS).
 */

const isConcentrate = (category) => category === 'CONCENTRADO' || category === 'ENERGETICO' || category === 'PROTEICO';

/**
 * Valor numérico de um campo, ou null quando o dado não foi informado.
 */
function optionalNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * Composição do alimento em g/kg MS (null = dado ausente).
 * Sem NNP informado, PB acima de 1000 g/kg (impossível para proteína verdadeira,
 * caso da ureia) é tratada como NNP.
 */
function composition(ing) {
    const PB = optionalNumber(ing.PB) ?? 0;
    return {
        PB,
        NDT: optionalNumber(ing.NDT) ?? 0,
        FDN: optionalNumber(ing.FDNcp) ?? 0,
        Ca: optionalNumber(ing.Ca) ?? 0,
        P: optionalNumber(ing.P) ?? 0,
        EE: optionalNumber(ing.EE),
        CNF: optionalNumber(ing.CNF),
        PDR: optionalNumber(ing.PDR),
        PNDR: optionalNumber(ing.PNDR),
        Cu: optionalNumber(ing.Cu),
        Mo: optionalNumber(ing.Mo),
        S: optionalNumber(ing.S),
        Zn: optionalNumber(ing.Zn),
        Mn: optionalNumber(ing.Mn),
        Fe: optionalNumber(ing.Fe),
        Co: optionalNumber(ing.Co),
        NNP: optionalNumber(ing.NNP) ?? (PB > TRUE_PROTEIN_MAX ? PB : 0),
    };
}

const toPercent = (gPerKg) => gPerKg / 10;

// Microminerais do balanço: campo do alimento (mg/kg MS) e exigência dietética (mg/dia).
const MICROMINERALS = [
    { field: 'Cu', key: 'Cobre', requirement: 'Cobre Dietético' },
    { field: 'Zn', key: 'Zinco', requirement: 'Zinco Dietético' },
    { field: 'Mn', key: 'Manganês', requirement: 'Manganês Dietético' },
    { field: 'Fe', key: 'Ferro', requirement: 'Ferro Dietético' },
    { field: 'Co', key: 'Cobalto', requirement: 'Cobalto Dietético' },
];

/**
 * Valor de uma exigência usando a primeira chave encontrada (0 se nenhuma existir).
 */
function getRequirementValue(requirements, possibleKeys) {
    for (const key of possibleKeys) {
        if (requirements[key] && requirements[key].valor_requerido !== undefined) {
            return requirements[key].valor_requerido;
        }
    }
    return 0;
}

/**
 * Exigência dietética de um mineral, ou null quando ela não está disponível
 * (ausente, zero ou inválida) para este animal.
 */
function dietaryRequirement(requirements, key) {
    const value = requirements[key]?.valor_requerido;
    return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Travas de segurança ativas para o animal: código → { coefficient(c), min | max }.
 */
function safetyConstraints(context) {
    const s = DIET_SAFETY;
    const constraints = {
        ee: { coefficient: (c) => toPercent(c.EE ?? 0), max: s.eeMaxPercent },
        fdn: { coefficient: (c) => toPercent(c.FDN), min: s.fdnMinPercent },
        cnf: { coefficient: (c) => toPercent(c.CNF ?? 0), max: s.cnfMaxPercent },
        urea: { coefficient: (c) => toPercent(c.NNP), max: (s.ureaMaxPercent * UREA_PB_EQUIVALENT) / 1000 },
        nnp_share: { coefficient: (c) => c.NNP - c.PB * s.nnpMaxShareOfPb, max: 0 },
        s: { coefficient: (c) => toPercent(c.S ?? 0), max: s.sulfurMaxPercent },
    };
    if (context.isMale) {
        constraints.ca_p = { coefficient: (c) => c.Ca - s.caPMinMale * c.P, min: 0 };
    }
    if (context.species === 'ovino') {
        constraints.cu = { coefficient: (c) => c.Cu ?? 0, max: s.copperMaxSheep };
    }
    return constraints;
}

/**
 * Monta o modelo de programação linear.
 * - strictNutrients: exige PB e NDT mínimos;
 * - limits: 'user' (limites informados na dieta) ou 'food' (só os padrões do alimento);
 * - safety: travas aplicadas (código → definição).
 */
function buildModel(prepared, targets, { strictNutrients, limits, safety }) {
    const model = {
        optimize: 'cost',
        opType: 'min',
        constraints: {
            weight: { equal: 1 },
            FDN_Volumoso: { min: 18 },
            Total_Suplemento: { max: 0.015 },
            Total_Volumoso: { min: 0.01 },
            Total_Concentrado: { min: 0.01 },
        },
        variables: {},
    };

    if (strictNutrients) {
        model.constraints.PB = { min: targets.PB };
        model.constraints.NDT = { min: targets.NDT };
        // PDR e PNDR só entram quando todos os alimentos têm o dado (targets.PDR definido).
        if (targets.PDR !== undefined) model.constraints.PDR = { min: targets.PDR };
        if (targets.PNDR !== undefined) model.constraints.PNDR = { min: targets.PNDR };
    }

    for (const [code, def] of Object.entries(safety)) {
        model.constraints[`safety_${code}`] = def.min !== undefined ? { min: def.min } : { max: def.max };
    }

    prepared.forEach(({ ing, comp, blocked }, index) => {
        const key = `ing_${index}`;
        const variable = {
            weight: 1,
            PB: toPercent(comp.PB),
            NDT: toPercent(comp.NDT),
            PDR: toPercent(comp.PDR ?? 0),
            PNDR: toPercent(comp.PNDR ?? 0),
            cost: Number(ing.price) > 0 ? Number(ing.price) : 0.001,
        };

        if (ing.category === 'VOLUMOSO') {
            variable.FDN_Volumoso = toPercent(comp.FDN);
            variable.Total_Volumoso = 1;
        } else if (isConcentrate(ing.category)) {
            variable.Total_Concentrado = 1;
        } else if (ing.category === 'SUPLEMENTO') {
            variable.Total_Suplemento = 1;
        }

        for (const [code, def] of Object.entries(safety)) {
            variable[`safety_${code}`] = def.coefficient(comp);
        }

        const source = limits === 'food'
            ? { min: ing.foodMin, max: ing.foodMax }
            : { min: ing.min, max: ing.max };
        const min = optionalNumber(source.min) ?? 0;
        const max = blocked ? 0 : (optionalNumber(source.max) ?? 100);

        model.constraints[`limit_min_${key}`] = { min: Math.min(min, max) / 100 };
        model.constraints[`limit_max_${key}`] = { max: max / 100 };
        variable[`limit_min_${key}`] = 1;
        variable[`limit_max_${key}`] = 1;

        model.variables[key] = variable;
    });

    return model;
}

/**
 * Resolve o modelo; se for inviável, descobre quais travas de segurança impedem a
 * solução (retirando uma por vez).
 */
function solve(prepared, targets, options) {
    const solution = solver.Solve(buildModel(prepared, targets, options));
    if (solution.feasible) return { solution, blocking: [] };

    const blocking = Object.keys(options.safety).filter((code) => {
        const { [code]: _removed, ...rest } = options.safety;
        return solver.Solve(buildModel(prepared, targets, { ...options, safety: rest })).feasible;
    });
    return { solution: null, blocking };
}

const warning = (code, params = {}) => ({ code, severity: DIET_WARNINGS[code].severity, params });

/**
 * Verificações de segurança da dieta resolvida (valor, limite e se está ok).
 */
function safetyChecks(included, context) {
    const s = DIET_SAFETY;
    const sum = (fn) => included.reduce((total, item) => total + item.x * fn(item.comp), 0);
    // Para nutrientes opcionais: null se nenhum alimento da dieta tem o dado.
    const optionalSum = (field) => {
        const known = included.filter((item) => item.comp[field] !== null);
        if (known.length === 0) return { value: null, incomplete: included.length > 0 };
        return { value: sum((c) => c[field] ?? 0), incomplete: known.length < included.length };
    };

    const ee = optionalSum('EE');
    const cnf = optionalSum('CNF');
    const cu = optionalSum('Cu');
    const sulfur = optionalSum('S');
    const totalPB = sum((c) => c.PB);
    const totalNNP = sum((c) => c.NNP);
    const totalP = sum((c) => c.P);

    const check = (code, value, limit, kind, incomplete = false) => {
        // Compara já arredondado: o solver para exatamente no limite (45,0000001 é 45).
        const rounded = value === null ? null : round(value, 2);
        const ok = rounded === null || limit === null ? null : (kind === 'max' ? rounded <= limit : rounded >= limit);
        return { code, value: rounded, limit, kind, ok, incomplete };
    };

    return [
        check('ee', ee.value === null ? null : toPercent(ee.value), s.eeMaxPercent, 'max', ee.incomplete),
        check('fdn', toPercent(sum((c) => c.FDN)), s.fdnMinPercent, 'min'),
        check('cnf', cnf.value === null ? null : toPercent(cnf.value), s.cnfMaxPercent, 'max', cnf.incomplete),
        check('ca_p', totalP > 0 ? sum((c) => c.Ca) / totalP : null, context.isMale ? s.caPMinMale : null, 'min'),
        check('urea', (totalNNP / UREA_PB_EQUIVALENT) * 100, s.ureaMaxPercent, 'max'),
        check('nnp_share', totalPB > 0 ? (totalNNP / totalPB) * 100 : 0, round(s.nnpMaxShareOfPb * 100, 2), 'max'),
        check('cu', cu.value, context.species === 'ovino' ? s.copperMaxSheep : null, 'max', cu.incomplete),
        check('s', sulfur.value === null ? null : toPercent(sulfur.value), s.sulfurMaxPercent, 'max', sulfur.incomplete),
        check('concentrate', sum((c) => c.concentrate) * 100, null, 'max'),
    ];
}

/**
 * Avisos que dependem da dieta resolvida.
 */
function solutionWarnings(included, context) {
    const s = DIET_SAFETY;
    const warnings = [];
    const namesMissing = (field) => included.filter((item) => item.comp[field] === null).map((item) => item.ing.name);

    const fields = ['EE', 'CNF', ...(context.species === 'ovino' ? ['Cu'] : [])];
    for (const field of fields) {
        const foods = namesMissing(field);
        if (foods.length > 0) warnings.push(warning('missing_data', { nutrient: field, foods }));
    }

    const sum = (fn) => included.reduce((total, item) => total + item.x * fn(item.comp), 0);
    if (context.species === 'ovino') {
        const cu = sum((c) => c.Cu ?? 0);
        const mo = sum((c) => c.Mo ?? 0);
        const ratio = mo > 0 ? cu / mo : null;
        if (ratio !== null && (ratio < s.cuMoRange[0] || ratio > s.cuMoRange[1])) {
            warnings.push(warning('cu_mo_ratio', { ratio: round(ratio, 1), min: s.cuMoRange[0], max: s.cuMoRange[1] }));
        }
    }

    if (sum((c) => c.NNP) > 0) warnings.push(warning('urea_adaptation'));

    const concentrate = sum((c) => c.concentrate) * 100;
    if (concentrate > s.concentrateAdaptationPercent) {
        warnings.push(warning('concentrate_adaptation', { value: round(concentrate, 1) }));
    }
    if (context.isMale && concentrate > s.maleUrolithiasisConcentratePercent) {
        warnings.push(warning('urolithiasis_males'));
    }
    return warnings;
}

/**
 * Converte a solução do solver em ingredientes, fornecimento, balanço,
 * verificações de segurança e avisos. Solução inviável sai com tudo em 0%.
 */
function processSolution(solution, prepared, requirements, targetCMS_g, status, extraWarnings) {
    const isFeasible = Boolean(solution);
    const supply = {
        'Consumo Estimado (g)': 0, 'Proteína Bruta (g)': 0, 'NDT (g)': 0, 'Cálcio (g)': 0, 'Fósforo (g)': 0, 'Custo Total': 0,
        'PDR (g)': 0, 'PNDR (g)': 0, 'FDN (g)': 0,
    };

    const optimizedIngredients = prepared.map(({ ing }, index) => {
        const raw = isFeasible ? Math.max(solution[`ing_${index}`] || 0, 0) : 0;
        return { ...ing, percent: round(raw * 100, 2) };
    });

    const totalPercent = optimizedIngredients.reduce((sum, ing) => sum + ing.percent, 0);
    if (totalPercent > 100.1) {
        optimizedIngredients.forEach((ing) => { ing.percent = round((ing.percent / totalPercent) * 100, 2); });
    }

    const included = [];
    optimizedIngredients.forEach((ing, index) => {
        const { comp } = prepared[index];
        const x = ing.percent / 100;
        const amount_g = targetCMS_g * x;
        if (x > 0) included.push({ ing, x, comp: { ...comp, concentrate: isConcentrate(ing.category) ? 1 : 0 } });

        supply['Consumo Estimado (g)'] += amount_g;
        supply['Proteína Bruta (g)'] += amount_g * (toPercent(comp.PB) / 100);
        supply['NDT (g)'] += amount_g * (toPercent(comp.NDT) / 100);
        supply['Cálcio (g)'] += amount_g * (toPercent(comp.Ca) / 100);
        supply['Fósforo (g)'] += amount_g * (toPercent(comp.P) / 100);
        supply['PDR (g)'] += amount_g * (toPercent(comp.PDR ?? 0) / 100);
        supply['PNDR (g)'] += amount_g * (toPercent(comp.PNDR ?? 0) / 100);
        supply['FDN (g)'] += amount_g * (toPercent(comp.FDN) / 100);
        supply['Custo Total'] += (amount_g / 1000) * Number(ing.price || 0);
    });

    // Microminerais (mg/dia): null quando nenhum alimento da dieta tem o dado.
    const microSupply = Object.fromEntries(MICROMINERALS.map(({ field }) => {
        const known = included.filter((item) => item.comp[field] !== null);
        const total = known.reduce((sum, item) => sum + (targetCMS_g * item.x / 1000) * item.comp[field], 0);
        return [field, known.length > 0 ? total : null];
    }));

    const targetPB_g = getRequirementValue(requirements, ['Proteína bruta 1', 'Proteína bruta (g/dia)']);
    const targetNDT_g = getRequirementValue(requirements, ['Nutrientes digestíveis totais1', 'Nutrientes digestíveis totais (g/dia)']);
    const reqCa = dietaryRequirement(requirements, 'Cálcio Dietético');
    const reqP = dietaryRequirement(requirements, 'Fósforo Dietético');

    const line = (required, supplied, unit = 'g/d') => ({
        unit,
        required: required === null ? null : round(required, 2),
        supplied: supplied === null ? null : round(supplied, 2),
        diff: required === null || supplied === null ? null : round(supplied - required, 2),
    });
    const microBalance = Object.fromEntries(MICROMINERALS.map(({ field, key, requirement }) =>
        [key, line(dietaryRequirement(requirements, requirement), microSupply[field], 'mg/d')]));

    const warnings = [];
    if (reqCa === null) warnings.push(warning('requirement_unavailable', { nutrient: 'Ca' }));
    if (reqP === null) warnings.push(warning('requirement_unavailable', { nutrient: 'P' }));
    warnings.push(...extraWarnings);
    if (isFeasible) warnings.push(...solutionWarnings(included, prepared.context));
    if (isFeasible && prepared.context.meanWeight > 0) {
        const fdnPercentBW = (supply['FDN (g)'] / 1000 / prepared.context.meanWeight) * 100;
        if (fdnPercentBW > DIET_SAFETY.fdnIntakeMaxPercentBW) {
            warnings.push(warning('intake_fill', { value: round(fdnPercentBW, 2), max: DIET_SAFETY.fdnIntakeMaxPercentBW }));
        }
    }

    return {
        status,
        isFeasible,
        optimizedIngredients,
        dietSupply: supply,
        dietBalance: {
            'Proteína Bruta': line(targetPB_g, supply['Proteína Bruta (g)']),
            'NDT': line(targetNDT_g, supply['NDT (g)']),
            'PDR': line(dietaryRequirement(requirements, 'Proteína degradável no rúmen'), supply['PDR (g)']),
            'PNDR': line(dietaryRequirement(requirements, 'Proteína não degradável no rúmen'), supply['PNDR (g)']),
            'Cálcio': line(reqCa, supply['Cálcio (g)']),
            'Fósforo': line(reqP, supply['Fósforo (g)']),
            ...microBalance,
        },
        safetyChecks: isFeasible ? safetyChecks(included, prepared.context) : [],
        warnings,
        cost: supply['Custo Total'],
    };
}

/**
 * Explica o custo da dieta ótima (por re-solução do modelo, sem preços-sombra do solver):
 * - limiting: o que está "segurando" o custo: exigências (custo de +1% na exigência),
 *   limites de inclusão do usuário (economia de 1 ponto a mais de folga) e travas no limite;
 * - unusedFoods: preço (R$/kg MS) abaixo do qual cada alimento não usado entraria na dieta.
 * Custos em R$/animal/dia.
 */
function costInsights(prepared, targets, options, solution, cmsKg) {
    const baseCost = solution.result;
    const costOf = (p, t, o) => {
        const s = solver.Solve(buildModel(p, t, o));
        return s.feasible ? s.result : null;
    };
    const perDay = (cost) => (cost === null ? null : round((cost - baseCost) * cmsKg, 3));
    const limiting = [];

    for (const code of ['PB', 'NDT', 'PDR', 'PNDR']) {
        if (targets[code] === undefined) continue;
        const delta = perDay(costOf(prepared, { ...targets, [code]: targets[code] * 1.01 }, options));
        if (delta !== null && delta > 0.0005) limiting.push({ kind: 'nutrient', code, deltaPerDay: delta });
    }

    prepared.forEach(({ ing, blocked }, index) => {
        if (blocked) return;
        const x = solution[`ing_${index}`] || 0;
        const min = optionalNumber(ing.min) ?? 0;
        const max = optionalNumber(ing.max) ?? 100;
        const relax = (changes) => perDay(costOf(prepared.map((p, i) => (i === index ? { ...p, ing: { ...p.ing, ...changes } } : p)), targets, options));
        if (max < 100 && x * 100 >= max - 1e-6) {
            const delta = relax({ max: Math.min(max + 1, 100) });
            if (delta !== null && delta < -0.0005) limiting.push({ kind: 'max', foodName: ing.name, foodId: ing.foodId ?? null, limit: max, deltaPerDay: delta });
        }
        if (min > 0 && x * 100 <= min + 1e-6) {
            const delta = relax({ min: Math.max(min - 1, 0) });
            if (delta !== null && delta < -0.0005) limiting.push({ kind: 'min', foodName: ing.name, foodId: ing.foodId ?? null, limit: min, deltaPerDay: delta });
        }
    });

    // Travas de segurança no limite (restrição ativa na solução).
    for (const [code, def] of Object.entries(options.safety)) {
        const lhs = prepared.reduce((sum, p, index) => sum + (solution[`ing_${index}`] || 0) * def.coefficient(p.comp), 0);
        const bound = def.min !== undefined ? def.min : def.max;
        if (Math.abs(lhs - bound) < 1e-4) limiting.push({ kind: 'safety', code });
    }

    limiting.sort((a, b) => Math.abs(b.deltaPerDay ?? 0) - Math.abs(a.deltaPerDay ?? 0));

    // Alimentos fora da dieta: busca binária no preço até o alimento entrar.
    const unusedFoods = [];
    prepared.forEach(({ ing, blocked }, index) => {
        if (blocked || (solution[`ing_${index}`] || 0) > 1e-6) return;
        if ((optionalNumber(ing.max) ?? 100) <= 0) return;
        const price = Number(ing.price) > 0 ? Number(ing.price) : 0;
        const entersAt = (factor) => {
            const changed = prepared.map((p, i) => (i === index ? { ...p, ing: { ...p.ing, price: price * factor } } : p));
            const s = solver.Solve(buildModel(changed, targets, options));
            return s.feasible && (s[`ing_${index}`] || 0) > 1e-4;
        };
        let breakEvenPrice = null;
        if (price > 0 && entersAt(0)) {
            let low = 0;
            let high = 1;
            for (let i = 0; i < 14; i += 1) {
                const mid = (low + high) / 2;
                if (entersAt(mid)) low = mid; else high = mid;
            }
            breakEvenPrice = round(price * low, 2);
        }
        unusedFoods.push({ foodName: ing.name, foodId: ing.foodId ?? null, price: round(price, 2), breakEvenPrice });
    });

    return { limiting, unusedFoods };
}

/**
 * Calcula a dieta de menor custo para o animal com os alimentos informados.
 *
 * 1. Tenta atender PB e NDT com os limites do usuário e as travas de segurança.
 * 2. Se não der, oferece duas opções, ambas com as travas de segurança:
 *    - ideal: atende PB e NDT ignorando os limites que o usuário definiu
 *      (vale só o padrão de cada alimento);
 *    - realista: respeita os limites do usuário sem exigir PB e NDT.
 */
function calculateDiet(animalInput, ingredients) {
    const requirements = calculateAllRequirements(animalInput);
    const targetCMS_g = getRequirementValue(requirements, ['Consumo de matéria seca 1', 'Consumo de matéria seca']);
    const targetPB_g = getRequirementValue(requirements, ['Proteína bruta 1', 'Proteína bruta (g/dia)']);
    const targetNDT_g = getRequirementValue(requirements, ['Nutrientes digestíveis totais1', 'Nutrientes digestíveis totais (g/dia)']);

    const targets = {
        PB: (targetPB_g / targetCMS_g) * 100,
        NDT: (targetNDT_g / targetCMS_g) * 100,
    };

    const context = {
        species: SPECIES_CODES[animalInput.especieId],
        isMale: MALE_SEX_IDS.has(animalInput.sexoId),
        meanWeight: (Number(animalInput.pesoInicial) + Number(animalInput.pesoFinal)) / 2,
    };

    // Suplemento de bovino não entra em dieta de ovino (cobre).
    const prepared = ingredients.map((ing) => ({
        ing,
        comp: composition(ing),
        blocked: context.species === 'ovino' && ing.category === 'SUPLEMENTO' && ing.targetSpecies === 'BOVINO',
    }));
    prepared.context = context;

    const blockedNames = prepared.filter((p) => p.blocked).map((p) => p.ing.name);
    const globalWarnings = blockedNames.length > 0 ? [warning('supplement_blocked_species', { foods: blockedNames })] : [];

    // PDR e PNDR mínimos só quando todos os alimentos têm os dois dados e a exigência existe.
    const reqPDR = dietaryRequirement(requirements, 'Proteína degradável no rúmen');
    const reqPNDR = dietaryRequirement(requirements, 'Proteína não degradável no rúmen');
    const withoutProteinFractions = prepared
        .filter((p) => p.comp.PDR === null || p.comp.PNDR === null)
        .map((p) => p.ing.name);
    if (!DIET_SAFETY.proteinFractionsInFormulation) {
        // Só no balanço (ver catalog/dietSafety).
    } else if (reqPDR !== null && reqPNDR !== null && withoutProteinFractions.length === 0) {
        targets.PDR = (reqPDR / targetCMS_g) * 100;
        targets.PNDR = (reqPNDR / targetCMS_g) * 100;
    } else if (withoutProteinFractions.length > 0) {
        globalWarnings.push(warning('protein_fractions_not_evaluated', { foods: withoutProteinFractions }));
    }

    const safety = safetyConstraints(context);
    const infeasibleWarnings = (blocking, strict) => {
        if (blocking.length > 0) return [warning('safety_infeasible', { checks: blocking })];
        return strict ? [warning('nutrition_infeasible')] : [warning('safety_infeasible', { checks: Object.keys(safety) })];
    };

    const optimalOptions = { strictNutrients: true, limits: 'user', safety };
    const optimal = solve(prepared, targets, optimalOptions);
    if (optimal.solution) {
        const result = processSolution(optimal.solution, prepared, requirements, targetCMS_g, 'Solução Ótima Encontrada', globalWarnings);
        result.costInsights = costInsights(prepared, targets, optimalOptions, optimal.solution, targetCMS_g / 1000);
        return { hasConflict: false, result, animalRequirements: requirements };
    }

    const ideal = solve(prepared, targets, { strictNutrients: true, limits: 'food', safety });
    const realistic = solve(prepared, targets, { strictNutrients: false, limits: 'user', safety });

    return {
        hasConflict: true,
        resultIdeal: processSolution(
            ideal.solution, prepared, requirements, targetCMS_g,
            'Atende a nutrição sem os limites de inclusão do usuário.',
            [...globalWarnings, ...(ideal.solution ? [] : infeasibleWarnings(ideal.blocking, true))]
        ),
        resultRealistic: processSolution(
            realistic.solution, prepared, requirements, targetCMS_g,
            'Respeita os limites do usuário, mas não atende a nutrição.',
            [...globalWarnings, ...(realistic.solution ? [] : infeasibleWarnings(realistic.blocking, false))]
        ),
        animalRequirements: requirements,
    };
}

module.exports = { calculateDiet };

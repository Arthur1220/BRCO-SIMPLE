const { calculateAllRequirements } = require('./requirementService');
const { round } = require('./calculationConstants');
const solver = require('javascript-lp-solver');

/**
 * Normaliza valores nutricionais para porcentagem se parecerem estar em g/kg.
 */
function getNutrientPercentage(val) {
    return val > 15 ? val / 10 : val;
}

/**
 * Tenta buscar o valor de uma exigência usando múltiplas chaves possíveis.
 */
function getRequirementValue(requirements, possibleKeys) {
    for (const key of possibleKeys) {
        if (requirements[key] && requirements[key].valor_requerido !== undefined) {
            return requirements[key].valor_requerido;
        }
    }
    return 0; 
}

function buildModel(ingredients, targets, strictNutrients = true) {
    const model = {
        optimize: "cost",
        opType: "min",
        constraints: {
            weight: { equal: 1 }, 
            FDN_Volumoso: { min: 18 },
            Total_Suplemento: { max: 0.015 },
            Total_Volumoso: { min: 0.01 }, 
            Total_Concentrado: { min: 0.01 } 
        },
        variables: {}
    };

    if (strictNutrients) {
        model.constraints.PB = { min: targets.PB };
        model.constraints.NDT = { min: targets.NDT };
    }

    ingredients.forEach((ing, index) => {
        const key = `ing_${index}`;
        const valPB = getNutrientPercentage(Number(ing.PB) || 0);
        const valNDT = getNutrientPercentage(Number(ing.NDT) || 0);
        const valFDN = getNutrientPercentage(Number(ing.FDNcp) || 0);
        const cost = Number(ing.price) > 0 ? Number(ing.price) : 0.001;

        model.variables[key] = {
            weight: 1, PB: valPB, NDT: valNDT, cost: cost, _originalIndex: index
        };

        if (ing.category === 'VOLUMOSO') {
            model.variables[key].FDN_Volumoso = valFDN;
            model.variables[key].Total_Volumoso = 1;
        } else if (ing.category === 'CONCENTRADO' || ing.category === 'ENERGETICO' || ing.category === 'PROTEICO') {
            model.variables[key].Total_Concentrado = 1;
        } else if (ing.category === 'SUPLEMENTO') {
            model.variables[key].Total_Suplemento = 1;
        }

        // Limites do Usuário (SEMPRE APLICADOS AO MODELO)
        let userMin = 0;
        if (ing.min !== undefined && ing.min !== null && ing.min !== '') userMin = Number(ing.min) / 100;

        let userMax = 1;
        if (ing.max !== undefined && ing.max !== null && ing.max !== '') userMax = Number(ing.max) / 100;

        const minName = `limit_min_${key}`;
        const maxName = `limit_max_${key}`;
        model.constraints[minName] = { min: userMin };
        model.constraints[maxName] = { max: userMax };
        model.variables[key][minName] = 1;
        model.variables[key][maxName] = 1;
    });

    return model;
}

/**
 * Processa a solução do solver, calculando balanço e fornecimento.
 */
function processSolution(solution, ingredients, requirements, targets, targetCMS_g, status, isFeasible) {
    let supply = { 'Consumo Estimado (g)': 0, 'Proteína Bruta (g)': 0, 'NDT (g)': 0, 'Cálcio (g)': 0, 'Fósforo (g)': 0, 'Custo Total': 0 };
    
    const optimizedIngredients = ingredients.map((ing, index) => {
        const key = `ing_${index}`;
        let rawResult = solution[key] || 0;
        if (rawResult < 0) rawResult = 0;
        return { ...ing, percent: round(rawResult * 100, 2) };
    });

    optimizedIngredients.forEach(ing => {
        const inclusionDecimal = ing.percent / 100;
        const amountInDiet_g = targetCMS_g * inclusionDecimal;

        const valPB = getNutrientPercentage(Number(ing.PB) || 0);
        const valNDT = getNutrientPercentage(Number(ing.NDT) || 0);
        const valCa = getNutrientPercentage(Number(ing.Ca) || 0);
        const valP = getNutrientPercentage(Number(ing.P) || 0);
        const price = Number(ing.price || 0);

        supply['Consumo Estimado (g)'] += amountInDiet_g;
        supply['Proteína Bruta (g)'] += amountInDiet_g * (valPB / 100);
        supply['NDT (g)'] += amountInDiet_g * (valNDT / 100);
        supply['Cálcio (g)'] += amountInDiet_g * (valCa / 100);
        supply['Fósforo (g)'] += amountInDiet_g * (valP / 100);
        supply['Custo Total'] += (amountInDiet_g / 1000) * price;
    });

    // CORREÇÃO: Recupera os valores alvo de PB e NDT dentro desta função para usar no balanço
    const targetPB_g = getRequirementValue(requirements, ['Proteína bruta 1', 'Proteína bruta (g/dia)']);
    const targetNDT_g = getRequirementValue(requirements, ['Nutrientes digestíveis totais1', 'Nutrientes digestíveis totais (g/dia)']);

    const getVal = (k) => requirements[k] ? requirements[k].valor_requerido : 0;
    const reqCa = getVal('Cálcio Mantença') + getVal('Cálcio Ganho');
    const reqP = getVal('Fósforo Mantença') + getVal('Fósforo Ganho');

    const balance = {
        'Proteína Bruta': { unit: 'g/d', required: round(targetPB_g, 2), supplied: round(supply['Proteína Bruta (g)'], 2), diff: round(supply['Proteína Bruta (g)'] - targetPB_g, 2) },
        'NDT': { unit: 'g/d', required: round(targetNDT_g, 2), supplied: round(supply['NDT (g)'], 2), diff: round(supply['NDT (g)'] - targetNDT_g, 2) },
        'Cálcio': { unit: 'g/d', required: round(reqCa, 2), supplied: round(supply['Cálcio (g)'], 2), diff: round(supply['Cálcio (g)'] - reqCa, 2) },
        'Fósforo': { unit: 'g/d', required: round(reqP, 2), supplied: round(supply['Fósforo (g)'], 2), diff: round(supply['Fósforo (g)'] - reqP, 2) }
    };
    
    const totalPercent = optimizedIngredients.reduce((sum, ing) => sum + ing.percent, 0);
    if (totalPercent > 100.1) {
        // Se passou de 100%, normalizamos tudo proporcionalmente
        optimizedIngredients.forEach(ing => {
            ing.percent = round((ing.percent / totalPercent) * 100, 2);
        });
    }

    return {
        status: status,
        isFeasible: isFeasible,
        optimizedIngredients: optimizedIngredients,
        dietSupply: supply,
        dietBalance: balance,
        cost: supply['Custo Total']
    };
}


function calculateDiet(animalInput, ingredients) {
    const requirements = calculateAllRequirements(animalInput);
    const targetCMS_g = getRequirementValue(requirements, ['Consumo de matéria seca 1', 'Consumo de matéria seca']);
    const targetPB_g = getRequirementValue(requirements, ['Proteína bruta 1', 'Proteína bruta (g/dia)']);
    const targetNDT_g = getRequirementValue(requirements, ['Nutrientes digestíveis totais1', 'Nutrientes digestíveis totais (g/dia)']);
    
    const targets = {
        PB: (targetPB_g / targetCMS_g) * 100,
        NDT: (targetNDT_g / targetCMS_g) * 100
    };

    // --- 1. TENTATIVA IDEAL (Com Limites Nutricionais) ---
    let modelIdeal = buildModel(ingredients, targets, true);
    let solutionIdeal = solver.Solve(modelIdeal);

    if (solutionIdeal.feasible) {
        // Se a solução ideal funcionar, retornamos apenas ela.
        return {
            hasConflict: false,
            result: processSolution(solutionIdeal, ingredients, requirements, targets, targetCMS_g, "Solução Ótima Encontrada", true),
            animalRequirements: requirements
        };
    }

    // --- 2. TENTATIVA REALISTA (Sem Limites Nutricionais, Respeitando SÓ Limites do Usuário) ---
    let modelRealistic = buildModel(ingredients, targets, false);
    let solutionRealistic = solver.Solve(modelRealistic);

    // Se a Tentativa Ideal falhar, retornamos as duas opções para o frontend decidir.
    const resultIdeal = processSolution(solutionIdeal, ingredients, requirements, targets, targetCMS_g, 
        "Alerta: Inviável! Viola limites do usuário para atingir nutrição.", false);
    
    const resultRealistic = processSolution(solutionRealistic, ingredients, requirements, targets, targetCMS_g, 
        "Resultado: Respeita limites, mas não atende nutrição.", solutionRealistic.feasible);


    return {
        hasConflict: true, // Avisa o frontend para abrir a modal
        resultIdeal: resultIdeal,
        resultRealistic: resultRealistic,
        animalRequirements: requirements
    };
}

module.exports = { calculateDiet };
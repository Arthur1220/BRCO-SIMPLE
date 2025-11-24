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

/**
 * Calcula a dieta otimizada (Mínimo Custo) usando Programação Linear.
 * * @param {object} animalInput - Dados do animal.
 * @param {array} ingredients - Lista de alimentos candidatos.
 * @returns {object} - Resultado da otimização e balanço nutricional.
 */
function calculateDiet(animalInput, ingredients) {
    // 1. Calcular a META (Exigências do Animal)
    const requirements = calculateAllRequirements(animalInput);

    const targetCMS_g = getRequirementValue(requirements, ['Consumo de matéria seca 1', 'Consumo de matéria seca']);
    const targetPB_g = getRequirementValue(requirements, ['Proteína bruta 1', 'Proteína bruta (g/dia)']);
    const targetNDT_g = getRequirementValue(requirements, ['Nutrientes digestíveis totais1', 'Nutrientes digestíveis totais (g/dia)']);

    // Transforma as metas em % da dieta total
    const targetPB_percent = (targetPB_g / targetCMS_g) * 100;
    const targetNDT_percent = (targetNDT_g / targetCMS_g) * 100;

    // 2. Configuração do Modelo do Solver
    const model = {
        optimize: "cost",
        opType: "min",
        constraints: {
            weight: { equal: 1 }, // Soma das partes deve ser 1 (100%)
            PB: { min: targetPB_percent },
            NDT: { min: targetNDT_percent },
            
            // Regras Nutricionais Específicas
            FDN_Volumoso: { min: 18 }, // Mínimo de 18% de fibra vinda de volumosos
            Total_Suplemento: { max: 0.015 }, // Máximo de 1.5% de suplementos
            
            // Garantia de presença mínima
            Total_Volumoso: { min: 0.01 }, 
            Total_Concentrado: { min: 0.01 } 
        },
        variables: {}
    };

    // 3. Povoar as variáveis do modelo com os ingredientes
    ingredients.forEach((ing, index) => {
        const key = `ing_${index}`;
        const valPB = getNutrientPercentage(Number(ing.PB) || 0);
        const valNDT = getNutrientPercentage(Number(ing.NDT) || 0);
        const valFDN = getNutrientPercentage(Number(ing.FDNcp) || 0); 
        const cost = ing.price ? Number(ing.price) : 1;

        model.variables[key] = {
            weight: 1,
            PB: valPB,
            NDT: valNDT,
            cost: cost,
            _originalIndex: index
        };

        // Aplicação de Tags para as Regras Específicas
        if (ing.category === 'VOLUMOSO') {
            model.variables[key].FDN_Volumoso = valFDN; // Se é volumoso, contribui para a regra de "FDN vinda do volumoso"
            model.variables[key].Total_Volumoso = 1; // Contribui para o total de volumosos
        } 
        else if (ing.category === 'ENERGETICO' || ing.category === 'PROTEICO') {
            model.variables[key].Total_Concentrado = 1; // Contribui para o total de concentrados
        }
        else if (ing.category === 'SUPLEMENTO') {
            model.variables[key].Total_Suplemento = 1; // Contribui para o limite de suplementos
        }

        // Restrições individuais (Min/Max definido pelo usuário)
        const userMin = Number(ing.min) || 0;
        const userMax = Number(ing.max) || 100;
        model.constraints[key] = { min: userMin, max: userMax };
        model.variables[key][key] = 1;
    });

    // 4. Execução
    const solution = solver.Solve(model);

    // 5. Pós-processamento e Cálculo de Totais
    let supply = { 'Consumo Estimado (g)': 0, 'Proteína Bruta (g)': 0, 'NDT (g)': 0, 'Cálcio (g)': 0, 'Fósforo (g)': 0, 'Custo Total': 0 };

    const optimizedIngredients = ingredients.map((ing, index) => {
        const key = `ing_${index}`;
        let calculatedPercent = (solution[key] || 0) * 100; // O solver retorna valores de 0 a 1 (ex: 0.354). Multiplicamos por 100 para ter %.
        return { ...ing, percent: round(calculatedPercent, 2) };
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

    // 6. Montagem do Balanço Final
    const getVal = (k) => requirements[k] ? requirements[k].valor_requerido : 0;
    const reqCa = getVal('Cálcio Mantença') + getVal('Cálcio Ganho');
    const reqP = getVal('Fósforo Mantença') + getVal('Fósforo Ganho');

    const balance = {
        'Proteína Bruta': { unit: 'g/d', required: round(targetPB_g, 2), supplied: round(supply['Proteína Bruta (g)'], 2), diff: round(supply['Proteína Bruta (g)'] - targetPB_g, 2) },
        'NDT': { unit: 'g/d', required: round(targetNDT_g, 2), supplied: round(supply['NDT (g)'], 2), diff: round(supply['NDT (g)'] - targetNDT_g, 2) },
        'Cálcio': { unit: 'g/d', required: round(reqCa, 2), supplied: round(supply['Cálcio (g)'], 2), diff: round(supply['Cálcio (g)'] - reqCa, 2) },
        'Fósforo': { unit: 'g/d', required: round(reqP, 2), supplied: round(supply['Fósforo (g)'], 2), diff: round(supply['Fósforo (g)'] - reqP, 2) }
    };

    // Se feasible é false, o solver retorna a melhor aproximação possível (bounded)
    const isFeasible = solution.feasible;
    const statusMessage = isFeasible ? "Solução Encontrada" : "Não foi possível atingir todas as metas com os ingredientes/restrições fornecidos.";

    return {
        status: statusMessage,
        isFeasible: isFeasible,
        optimizedIngredients: optimizedIngredients,
        animalRequirements: requirements,
        dietSupply: supply,
        dietBalance: balance
    };
}

module.exports = { calculateDiet };
const { L, t } = require('../lib/i18n');
const { toCsv } = require('../domain/csvService');

/**
 * Exportação CSV gerada a partir do cálculo salvo no servidor (não confia em
 * dados vindos do cliente). Usa a resposta já apresentada no idioma pedido.
 */
const H = {
    section: L('Seção', 'Section'),
    item: L('Item', 'Item'),
    code: L('Código', 'Code'),
    value: L('Valor', 'Value'),
    reference: L('Referência', 'Reference'),
    unit: L('Unidade', 'Unit'),
    status: L('Status', 'Status'),
};

const S = {
    calculation: L('Cálculo', 'Calculation'),
    input: L('Entrada', 'Input'),
    ingredients: L('Ingredientes', 'Ingredients'),
    totals: L('Totais', 'Totals'),
    balance: L('Balanço nutricional', 'Nutritional balance'),
    id: L('Identificador', 'Identifier'),
    date: L('Data', 'Date'),
    engine: L('Versão das fórmulas', 'Formula version'),
    intake: L('Consumo de matéria seca', 'Dry matter intake'),
    cost: L('Custo', 'Cost'),
    inclusion: L('Inclusão', 'Inclusion'),
    required: L('Exigido', 'Required'),
    max: L('Máximo', 'Maximum'),
};

function rowFactory(locale) {
    const headers = Object.fromEntries(Object.entries(H).map(([key, label]) => [key, t(label, locale)]));
    return (values) => Object.fromEntries(Object.keys(H).map((key) => [headers[key], values[key] ?? '']));
}

function solutionRows(row, solution, sectionPrefix, locale) {
    const rows = [];
    for (const ing of solution.ingredients) {
        rows.push(row({ section: `${sectionPrefix}${t(S.ingredients, locale)}`, item: ing.name, code: ing.foodId ?? '', value: ing.percent, unit: '%', reference: `${ing.kgPerDay} kg MS/d` }));
    }
    rows.push(row({ section: `${sectionPrefix}${t(S.totals, locale)}`, item: t(S.intake, locale), value: solution.totals.intakeKgPerDay, unit: 'kg MS/d' }));
    rows.push(row({ section: `${sectionPrefix}${t(S.totals, locale)}`, item: t(S.cost, locale), value: solution.totals.costPerDay, unit: 'R$/d' }));
    for (const item of solution.balance) {
        rows.push(row({ section: `${sectionPrefix}${t(S.balance, locale)}`, item: item.label, code: item.code, value: item.supplied, reference: item.required, unit: item.unit, status: item.statusLabel }));
    }
    return rows;
}

/**
 * Converte um cálculo apresentado (presentCalculation) em CSV.
 */
function calculationToCsv(presented, locale) {
    const row = rowFactory(locale);
    const calc = t(S.calculation, locale);
    const rows = [
        row({ section: calc, item: t(S.id, locale), value: presented.calculationId }),
        row({ section: calc, item: t(S.date, locale), value: presented.createdAt }),
        row({ section: calc, item: t(S.engine, locale), value: presented.engineVersion }),
    ];

    const flatInput = presented.type === 'diet' ? presented.input.animal : presented.input;
    for (const [key, value] of Object.entries(flatInput)) {
        if (value !== null && value !== undefined) rows.push(row({ section: t(S.input, locale), item: key, value }));
    }

    if (presented.type === 'diet') {
        if (presented.status === 'optimal') {
            rows.push(...solutionRows(row, presented.solution, '', locale));
        } else {
            for (const option of presented.options) {
                rows.push(...solutionRows(row, option.solution, `${option.label} - `, locale));
            }
        }
        return toCsv(rows);
    }

    for (const group of presented.groups) {
        for (const item of group.items) {
            rows.push(row({ section: group.label, item: item.label, code: item.code, value: item.value, reference: item.max ?? '', unit: item.unit }));
        }
    }
    return toCsv(rows);
}

module.exports = { calculationToCsv };

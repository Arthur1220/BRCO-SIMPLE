const { parseLocalized } = require('../../contracts/localized');
const { getRequirementsInputSchema } = require('../../contracts/requirements');
const { getNdtInputSchema } = require('../../contracts/ndt');
const { getDietInputSchema } = require('../../contracts/diet');
const { presentCalculation } = require('../../presenters/calculations');
const { calculationToCsv } = require('../../presenters/export');
const { logCalculation } = require('../../lib/usageLog');
const { sendError } = require('../../lib/apiErrors');
const calculations = require('../../services/calculationService');

/**
 * Valida, calcula, salva e responde 201 com o cálculo apresentado.
 */
async function createCalculation(req, res, type, getSchema, run) {
    const input = parseLocalized(getSchema, req.body, req.locale);
    const output = await run(input, req.locale);
    const record = await calculations.saveCalculation(type, input, output);
    await logCalculation(req, calculations.usageType(type, input));

    res.status(201).location(`/api/v1/calculations/${record.id}`).json(presentCalculation(record, req.locale));
}

/**
 * POST /api/v1/calculations/requirements
 */
function createRequirements(req, res) {
    return createCalculation(req, res, 'requirements', getRequirementsInputSchema, calculations.runRequirements);
}

/**
 * POST /api/v1/calculations/ndt
 */
function createNdt(req, res) {
    return createCalculation(req, res, 'ndt', getNdtInputSchema, calculations.runNdt);
}

/**
 * POST /api/v1/calculations/diet
 */
function createDiet(req, res) {
    return createCalculation(req, res, 'diet', getDietInputSchema, calculations.runDiet);
}

async function loadOr404(req, res) {
    const record = await calculations.findCalculation(req.params.id);
    if (!record) sendError(req, res, 404, 'NOT_FOUND', 'Cálculo não encontrado.');
    return record;
}

/**
 * GET /api/v1/calculations/:id
 * Cálculo salvo (link compartilhável), apresentado no idioma da requisição.
 */
async function getCalculation(req, res) {
    const record = await loadOr404(req, res);
    if (record) res.json(presentCalculation(record, req.locale));
}

/**
 * GET /api/v1/calculations/:id/export.csv
 * Relatório gerado a partir do que o servidor calculou e salvou.
 */
async function exportCalculationCsv(req, res) {
    const record = await loadOr404(req, res);
    if (!record) return;

    const csv = calculationToCsv(presentCalculation(record, req.locale), req.locale);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="brco-${record.type}-${record.id}.csv"`);
    res.send(csv);
}

module.exports = { createRequirements, createNdt, createDiet, getCalculation, exportCalculationCsv };

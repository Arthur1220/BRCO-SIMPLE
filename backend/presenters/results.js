const { t } = require('../lib/i18n');
const logger = require('../lib/logger');
const { normalizeUnit } = require('../catalog/outputs');

const DECIMALS = 2;
const OTHER_GROUP = { code: 'outros', label: { 'pt-BR': 'Outros', en: 'Other' } };

/**
 * Converte um item do domínio ({ tipo, valor | valor_requerido, valor_maximo })
 * no formato da v1.
 */
function presentItem(meta, raw, locale) {
    const item = {
        code: meta.code,
        label: t(meta.label, locale),
        value: raw.valor_requerido ?? raw.valor,
        unit: normalizeUnit(raw.tipo),
        decimals: DECIMALS,
    };
    if (raw.valor_maximo !== undefined) item.max = raw.valor_maximo;
    return item;
}

/**
 * Agrupa o resultado bruto do domínio em { highlights, groups } usando os metadados.
 * Chaves sem metadado (não deveria acontecer: há teste para isso) vão para o
 * grupo "outros" com a chave como label, em vez de sumirem da tela.
 */
function presentGroupedResult(domainResult, { outputs, groups, highlights }, locale) {
    const metaByKey = new Map(outputs.map((meta) => [meta.key, meta]));
    const items = new Map(); // code -> { item, group }

    for (const [key, raw] of Object.entries(domainResult)) {
        let meta = metaByKey.get(key);
        if (!meta) {
            logger.warn('Resultado do domínio sem metadado de apresentação', { key });
            meta = { key, code: key, group: OTHER_GROUP.code, label: key };
        }
        items.set(meta.code, { item: presentItem(meta, raw, locale), group: meta.group });
    }

    const presentedGroups = [...groups, OTHER_GROUP]
        .map((group, index) => {
            // Itens na ordem dos metadados; o grupo "outros" recebe os sem metadado.
            const groupItems = group === OTHER_GROUP
                ? [...items.values()].filter((entry) => entry.group === OTHER_GROUP.code).map((entry) => entry.item)
                : outputs.filter((meta) => meta.group === group.code).map((meta) => items.get(meta.code)?.item).filter(Boolean);
            const presented = { code: group.code, label: t(group.label, locale), order: index + 1, items: groupItems };
            if (group.summary && items.has(group.summary)) presented.summary = items.get(group.summary).item;
            return presented;
        })
        .filter((group) => group.items.length > 0);

    return {
        highlights: highlights.map((code) => items.get(code)?.item).filter(Boolean),
        groups: presentedGroups,
    };
}

module.exports = { presentGroupedResult, presentItem, DECIMALS };

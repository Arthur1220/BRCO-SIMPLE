/**
 * Regras entre campos. Cada regra é usada na validação (superRefine) e
 * publicada no catálogo (code + message + fields), para o frontend poder
 * avisar o usuário antes de enviar.
 */

/**
 * Aplica as regras ao contexto do Zod, marcando o erro no primeiro campo da regra.
 */
function applyRules(rules) {
    return (data, ctx) => {
        for (const rule of rules) {
            if (!rule.check(data)) {
                ctx.addIssue({ code: 'custom', path: [rule.fields[0]], message: rule.message, params: { rule: rule.code } });
            }
        }
    };
}

/**
 * Representação pública de uma regra (sem a função).
 */
function publicRule({ code, message, fields }) {
    return { code, message, fields };
}

module.exports = { applyRules, publicRule };

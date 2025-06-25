const { REQUIREMENTS, round } = require('./calculationConstants');

// Deixei apenas a lógica de Caprinos implementada como exemplo,
// as outras seguiriam a mesma estrutura.
function _calculateEnergiaCaprinos(params) {
    const { input, PCV, GPCVZ, KG, CMS_REQ } = params;
    const C = REQUIREMENTS.CAPRINOS.ENERGIA;
    const D = REQUIREMENTS.DECIMAIS;

    let conf = C.LEITEIRO.FEMEA;
    if (input.categoriaAnimalId == 1) {
        if (input.sexoId == 1) conf = C.LEITEIRO.INTEIRO;
        if (input.sexoId == 2) conf = C.LEITEIRO.CASTRADO;
    } else if (input.categoriaAnimalId == 2) {
        conf = C.NATIVA;
    } else {
        conf = C.CORTE;
    }

    const ELm_REQ = conf.ELm_FACTOR * (PCV ** 0.75);
    const ELg_REQ = conf.ELg_FACTOR * (PCV ** conf.ELg_EXP) * GPCVZ;
    const ELT_REQ = ELm_REQ + ELg_REQ;
    const EMm_REQ = ELm_REQ / conf.EMm_DIV;
    const EMg_REQ = ELg_REQ / KG;
    const EMT_REQ = EMm_REQ + EMg_REQ;
    const EMT_MS_REQ = EMT_REQ / (CMS_REQ / 1000);
    const ED_MS_REQ = ((EMT_MS_REQ * 1000 - C.ED_MS_FACTOR1) / C.ED_MS_FACTOR2) / 1000;
    const EDT_REQ = EMT_REQ / C.EDT_DIV;
    const NDT_REQ = EDT_REQ / C.NDT_DIV * 1000;
    const NDT_MS_REQ = NDT_REQ * 1000 / CMS_REQ;
    
    return {
        'Energia líquida de mantença': { tipo: 'Mcal/d', valor_requerido: round(ELm_REQ, D), valor_maximo: round(ELm_REQ * 1.05, D) },
        'Energia líquida de ganho': { tipo: 'Mcal/d', valor_requerido: round(ELg_REQ, D), valor_maximo: round(ELg_REQ * 1.05, D) },
        'Energia líquida total': { tipo: 'Mcal/d', valor_requerido: round(ELT_REQ, D), valor_maximo: round(ELT_REQ * 1.05, D) },
        'Energia metabolizável de mantença': { tipo: 'Mcal/d', valor_requerido: round(EMm_REQ, D), valor_maximo: round(EMm_REQ * 1.05, D) },
        'Energia metabolizável de ganho': { tipo: 'Mcal/d', valor_requerido: round(EMg_REQ, D), valor_maximo: round(EMg_REQ * 1.05, D) },
        'Energia metabolizável total': { tipo: 'Mcal/d', valor_requerido: round(EMT_REQ, D), valor_maximo: round(EMT_REQ * 1.05, D) },
        'Energia metabolizável': { tipo: 'Mcal/kg MS', valor_requerido: round(EMT_MS_REQ, D), valor_maximo: round(EMT_MS_REQ * 1.05, D) },
        'Energia digestível': { tipo: 'Mcal/kg MS', valor_requerido: round(ED_MS_REQ, D), valor_maximo: round(ED_MS_REQ * 1.05, D) },
        'Energia digestível total': { tipo: 'Mcal/d', valor_requerido: round(EDT_REQ, D), valor_maximo: round(EDT_REQ * 1.05, D) },
        'Nutrientes digestíveis totais1': { tipo: 'g/d', valor_requerido: round(NDT_REQ, D), valor_maximo: round(NDT_REQ * 1.05, D) },
        'Nutrientes digestíveis totais': { tipo: 'g/kgMS', valor_requerido: round(NDT_MS_REQ, D), valor_maximo: round(NDT_MS_REQ * 1.05, D) },
    };
}

function calculateAllRequirements(input) {
    let finalResult = {};
    const D = REQUIREMENTS.DECIMAIS;

    if (input.especieId == 1) { // Caprinos
        const C_PESO = REQUIREMENTS.CAPRINOS.PESO;
        const C_CMS = REQUIREMENTS.CAPRINOS.CMS;
        
        const pesoMedio = (input.pesoInicial + input.pesoFinal) / 2;
        const CTGI = C_PESO.CTGI_FACTOR * (pesoMedio ** C_PESO.CTGI_EXP);
        const PCV = pesoMedio - (CTGI * pesoMedio / 1000);
        const GPCVZ = C_PESO.GPCVZ_FACTOR * (input.GMD ** C_PESO.GPCVZ_EXP) / 1000;

        let confCms = C_CMS.FEMEA;
        if (input.sexoId == 1) confCms = C_CMS.INTEIRO;
        if (input.sexoId == 2) confCms = C_CMS.CASTRADO;
        const CMS_REQ = confCms.BASE + confCms.FACTOR * pesoMedio;
        
        const KG = 0.3; // Placeholder

        const commonParams = { input, PCV, GPCVZ, KG, CMS_REQ, pesoMedio };
        
        const consumoResult = {
            'Consumo de matéria seca 1': { tipo: 'g/d', valor_requerido: round(CMS_REQ, D), valor_maximo: round(CMS_REQ * 1.1, D) },
            'Consumo de matéria seca': { tipo: 'g/kgPV', valor_requerido: round(CMS_REQ / pesoMedio, D), valor_maximo: round((CMS_REQ / pesoMedio) * 1.1, D) },
        };
        const energiaResult = _calculateEnergiaCaprinos(commonParams);
        
        finalResult = { ...consumoResult, ...energiaResult };
    } else {
        finalResult = { message: "Cálculo para Ovinos ainda não implementado." };
    }
    return finalResult;
}

module.exports = { calculateAllRequirements };
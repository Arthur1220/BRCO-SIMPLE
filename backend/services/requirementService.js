// services/requirementService.js
const { REQUIREMENTS, round } = require('./calculationConstants');
const D = REQUIREMENTS.DECIMAIS; // Atalho para o número de casas decimais

function _getSexoConfig(config, sexoId) {
    if (sexoId === 1) return config.INTEIRO;
    if (sexoId === 2) return config.CASTRADO;
    return config.FEMEA;
}

function _calculateEnergia(params) {
    const { input, PCV, PCVZ, GPCV, GPCVZ, KG, CMS_REQ, especie } = params;
    const C = REQUIREMENTS[especie].ENERGIA;

    let ELm_REQ, ELg_REQ, EMm_REQ, EMg_REQ;

    if (especie === 'CAPRINOS') {
        let conf = C.LEITEIRO;
        if (input.categoriaAnimalId === 2) conf = C.NATIVA;
        if (input.categoriaAnimalId === 3) conf = C.CORTE;
        
        const sexoConf = _getSexoConfig(conf, input.sexoId);
        
        ELm_REQ = sexoConf.ELm_FACTOR * (PCV ** 0.75);
        ELg_REQ = sexoConf.ELg_FACTOR * (PCV ** sexoConf.ELg_EXP) * GPCVZ;
        EMm_REQ = ELm_REQ / sexoConf.EMm_DIV;
        EMg_REQ = ELg_REQ / KG;
    } else { // OVINOS
        const sexoConf = _getSexoConfig(C.ELg, input.sexoId);
        
        ELm_REQ = C.ELm_FACTOR * (PCVZ ** 0.75);
        ELg_REQ = sexoConf.F * (PCVZ ** 0.75) * (GPCV ** sexoConf.E);
        EMm_REQ = ELm_REQ / C.EMm_DIV;
        EMg_REQ = ELg_REQ / C.EMg_DIV;
    }
    
    const ELT_REQ = ELm_REQ + ELg_REQ;
    const EMT_REQ = EMm_REQ + EMg_REQ;
    const EMT_MS_REQ = EMT_REQ / (CMS_REQ / 1000);
    const EDT_REQ = EMT_REQ / (especie === 'CAPRINOS' ? C.EDT_DIV : REQUIREMENTS.OVINOS.ENERGIA.EDT_DIV);
    const NDT_REQ = EDT_REQ / (especie === 'CAPRINOS' ? C.NDT_DIV : REQUIREMENTS.OVINOS.ENERGIA.NDT_DIV) * 1000;
    const NDT_MS_REQ = NDT_REQ * 1000 / CMS_REQ;

    return {
        'Energia líquida de mantença': { tipo: 'Mcal/d', valor_requerido: round(ELm_REQ, D), valor_maximo: round(ELm_REQ * 1.05, D) },
        'Energia líquida de ganho': { tipo: 'Mcal/d', valor_requerido: round(ELg_REQ, D), valor_maximo: round(ELg_REQ * 1.05, D) },
        'Energia líquida total': { tipo: 'Mcal/d', valor_requerido: round(ELT_REQ, D), valor_maximo: round(ELT_REQ * 1.05, D) },
        'Energia metabolizável de mantença': { tipo: 'Mcal/d', valor_requerido: round(EMm_REQ, D), valor_maximo: round(EMm_REQ * 1.05, D) },
        'Energia metabolizável de ganho': { tipo: 'Mcal/d', valor_requerido: round(EMg_REQ, D), valor_maximo: round(EMg_REQ * 1.05, D) },
        'Energia metabolizável total': { tipo: 'Mcal/d', valor_requerido: round(EMT_REQ, D), valor_maximo: round(EMT_REQ * 1.05, D) },
        'Nutrientes digestíveis totais (g/dia)': { tipo: 'g/d', valor_requerido: round(NDT_REQ, D), valor_maximo: round(NDT_REQ * 1.05, D) },
        'Nutrientes digestíveis totais (g/kgMS)': { tipo: 'g/kgMS', valor_requerido: round(NDT_MS_REQ, D), valor_maximo: round(NDT_MS_REQ * 1.05, D) },
    };
}

function _calculateProteina(params) {
    const { input, PCV, PCVZ, GPCV, GPCVZ, CMS_REQ, especie, resultadosAnteriores } = params;
    const C = REQUIREMENTS[especie].PROTEINA;

    let PLM_REQ, PLG_REQ, PMM_REQ, PMG_REQ;

    if (especie === 'CAPRINOS') {
        let conf = C.LEITEIRO;
        if (input.categoriaAnimalId === 2) conf = C.NATIVA;
        if (input.categoriaAnimalId === 3) conf = C.CORTE;

        const sexoConf = _getSexoConfig(conf.PLG, input.sexoId);
        PLM_REQ = conf.PLM_FACTOR * (PCV ** 0.75);
        PLG_REQ = sexoConf.FACTOR * (PCV ** sexoConf.EXP) * GPCVZ;
        PMM_REQ = conf.PMM_FACTOR * (PCV ** 0.75);
        PMG_REQ = PLG_REQ / conf.PMG_DIV;
    } else { // OVINOS
        const sexoConf = _getSexoConfig(C.PLG, input.sexoId);
        PLM_REQ = C.PLM_FACTOR * (PCVZ ** 0.75);
        PLG_REQ = sexoConf.F1 * GPCV + sexoConf.F2 * resultadosAnteriores['Energia líquida de ganho'].valor_requerido;
        PMM_REQ = C.PMM_FACTOR * (PCVZ ** 0.75);
        PMG_REQ = PLG_REQ / C.PMG_DIV;
    }
    
    const PLT_REQ = PLM_REQ + PLG_REQ;
    const PMT_REQ = PMM_REQ + PMG_REQ;
    const NDT_g_d = resultadosAnteriores['Nutrientes digestíveis totais (g/dia)'].valor_requerido;
    const PDR_REQ = C.PDR_BASE + (C.PDR_FACTOR * (NDT_g_d / 1000));
    const PNDR_REQ = (PMT_REQ - (PDR_REQ * C.PNDR_FACTOR1)) / C.PNDR_FACTOR2;
    const PB_REQ = PDR_REQ + PNDR_REQ;
    const PB_MS_REQ = PB_REQ * 1000 / CMS_REQ;
    
    return {
        'Proteína líquida de mantença': { tipo: 'g/dia', valor_requerido: round(PLM_REQ, D), valor_maximo: round(PLM_REQ * 1.1, D) },
        'Proteína líquida de ganho': { tipo: 'g/dia', valor_requerido: round(PLG_REQ, D), valor_maximo: round(PLG_REQ * 1.1, D) },
        'Proteína líquida total': { tipo: 'g/dia', valor_requerido: round(PLT_REQ, D), valor_maximo: round(PLT_REQ * 1.1, D) },
        'Proteína metabolizável de mantença': { tipo: 'g/dia', valor_requerido: round(PMM_REQ, D), valor_maximo: round(PMM_REQ * 1.1, D) },
        'Proteína metabolizável de ganho': { tipo: 'g/dia', valor_requerido: round(PMG_REQ, D), valor_maximo: round(PMG_REQ * 1.1, D) },
        'Proteína metabolizável total': { tipo: 'g/dia', valor_requerido: round(PMT_REQ, D), valor_maximo: round(PMT_REQ * 1.1, D) },
        'Proteína degradável no rúmen': { tipo: 'g/dia', valor_requerido: round(PDR_REQ, D), valor_maximo: round(PDR_REQ * 1.1, D) },
        'Proteína não degradável no rúmen': { tipo: 'g/dia', valor_requerido: round(PNDR_REQ, D), valor_maximo: round(PNDR_REQ * 1.1, D) },
        'Proteína bruta (g/dia)': { tipo: 'g/dia', valor_requerido: round(PB_REQ, D), valor_maximo: round(PB_REQ * 1.1, D) },
        'Proteína bruta (g/kgMS)': { tipo: 'g/kgMS', valor_requerido: round(PB_MS_REQ, D), valor_maximo: round(PB_MS_REQ * 1.1, D) },
    };
}

function _calculateMinerais(params) {
    const { input, pesoMedio, PCVZ, GPCV, CMS_REQ, especie } = params;
    const C = REQUIREMENTS[especie].MINERAIS;
    const D = REQUIREMENTS.DECIMAIS;
    
    let resultados = {};

    if (especie === 'CAPRINOS') {
        // --- Cálcio (Ca) ---
        const CAM_REQ = C.Ca_m.FACTOR * pesoMedio / 1000;
        const sexoConfCa = _getSexoConfig(C.Ca_g, input.sexoId);
        const CAG_REQ = sexoConfCa.F * (PCVZ ** sexoConfCa.E) * GPCV;
        const CLT_REQ = CAM_REQ + CAG_REQ;
        const CAD_REQ = CLT_REQ / C.Ca_d.DIV;
        const CAT_MS_REQ = CAD_REQ * 1000 / CMS_REQ;
        
        // --- Fósforo (P) ---
        const FM_REQ = C.P_m.FACTOR * PCVZ / 1000;
        const sexoConfP = _getSexoConfig(C.P_g, input.sexoId);
        const FG_REQ = sexoConfP.F * (PCVZ ** sexoConfP.E) * GPCV;
        const FLT_REQ = FM_REQ + FG_REQ;
        const FD_REQ = FLT_REQ / C.P_d.DIV;
        const FT_MS_REQ = FD_REQ * 1000 / CMS_REQ;
        const REL_CA_P_REQ = CAT_MS_REQ / FT_MS_REQ;

        // --- Magnésio (Mg) ---
        const sexoConfMgM = _getSexoConfig(C.Mg_m, input.sexoId);
        const MGM_REQ = sexoConfMgM.F * PCVZ / 1000;
        const sexoConfMgG = _getSexoConfig(C.Mg_g, input.sexoId);
        const MGG_REQ = (sexoConfMgG.F * (PCVZ ** sexoConfMgG.E)) * GPCV;
        const MGLT_REQ = MGM_REQ + MGG_REQ;
        const MGD_REQ = MGLT_REQ / C.Mg_d.DIV;
        const MGT_MS_REQ = MGD_REQ * 1000 / CMS_REQ;

        // --- Sódio (Na) ---
        const NAM_REQ = C.Na_m.FACTOR * PCVZ / 1000;
        const sexoConfNa = _getSexoConfig(C.Na_g, input.sexoId);
        const NAG_REQ = (sexoConfNa.F * (PCVZ ** sexoConfNa.E)) * GPCV;
        const NALT_REQ = NAM_REQ + NAG_REQ;
        const NAD_REQ = NALT_REQ / C.Na_d.DIV;
        const NAT_MS_REQ = NAD_REQ * 1000 / CMS_REQ;

        // --- Potássio (K) ---
        const KM_REQ = C.K_m.FACTOR * PCVZ / 1000;
        const sexoConfK = _getSexoConfig(C.K_g, input.sexoId);
        const KG_REQ = (sexoConfK.F * (PCVZ ** sexoConfK.E)) * GPCV;
        const KLT_REQ = KM_REQ + KG_REQ;
        const KD_REQ = KLT_REQ / C.K_d.DIV;
        const KT_MS_REQ = KD_REQ * 1000 / CMS_REQ;
        
        // Monta o objeto de resultados para Caprinos
        Object.assign(resultados, {
            'Cálcio Mantença': { tipo: 'g/dia', valor_requerido: round(CAM_REQ, D) },
            'Cálcio Ganho': { tipo: 'g/dia', valor_requerido: round(CAG_REQ, D) },
            'Cálcio Líquido Total': { tipo: 'g/dia', valor_requerido: round(CLT_REQ, D) },
            'Cálcio Dietético': { tipo: 'g/dia', valor_requerido: round(CAD_REQ, D) },
            'Cálcio Total': { tipo: 'g/kgMS', valor_requerido: round(CAT_MS_REQ, D) },
            'Fósforo Mantença': { tipo: 'g/dia', valor_requerido: round(FM_REQ, D) },
            'Fósforo Ganho': { tipo: 'g/dia', valor_requerido: round(FG_REQ, D) },
            'Fósforo Líquido Total': { tipo: 'g/dia', valor_requerido: round(FLT_REQ, D) },
            'Fósforo Dietético': { tipo: 'g/dia', valor_requerido: round(FD_REQ, D) },
            'Fósforo Total': { tipo: 'g/kgMS', valor_requerido: round(FT_MS_REQ, D) },
            'Relação Ca:P': { tipo: 'g/kgMS', valor_requerido: round(REL_CA_P_REQ, D) },
            'Magnésio Mantença': { tipo: 'g/dia', valor_requerido: round(MGM_REQ, D) },
            'Magnésio Ganho': { tipo: 'g/dia', valor_requerido: round(MGG_REQ, D) },
            'Magnésio Líquido Total': { tipo: 'g/dia', valor_requerido: round(MGLT_REQ, D) },
            'Magnésio Dietético': { tipo: 'g/dia', valor_requerido: round(MGD_REQ, D) },
            'Magnésio Total': { tipo: 'g/kgMS', valor_requerido: round(MGT_MS_REQ, D) },
            'Sódio Mantença': { tipo: 'g/dia', valor_requerido: round(NAM_REQ, D) },
            'Sódio Ganho': { tipo: 'g/dia', valor_requerido: round(NAG_REQ, D) },
            'Sódio Líquido Total': { tipo: 'g/dia', valor_requerido: round(NALT_REQ, D) },
            'Sódio Dietético': { tipo: 'g/dia', valor_requerido: round(NAD_REQ, D) },
            'Sódio Total': { tipo: 'g/kgMS', valor_requerido: round(NAT_MS_REQ, D) },
            'Potássio Mantença': { tipo: 'g/dia', valor_requerido: round(KM_REQ, D) },
            'Potássio Ganho': { tipo: 'g/dia', valor_requerido: round(KG_REQ, D) },
            'Potássio Líquido Total': { tipo: 'g/dia', valor_requerido: round(KLT_REQ, D) },
            'Potássio Dietético': { tipo: 'g/dia', valor_requerido: round(KD_REQ, D) },
            'Potássio Total': { tipo: 'g/kgMS', valor_requerido: round(KT_MS_REQ, D) },
        });

    } else { // OVINOS
        // --- Cálcio (Ca) ---
        const CAM_REQ = C.Ca_m.F * pesoMedio / 1000;
        const sexoConfCa = _getSexoConfig(C.Ca_g, input.sexoId);
        const CAG_REQ = GPCV * (sexoConfCa.F * (PCVZ ** sexoConfCa.E));
        const CAD_REQ = (CAM_REQ + CAG_REQ) / C.Ca_d.DIV;
        const CAT_MS_REQ = CAD_REQ * 1000 / CMS_REQ;

        // --- Fósforo (P) ---
        const FM_REQ = C.P_m.F * pesoMedio / 1000;
        const sexoConfP = _getSexoConfig(C.P_g, input.sexoId);
        const FG_REQ = GPCV * (sexoConfP.F * (PCVZ ** sexoConfP.E));
        const FD_REQ = (FM_REQ + FG_REQ) / C.P_d.DIV;
        const FT_MS_REQ = FD_REQ * 1000 / CMS_REQ;
        const REL_CA_P_REQ = CAT_MS_REQ / FT_MS_REQ;

        // --- Magnésio (Mg) ---
        const MGM_REQ = C.Mg_m.F * pesoMedio / 1000;
        const sexoConfMg = _getSexoConfig(C.Mg_g, input.sexoId);
        const MGG_REQ = GPCV * (sexoConfMg.F * (PCVZ ** sexoConfMg.E));
        const MGLT_REQ = MGM_REQ + MGG_REQ;
        const MGD_REQ = MGLT_REQ / C.Mg_d.DIV;
        const MGT_MS_REQ = MGD_REQ * 1000 / CMS_REQ;

        // --- Sódio (Na) ---
        const NAM_REQ = C.Na_m.F * pesoMedio / 1000;
        const sexoConfNa = _getSexoConfig(C.Na_g, input.sexoId);
        const NAG_REQ = GPCV * (sexoConfNa.F * (PCVZ ** sexoConfNa.E));
        const NAD_REQ = (NAM_REQ + NAG_REQ) / C.Na_d.DIV;
        const NAT_MS_REQ = NAD_REQ * 1000 / CMS_REQ;

        // --- Potássio (K) ---
        const KM_REQ = C.K_m.F * pesoMedio / 1000;
        const KG_REQ = GPCV * (C.K_g.F * (PCVZ ** C.K_g.E));
        const KD_REQ = (KM_REQ + KG_REQ) / C.K_d.DIV;
        const KT_MS_REQ = KD_REQ * 1000 / CMS_REQ;
        
        // --- Cobre (Cu) ---
        const CUM_REQ = C.Cu_m.F * pesoMedio / 1000;
        const CUG_REQ = GPCV * (C.Cu_g.F * (PCVZ ** C.Cu_g.E));
        const CULT_REQ = CUM_REQ + CUG_REQ;
        const CUD_REQ = CULT_REQ / C.Cu_d.DIV;
        const CUT_MS_REQ = CUD_REQ * 1000 / CMS_REQ;

        // --- Ferro (Fe) ---
        const FEM_REQ = C.Fe_m.F * pesoMedio / 1000;
        const sexoConfFe = _getSexoConfig(C.Fe_g, input.sexoId);
        const FEG_REQ = GPCV * (sexoConfFe.F * (PCVZ ** sexoConfFe.E));
        const FELT_REQ = FEM_REQ + FEG_REQ;
        const FED_REQ = FELT_REQ / C.Fe_d.DIV;
        const FET_MS_REQ = FED_REQ * 1000 / CMS_REQ;

        // --- Manganês (Mn) ---
        const MNM_REQ = C.Mn_m.F * pesoMedio / 1000;
        const sexoConfMn = _getSexoConfig(C.Mn_g, input.sexoId);
        const MNG_REQ = GPCV * (sexoConfMn.F * (PCVZ ** sexoConfMn.E));
        const MNLT_REQ = MNM_REQ + MNG_REQ;
        const MND_REQ = MNLT_REQ / C.Mn_d.DIV;
        const MNT_MS_REQ = MND_REQ * 1000 / CMS_REQ;

        // --- Zinco (Zn) ---
        const ZNM_REQ = C.Zn_m.F * pesoMedio / 1000;
        const sexoConfZn = _getSexoConfig(C.Zn_g, input.sexoId);
        const ZNG_REQ = GPCV * (sexoConfZn.F * (PCVZ ** sexoConfZn.E));
        const ZNLT_REQ = ZNM_REQ + ZNG_REQ;
        const ZND_REQ = ZNLT_REQ / C.Zn_d.DIV;
        const ZNT_MS_REQ = ZND_REQ * 1000 / CMS_REQ;

        // --- Cobalto (Co) ---
        const COM_REQ = C.Co_m.F * pesoMedio / 1000;
        const COG_REQ = GPCV * (C.Co_g.F * (PCVZ ** C.Co_g.E));
        const COLT_REQ = COM_REQ + COG_REQ;
        const COD_REQ = COLT_REQ / C.Co_d.DIV;
        const COT_MS_REQ = COD_REQ * 1000 / CMS_REQ;

        // --- Cromo (Cr) ---
        const CRM_REQ = C.Cr_m.F * pesoMedio / 1000;
        const sexoConfCr = _getSexoConfig(C.Cr_g, input.sexoId);
        const CRG_REQ = GPCV * (sexoConfCr.F * (PCVZ ** sexoConfCr.E));
        const CRLT_REQ = CRM_REQ + CRG_REQ;
        const CRD_REQ = CRLT_REQ / C.Cr_d.DIV;
        const CRT_MS_REQ = CRD_REQ * 1000 / CMS_REQ;
        
        // Monta o objeto de resultados para Ovinos
        Object.assign(resultados, {
            'Cálcio Mantença': { tipo: 'g/dia', valor_requerido: round(CAM_REQ, D) },
            'Cálcio Ganho': { tipo: 'g/dia', valor_requerido: round(CAG_REQ, D) },
            'Cálcio Líquido Total': { tipo: 'g/dia', valor_requerido: round(CLT_REQ, D) },
            'Cálcio Dietético': { tipo: 'g/dia', valor_requerido: round(CAD_REQ, D) },
            'Cálcio Total': { tipo: 'g/kgMS', valor_requerido: round(CAT_MS_REQ, D) },
            'Fósforo Mantença': { tipo: 'g/dia', valor_requerido: round(FM_REQ, D) },
            'Fósforo Ganho': { tipo: 'g/dia', valor_requerido: round(FG_REQ, D) },
            'Fósforo Líquido Total': { tipo: 'g/dia', valor_requerido: round(FLT_REQ, D) },
            'Fósforo Dietético': { tipo: 'g/dia', valor_requerido: round(FD_REQ, D) },
            'Fósforo Total': { tipo: 'g/kgMS', valor_requerido: round(FT_MS_REQ, D) },
            'Relação Ca:P': { tipo: 'g/kgMS', valor_requerido: round(REL_CA_P_REQ, D) },
            'Magnésio Mantença': { tipo: 'g/dia', valor_requerido: round(MGM_REQ, D) },
            'Magnésio Ganho': { tipo: 'g/dia', valor_requerido: round(MGG_REQ, D) },
            'Magnésio Líquido Total': { tipo: 'g/dia', valor_requerido: round(MGLT_REQ, D) },
            'Magnésio Dietético': { tipo: 'g/dia', valor_requerido: round(MGD_REQ, D) },
            'Magnésio Total': { tipo: 'g/kgMS', valor_requerido: round(MGT_MS_REQ, D) },
            'Sódio Mantença': { tipo: 'g/dia', valor_requerido: round(NAM_REQ, D) },
            'Sódio Ganho': { tipo: 'g/dia', valor_requerido: round(NAG_REQ, D) },
            'Sódio Líquido Total': { tipo: 'g/dia', valor_requerido: round(NALT_REQ, D) },
            'Sódio Dietético': { tipo: 'g/dia', valor_requerido: round(NAD_REQ, D) },
            'Sódio Total': { tipo: 'g/kgMS', valor_requerido: round(NAT_MS_REQ, D) },
            'Potássio Mantença': { tipo: 'g/dia', valor_requerido: round(KM_REQ, D) },
            'Potássio Ganho': { tipo: 'g/dia', valor_requerido: round(KG_REQ, D) },
            'Potássio Líquido Total': { tipo: 'g/dia', valor_requerido: round(KLT_REQ, D) },
            'Potássio Dietético': { tipo: 'g/dia', valor_requerido: round(KD_REQ, D) },
            'Potássio Total': { tipo: 'g/kgMS', valor_requerido: round(KT_MS_REQ, D) },
            'Cobre Mantença': { tipo: 'mg/dia', valor_requerido: round(CUM_REQ, D) },
            'Cobre Ganho': { tipo: 'mg/dia', valor_requerido: round(CUG_REQ, D) },
            'Cobre Líquido Total': { tipo: 'mg/dia', valor_requerido: round(CULT_REQ, D) },
            'Cobre Dietético': { tipo: 'mg/dia', valor_requerido: round(CUD_REQ, D) },
            'Cobre Total': { tipo: 'mg/kgMS', valor_requerido: round(CUT_MS_REQ, D) },
            'Ferro Mantença': { tipo: 'mg/dia', valor_requerido: round(FEM_REQ, D) },
            'Ferro Ganho': { tipo: 'mg/dia', valor_requerido: round(FEG_REQ, D) },
            'Ferro Líquido Total': { tipo: 'mg/dia', valor_requerido: round(FELT_REQ, D) },
            'Ferro Dietético': { tipo: 'mg/dia', valor_requerido: round(FED_REQ, D) },
            'Ferro Total': { tipo: 'mg/kgMS', valor_requerido: round(FET_MS_REQ, D) },
            'Manganês Mantença': { tipo: 'mg/dia', valor_requerido: round(MNM_REQ, D) },
            'Manganês Ganho': { tipo: 'mg/dia', valor_requerido: round(MNG_REQ, D) },
            'Manganês Líquido Total': { tipo: 'mg/dia', valor_requerido: round(MNLT_REQ, D) },
            'Manganês Dietético': { tipo: 'mg/dia', valor_requerido: round(MND_REQ, D) },
            'Manganês Total': { tipo: 'mg/kgMS', valor_requerido: round(MNT_MS_REQ, D) },
            'Zinco Mantença': { tipo: 'mg/dia', valor_requerido: round(ZNM_REQ, D) },
            'Zinco Ganho': { tipo: 'mg/dia', valor_requerido: round(ZNG_REQ, D) },
            'Zinco Líquido Total': { tipo: 'mg/dia', valor_requerido: round(ZNLT_REQ, D) },
            'Zinco Dietético': { tipo: 'mg/dia', valor_requerido: round(ZND_REQ, D) },
            'Zinco Total': { tipo: 'mg/kgMS', valor_requerido: round(ZNT_MS_REQ, D) },
            'Cobalto Mantença': { tipo: 'mg/dia', valor_requerido: round(COM_REQ, D) },
            'Cobalto Ganho': { tipo: 'mg/dia', valor_requerido: round(COG_REQ, D) },
            'Cobalto Líquido Total': { tipo: 'mg/dia', valor_requerido: round(COLT_REQ, D) },
            'Cobalto Dietético': { tipo: 'mg/dia', valor_requerido: round(COD_REQ, D) },
            'Cobalto Total': { tipo: 'mg/kgMS', valor_requerido: round(COT_MS_REQ, D) },
            'Cromo Mantença': { tipo: 'mg/dia', valor_requerido: round(CRM_REQ, D) },
            'Cromo Ganho': { tipo: 'mg/dia', valor_requerido: round(CRG_REQ, D) },
            'Cromo Líquido Total': { tipo: 'mg/dia', valor_requerido: round(CRLT_REQ, D) },
            'Cromo Dietético': { tipo: 'mg/dia', valor_requerido: round(CRD_REQ, D) },
            'Cromo Total': { tipo: 'mg/kgMS', valor_requerido: round(CRT_MS_REQ, D) },
        });
    }

    // Adiciona valores máximos genéricos para consistência, pode ser ajustado
    for (const key in resultados) {
        if (resultados[key].valor_requerido) {
            resultados[key].valor_maximo = round(resultados[key].valor_requerido * 1.3, D);
        }
    }
    
    return resultados;
}

function calculateAllRequirements(input) {
    const R = REQUIREMENTS;
    const pesoMedio = (input.pesoInicial + input.pesoFinal) / 2;
    let commonParams;

    if (input.especieId === 1) { // Caprinos
        const C = R.CAPRINOS;
        const CTGI = C.PESO.CTGI_FACTOR * (pesoMedio ** C.PESO.CTGI_EXP);
        const PCV = pesoMedio - (CTGI * pesoMedio / 1000);
        const GPCVZ = C.PESO.GPCVZ_FACTOR * (input.GMD ** C.PESO.GPCVZ_EXP) / 1000;
        
        let confCms = C.CMS.FEMEA;
        if (input.sexoId === 1) confCms = C.CMS.INTEIRO;
        if (input.sexoId === 2) confCms = C.CMS.CASTRADO;
        const CMS_REQ = confCms.BASE + confCms.FACTOR * pesoMedio;

        // Lógica interdependente para KG
        let confEnergia = C.ENERGIA.LEITEIRO;
        if (input.categoriaAnimalId === 2) confEnergia = C.ENERGIA.NATIVA;
        if (input.categoriaAnimalId === 3) confEnergia = C.ENERGIA.CORTE;
        const sexoConfEnergia = _getSexoConfig(confEnergia, input.sexoId);
        const ELg_REQ_temp = sexoConfEnergia.ELg_FACTOR * (PCV ** sexoConfEnergia.ELg_EXP) * GPCVZ;
        
        let confProteina = C.PROTEINA.LEITEIRO;
        if (input.categoriaAnimalId === 2) confProteina = C.PROTEINA.NATIVA;
        if (input.categoriaAnimalId === 3) confProteina = C.PROTEINA.CORTE;
        const sexoConfProteina = _getSexoConfig(confProteina.PLG, input.sexoId);
        const PLG_REQ_temp = sexoConfProteina.FACTOR * (PCV ** sexoConfProteina.EXP) * GPCVZ;

        const ERP = (PLG_REQ_temp / 1000 * 5.686) / ELg_REQ_temp;
        const KG = 17 / (21 + ERP * 60);

        commonParams = { input, pesoMedio, PCV, GPCVZ, CMS_REQ, KG, especie: 'CAPRINOS' };

    } else { // Ovinos
        const O = R.OVINOS;
        const PCJ = O.PESO.PCJ_BASE + O.PESO.PCJ_FACTOR * pesoMedio;
        const PCVZ = O.PESO.PCVZ_BASE + O.PESO.PCVZ_FACTOR * PCJ;
        const GPCV = (O.PESO.GPCV_FACTOR * input.GMD) / 1000;
        const CMS_REQ = O.CMS.BASE + (O.CMS.FACTOR_PESO * (pesoMedio ** O.CMS.PESO_EXP)) + (O.CMS.FACTOR_GMD * input.GMD);
        
        commonParams = { input, pesoMedio, PCVZ, GPCV, CMS_REQ, especie: 'OVINOS' };
    }

    const cmsResult = {
        'Consumo de matéria seca': { tipo: 'g/d', valor_requerido: round(commonParams.CMS_REQ, D), valor_maximo: round(commonParams.CMS_REQ * 1.1, D) },
        'Consumo de matéria seca (%PV)': { tipo: '%PV', valor_requerido: round(commonParams.CMS_REQ / pesoMedio / 10, D), valor_maximo: round((commonParams.CMS_REQ / pesoMedio / 10) * 1.1, D) }
    };

    const energiaResult = _calculateEnergia(commonParams);
    const proteinaResult = _calculateProteina({ ...commonParams, resultadosAnteriores: { ...cmsResult, ...energiaResult } });
    const mineraisResult = _calculateMinerais(commonParams);
    
    return { ...cmsResult, ...energiaResult, ...proteinaResult, ...mineraisResult };
}


module.exports = { calculateAllRequirements };
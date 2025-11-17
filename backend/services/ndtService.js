const { NDT, round } = require('./calculationConstants');

function calculateNdt(input) {
    const C = NDT;
    const D = C.DECIMAIS;

    let PBvd;
    if (input.PIDN == 0.0 && input.PIDA == 0.0) {
        PBvd = (C.PBvd.NO_PIDN_PIDA_FACTOR * input.PB) - 0.44;
    } else {
        PBvd = C.PBvd.FACTOR1 * (input.PB - input.PIDN) + C.PBvd.FACTOR2 * (input.PIDN - input.PIDA);
    }

    const CNF = input.MO - input.EE - input.PB - input.FDN;
    const EEvd = ((C.EEvd_FACTOR * input.EE) * 2.25) - 0.33;
    const FDNd = (C.FDNd_FACTOR * (input.FDN - input.Ligrina)) * (1 - (input.Ligrina / (input.FDN) ** C.FDNd_EXP));
    const CNFvd = (C.CNFvd_FACTOR * CNF) - 3.22;
    const NDT_Result = PBvd + EEvd * 2.25 + FDNd + CNFvd - C.NDT_SUB;
    const Ed = NDT_Result * C.ED_FACTOR;
    const Em_caprinos = C.EM_CAPRINOS.BASE + C.EM_CAPRINOS.FACTOR * Ed;
    const Em_ovinos = C.EM_OVINOS.BASE + C.EM_OVINOS.FACTOR * Ed;

    return {
        'Proteína bruta verdadeiramente digestível': { tipo: '%', valor: round(PBvd, D) },
        'Extrato etéreo verdadeiramente digestível': { tipo: '%', valor: round(EEvd, D) },
        'Fibra em detergente neutro digestível': { tipo: '%', valor: round(FDNd, D) },
        'Carboidratos não-fibrosos verdadeiramente digestíveis': { tipo: '%', valor: round(CNFvd, D) },
        'Nutrientes digestíveis totais': { tipo: '%', valor: round(NDT_Result, D) },
        'Energia digestivel': { tipo: 'Mcal/dia', valor: round(Ed, D) },
        'Energia metabolizável para caprinos': { tipo: 'Mcal/dia', valor: round(Em_caprinos, D) },
        'Energia metabolizável para ovinos': { tipo: 'Mcal/dia', valor: round(Em_ovinos, D) },
    };
}

module.exports = { calculateNdt };
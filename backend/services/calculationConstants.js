const round = (value, decimals) => {
    if (!value && value !== 0) return 0;
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};

const REQUIREMENTS = {
    DECIMAIS: 3,
    CAPRINOS: {
        PESO: { CTGI_FACTOR: 525.5, CTGI_EXP: -0.33, GPCVZ_FACTOR: 1.1259, GPCVZ_EXP: 0.941 },
        CMS: {
            INTEIRO: { BASE: 78.12, FACTOR: 30.9309 },
            CASTRADO: { BASE: 57.2919, FACTOR: 30.9309 },
            FEMEA: { BASE: 36.4638, FACTOR: 30.9309 },
        },
        ENERGIA: {
            LEITEIRO: {
                INTEIRO:  { ELm_FACTOR: 0.075, ELg_FACTOR: 1.206, ELg_EXP: 0.24, EMm_DIV: 0.62 },
                CASTRADO: { ELm_FACTOR: 0.075, ELg_FACTOR: 1.014, ELg_EXP: 0.359, EMm_DIV: 0.62 },
                FEMEA:    { ELm_FACTOR: 0.0636, ELg_FACTOR: 0.953, ELg_EXP: 0.444, EMm_DIV: 0.63 },
            },
            NATIVA:   { ELm_FACTOR: 0.074, ELg_FACTOR: 1.068, ELg_EXP: 0.35, EMm_DIV: 0.62 },
            CORTE:    { ELm_FACTOR: 0.0803, ELg_FACTOR: 1.068, ELg_EXP: 0.35, EMm_DIV: 0.64 },
            ED_MS_FACTOR1: 0.0862, ED_MS_FACTOR2: 0.899,
            EDT_DIV: 0.889, NDT_DIV: 4.4,
        },
    },
};

const NDT = {
    DECIMAIS: 2,
    PBvd: { NO_PIDN_PIDA_FACTOR: 0.7934, FACTOR1: 0.98, FACTOR2: 0.7877 },
    EEvd_FACTOR: 0.9107,
    FDNd_FACTOR: 0.7877,
    FDNd_EXP: 0.85,
    CNFvd_FACTOR: 0.9041,
    NDT_SUB: 4,
    ED_FACTOR: 0.04409,
    EM_CAPRINOS: { BASE: -0.0862, FACTOR: 0.889 },
    EM_OVINOS: { BASE: -0.1559, FACTOR: 0.8503 },
};

module.exports = { REQUIREMENTS, NDT, round };
/**
 * Função utilitária para arredondar um número para uma quantidade específica de casas decimais.
 * @param {number} value - O número a ser arredondado.
 * @param {number} decimals - O número de casas decimais.
 * @returns {number} O número arredondado.
 */
const round = (value, decimals) => {
    if (!value && value !== 0) return 0;
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};

/**
 * Coeficientes para os cálculos de Exigências Nutricionais.
 * Divididos por espécie (CAPRINOS e OVINOS).
 */
const REQUIREMENTS = {
    DECIMAIS: 2,
    CAPRINOS: {
        PESO: { CTGI_FACTOR: 525.5, CTGI_EXP: -0.33, GPCVZ_FACTOR: 1.1259, GPCVZ_EXP: 0.941 },
        CMS: {
            INTEIRO: { BASE: 78.12, FACTOR: 30.9309 },
            CASTRADO: { BASE: 57.2919, FACTOR: 30.9309 },
            FEMEA: { BASE: 36.4638, FACTOR: 30.9309 },
        },
        ENERGIA: {
            EDT_DIV: 0.889, NDT_DIV: 4.4,
            LEITEIRO: {
                INTEIRO:  { ELm_FACTOR: 0.075, ELg_FACTOR: 1.206, ELg_EXP: 0.24, EMm_DIV: 0.62 },
                CASTRADO: { ELm_FACTOR: 0.075, ELg_FACTOR: 1.014, ELg_EXP: 0.359, EMm_DIV: 0.62 },
                FEMEA:    { ELm_FACTOR: 0.0636, ELg_FACTOR: 0.953, ELg_EXP: 0.444, EMm_DIV: 0.63 },
            },
            NATIVA:   { ELm_FACTOR: 0.074, ELg_FACTOR: 1.068, ELg_EXP: 0.35, EMm_DIV: 0.62 },
            CORTE:    { ELm_FACTOR: 0.0803, ELg_FACTOR: 1.068, ELg_EXP: 0.35, EMm_DIV: 0.64 },
        },
        PROTEINA: {
            PDR_BASE: 12.7311, PDR_FACTOR: 59.2956, PNDR_FACTOR1: 0.64, PNDR_FACTOR2: 0.8,
            LEITEIRO: { PLM_FACTOR: 1.46, PMM_FACTOR: 4.4, PMG_DIV: 0.52, PLG: {
                INTEIRO: { FACTOR: 168.836, EXP: 0.015 },
                CASTRADO: { FACTOR: 168.836, EXP: 0.015 },
                FEMEA: { FACTOR: 181.4, EXP: -0.0414 },
            }},
            NATIVA:   { PLM_FACTOR: 1.92, PMM_FACTOR: 3.79, PMG_DIV: 0.55, PLG: { FACTOR: 181.4, EXP: 0.02 } },
            CORTE:    { PLM_FACTOR: 1.92, PMM_FACTOR: 3.79, PMG_DIV: 0.55, PLG: { FACTOR: 181.4, EXP: 0.02 } },
        },
        MINERAIS: {
            Ca_m: { FACTOR: 20.97 }, Ca_d: { DIV: 0.66 }, P_m: { FACTOR: 27.4 }, P_d: { DIV: 0.69 },
            Mg_d: { DIV: 0.2 }, Na_m: { FACTOR: 5.14 }, Na_d: { DIV: 0.8 }, K_m: { FACTOR: 4.79 }, K_d: { DIV: 0.9 },
            Ca_g: { INTEIRO: { F: 10.1, E: -0.0031 }, CASTRADO: { F: 9.47, E: -0.0031 }, FEMEA: { F: 9.64, E: -0.0031 } },
            P_g: { INTEIRO: { F: 7.94, E: -0.0015 }, CASTRADO: { F: 7.77, E: -0.0015 }, FEMEA: { F: 7.74, E: -0.0015 } },
            Mg_m: { INTEIRO: { F: 3.18 }, CASTRADO: { F: 1.67 }, FEMEA: { F: 1.67 } },
            Mg_g: { INTEIRO: { F: 0.449, E: 0.066 }, CASTRADO: { F: 0.428, E: 0.0351 }, FEMEA: { F: 0.494, E: -0.039 } },
            Na_g: { INTEIRO: { F: 1.81, E: -0.185 }, CASTRADO: { F: 1.76, E: -0.185 }, FEMEA: { F: 1.67, E: -0.185 } },
            K_g: { INTEIRO: { F: 2.05, E: -0.149 }, CASTRADO: { F: 2.1, E: -0.149 }, FEMEA: { F: 2.09, E: -0.149 } },
        }
    },
    OVINOS: {
        PESO: { PCJ_BASE: -0.547, PCJ_FACTOR: 0.9313, PCVZ_BASE: -1.4944, PCVZ_FACTOR: 0.8816, GPCV_FACTOR: 0.906 },
        CMS: { BASE: -145.68, FACTOR_PESO: 77.3709, PESO_EXP: 0.75, FACTOR_GMD: 1.3985 },
        ENERGIA: {
            ELm_FACTOR: 0.065, EMm_DIV: 0.64, EMg_DIV: 0.29, EDT_DIV: 0.85, NDT_DIV: 4.409,
            ELg: { INTEIRO: { F: 0.248, E: 0.8767 }, CASTRADO: { F: 0.248, E: 0.83 }, FEMEA: { F: 0.248, E: 0.83 } }
        },
        PROTEINA: {
            PLM_FACTOR: 1.32, PMM_FACTOR: 3.95, PMG_DIV: 0.25, PDR_BASE: 12.7311, PDR_FACTOR: 59.2956, PNDR_FACTOR1: 0.64, PNDR_FACTOR2: 0.8,
            PLG: { INTEIRO: { F1: 205.03, F2: -34.518 }, CASTRADO: { F1: 182.61, F2: -34.518 }, FEMEA: { F1: 182.61, F2: -34.518 } }
        },
        MINERAIS: {
            Ca_m: { F: 23.7 }, Ca_d: { DIV: 0.543 }, P_m: { F: 25.33 }, P_d: { DIV: 0.798 },
            Mg_m: { F: 2.63 }, Mg_d: { DIV: 0.085 }, Na_m: { F: 7.01 }, Na_d: { DIV: 0.081 },
            K_m: { F: 11.74 }, K_d: { DIV: 0.05 }, Cu_m: { F: 34.85 }, Cu_d: { DIV: 0.23 },
            Fe_m: { F: 39.63 }, Fe_d: { DIV: 0.13 }, Mn_m: { F: 6.11 }, Mn_d: { DIV: 0.007 },
            Zn_m: { F: 194.00 }, Zn_d: { DIV: 0.287 }, Co_m: { F: 6.06 }, Co_d: { DIV: 0.138 },
            Cr_m: { F: 11.67 }, Cr_d: { DIV: 0.086 },
            Ca_g: { INTEIRO: { F: 17.04, E: -0.1652 }, CASTRADO: { F: 16.75, E: -0.1192 }, FEMEA: { F: 17.52, E: -0.1465 } },
            P_g: { INTEIRO: { F: 9.19, E: -0.2057 }, CASTRADO: { F: 8.65, E: -0.1317 }, FEMEA: { F: 9.16, E: -0.1627 } },
            Mg_g: { INTEIRO: { F: 0.45, E: -0.0847 }, CASTRADO: { F: 0.39, E: 0.048 }, FEMEA: { F: 0.45, E: -0.0649 } },
            Na_g: { INTEIRO: { F: 1.66, E: -0.1622 }, CASTRADO: { F: 1.23, E: 0.031 }, FEMEA: { F: 1.03, E: 0.184 } },
            K_g: { F: 1.96, E: -0.0102 }, Cu_g: { F: 7.64, E: -0.2876 }, Co_g: { F: 1.37, E: 0 },
            Fe_g: { INTEIRO: { F: 121.72, E: -0.1976 }, CASTRADO: { F: 144.8, E: -0.3403 }, FEMEA: { F: 186.57, E: -0.6933 } },
            Mn_g: { INTEIRO: { F: 3.51, E: 0.045 }, CASTRADO: { F: 2.67, E: -0.2845 }, FEMEA: { F: 3.09, E: -0.1278 } },
            Zn_g: { INTEIRO: { F: 45.8, E: -0.0474 }, CASTRADO: { F: 48.34, E: -0.0875 }, FEMEA: { F: 86.42, E: -0.6441 } },
            Cr_g: { INTEIRO: { F: 1.32, E: 0.3050 }, CASTRADO: { F: 1.17, E: 0.39 }, FEMEA: { F: 3.67, E: -0.6311 } }
        }
    }
};

/**
 * Coeficientes para os cálculos de NDT (Nutrientes Digestíveis Totais).
 * Baseado nas equações do BRCO.
 */
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
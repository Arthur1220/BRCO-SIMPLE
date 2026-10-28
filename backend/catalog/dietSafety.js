const { L } = require('../lib/i18n');

/**
 * Travas de segurança da formulação de dieta.
 *
 * Ficam separadas das exigências (domain/requirementService) de propósito: são
 * limites de segurança da DIETA, ajustáveis aqui depois da revisão técnica,
 * sem mexer nas equações do BR-CO. As porcentagens são da matéria seca (MS).
 * Fontes e justificativas: ESTUDO_DIETA_CAPRINOS_OVINOS.md, seção 3.
 */
const DIET_SAFETY = {
    eeMaxPercent: 6,             // Extrato etéreo: acima disso cai a digestão da fibra
    fdnMinPercent: 25,           // FDN total mínima (acidose)
    cnfMaxPercent: 45,           // Carboidratos não fibrosos máximos (acidose)
    caPMinMale: 2,               // Relação Ca:P mínima para machos (urolitíase)
    ureaMaxPercent: 1,           // Ureia (ou NNP equivalente) na MS
    nnpMaxShareOfPb: 1 / 3,      // Fração máxima da PB vinda de NNP
    copperMaxSheep: 15,          // mg Cu/kg MS para ovinos
    cuMoRange: [4, 10],          // Relação Cu:Mo recomendada
    sulfurMaxPercent: 0.3,       // Enxofre total (polioencefalomalácia)
    concentrateAdaptationPercent: 60, // Acima disso, a dieta exige adaptação
    maleUrolithiasisConcentratePercent: 50, // Macho com muito concentrado: cloreto de amônio
    fdnIntakeMaxPercentBW: 1.4,
    // PDR e PNDR mínimos como restrição da formulação. Desligado até a revisão técnica:
    // com a PNDR do BR-CO, dietas comuns passam a exigir muito farelo e PB bem acima do
    // necessário. Ligado ou não, PDR e PNDR sempre aparecem no balanço.
    proteinFractionsInFormulation: false,  // Consumo de FDN (% do peso vivo) acima do qual o enchimento limita a ingestão
};

// PB equivalente da ureia (g/kg MS): 1% de ureia na MS = 2,81% de PB vinda de NNP.
const UREA_PB_EQUIVALENT = 2810;
// Nenhum alimento tem mais que 100% de proteína verdadeira; acima disso a PB é NNP.
const TRUE_PROTEIN_MAX = 1000;

const SPECIES_CODES = { 1: 'caprino', 2: 'ovino' };
const MALE_SEX_IDS = new Set([1, 2]);

// Espécie de destino de um suplemento (cadastro de alimentos).
const TARGET_SPECIES = [
    { code: 'TODAS', label: L('Todas as espécies', 'All species') },
    { code: 'PEQUENOS_RUMINANTES', label: L('Caprinos e ovinos', 'Goats and sheep') },
    { code: 'OVINO', label: L('Ovinos', 'Sheep') },
    { code: 'CAPRINO', label: L('Caprinos', 'Goats') },
    { code: 'BOVINO', label: L('Bovinos', 'Cattle') },
];
const TARGET_SPECIES_CODES = TARGET_SPECIES.map((s) => s.code);

/**
 * Verificações exibidas no resultado. `unit` é a unidade do valor calculado.
 */
const SAFETY_CHECKS = [
    { code: 'ee', unit: '%MS', label: L('Gordura (extrato etéreo)', 'Fat (ether extract)') },
    { code: 'fdn', unit: '%MS', label: L('Fibra (FDN total)', 'Fiber (total NDF)') },
    { code: 'cnf', unit: '%MS', label: L('Carboidratos não fibrosos', 'Non-fiber carbohydrates') },
    { code: 'ca_p', unit: ':1', label: L('Relação cálcio:fósforo', 'Calcium:phosphorus ratio') },
    { code: 'urea', unit: '%MS', label: L('Ureia (NNP equivalente)', 'Urea (NPN equivalent)') },
    { code: 'nnp_share', unit: '%PB', label: L('Proteína vinda de NNP', 'Protein from NPN') },
    { code: 'cu', unit: 'mg/kg MS', label: L('Cobre', 'Copper') },
    { code: 's', unit: '%MS', label: L('Enxofre', 'Sulfur') },
    { code: 'concentrate', unit: '%MS', label: L('Concentrado na dieta', 'Concentrate in the diet') },
];

/**
 * Avisos do resultado. `severity`: info, warning ou blocked.
 * Os textos aceitam {parâmetros} preenchidos pelo presenter.
 */
const DIET_WARNINGS = {
    requirement_unavailable: {
        severity: 'warning',
        message: L(
            'A exigência de {nutrient} não está disponível para este animal; o balanço desse nutriente não foi avaliado.',
            'The {nutrient} requirement is not available for this animal; this nutrient was not evaluated.'
        ),
    },
    missing_data: {
        severity: 'warning',
        message: L(
            'Sem teor de {nutrient} cadastrado em: {foods}. A trava de {nutrient} considerou só os alimentos com dado.',
            'No {nutrient} content registered for: {foods}. The {nutrient} limit only considered foods with data.'
        ),
    },
    supplement_blocked_species: {
        severity: 'blocked',
        message: L(
            '{foods}: suplemento para bovinos não pode ser usado em ovinos (risco de intoxicação por cobre) e foi retirado da dieta.',
            '{foods}: cattle supplement cannot be fed to sheep (copper toxicity risk) and was removed from the diet.'
        ),
    },
    cu_mo_ratio: {
        severity: 'warning',
        message: L(
            'Relação Cu:Mo de {ratio}:1, fora da faixa recomendada de {min}:1 a {max}:1.',
            'Cu:Mo ratio of {ratio}:1, outside the recommended {min}:1 to {max}:1 range.'
        ),
    },
    urea_adaptation: {
        severity: 'info',
        message: L(
            'A dieta tem ureia: adapte os animais aos poucos (15 a 21 dias), misture bem e nunca forneça em jejum.',
            'The diet contains urea: adapt the animals gradually (15 to 21 days), mix well and never feed on an empty stomach.'
        ),
    },
    concentrate_adaptation: {
        severity: 'warning',
        message: L(
            'A dieta tem {value}% de concentrado: faça adaptação gradual (10 a 21 dias) para evitar acidose.',
            'The diet has {value}% concentrate: adapt gradually (10 to 21 days) to avoid acidosis.'
        ),
    },
    urolithiasis_males: {
        severity: 'info',
        message: L(
            'Machos com muito concentrado têm risco de urolitíase (cálculo urinário): mantenha água limpa à vontade e avalie cloreto de amônio (0,5 a 1% da MS) com o técnico.',
            'Males on high-concentrate diets are at risk of urolithiasis (urinary calculi): keep clean water available and discuss ammonium chloride (0.5 to 1% of DM) with your nutritionist.'
        ),
    },
    protein_fractions_not_evaluated: {
        severity: 'warning',
        message: L(
            'PDR e PNDR não entraram na formulação porque faltam esses dados em: {foods}. Só a proteína bruta foi atendida.',
            'RDP and RUP were not used in the formulation because these data are missing for: {foods}. Only crude protein was met.'
        ),
    },
    intake_fill: {
        severity: 'warning',
        message: L(
            'A dieta tem consumo de FDN de {value}% do peso vivo (acima de {max}%): o enchimento do rúmen pode impedir o animal de comer tudo. Reduza o volumoso mais fibroso.',
            'The diet has an NDF intake of {value}% of body weight (above {max}%): rumen fill may keep the animal from eating it all. Reduce the most fibrous roughage.'
        ),
    },
    nutrition_infeasible: {
        severity: 'blocked',
        message: L(
            'Mesmo sem os seus limites de inclusão, estes alimentos não atendem a proteína e a energia exigidas.',
            'Even without your inclusion limits, these foods cannot meet the required protein and energy.'
        ),
    },
    safety_infeasible: {
        severity: 'blocked',
        message: L(
            'Com estes alimentos não é possível montar uma dieta segura. Trava que impede: {checks}.',
            'A safe diet cannot be built with these foods. Blocking limit: {checks}.'
        ),
    },
};

const SEVERITY_LABELS = {
    info: L('Informação', 'Information'),
    warning: L('Atenção', 'Warning'),
    blocked: L('Bloqueio', 'Blocked'),
};

// Nome dos nutrientes usados nos avisos.
const NUTRIENT_LABELS = {
    Ca: L('cálcio', 'calcium'),
    P: L('fósforo', 'phosphorus'),
    EE: L('extrato etéreo', 'ether extract'),
    CNF: L('carboidratos não fibrosos', 'non-fiber carbohydrates'),
    Cu: L('cobre', 'copper'),
};

module.exports = {
    DIET_SAFETY, UREA_PB_EQUIVALENT, TRUE_PROTEIN_MAX, SPECIES_CODES, MALE_SEX_IDS,
    TARGET_SPECIES, TARGET_SPECIES_CODES, SAFETY_CHECKS, DIET_WARNINGS, SEVERITY_LABELS, NUTRIENT_LABELS,
};

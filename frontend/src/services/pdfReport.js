/*
 * Relatórios em PDF (dieta, exigências e NDT), gerados no navegador a partir do
 * cálculo salvo já apresentado pela API v1 (labels, unidades e status prontos).
 * jsPDF e jspdf-autotable são carregados só quando o usuário gera o PDF.
 *
 * As fontes padrão do PDF (Helvetica) só têm caracteres Latin-1: nada de ≤, ≥ ou —.
 */

import { formatMass } from './format.js';

const BRAND = [217, 119, 6];
const INK = [31, 41, 55];
const MUTED = [107, 114, 128];
const MARGIN = 14;

/**
 * Seções disponíveis por tipo de cálculo (o usuário escolhe quais entram).
 */
export const REPORT_SECTIONS = {
  diet: ['summary', 'recipe', 'feeding', 'balance', 'safety', 'warnings', 'insights', 'requirements', 'feedingSheet'],
  requirements: ['summary', 'details'],
  ndt: ['summary', 'details'],
};

const fmt = (value, locale, decimals = 2) =>
  value === null || value === undefined || value === ''
    ? '-'
    : Number(value).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const limitText = (check, locale) => (check.limit === null ? '-' : `${check.kind === 'max' ? 'máx.' : 'mín.'} ${fmt(check.limit, locale)}`);

/**
 * Gera o PDF e devolve { blob, filename }.
 * @param {object} calculation - resposta de GET /api/v1/calculations/:id
 * @param {object} options - { title, farm, lot, author, notes, sections: Set, option, labels, locale }
 *   labels: textos já traduzidos (t) usados no relatório.
 */
export async function buildPdf(calculation, options) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const { labels: L, locale } = options;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  const ensureSpace = (needed) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 18) {
      doc.addPage();
      y = 18;
    }
  };
  const heading = (text) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(text, MARGIN, y);
    y += 2;
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + 20, y);
    y += 4;
  };
  const paragraph = (text, size = 9.5, color = INK) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageWidth - MARGIN * 2);
    ensureSpace(lines.length * size * 0.45 + 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * size * 0.45 + 2;
  };
  const table = (head, body, extra = {}) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 1.6, textColor: INK },
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      ...extra,
    });
    y = doc.lastAutoTable.finalY + 6;
  };

  // --- Cabeçalho -------------------------------------------------------------
  doc.setFillColor(...BRAND);
  doc.rect(MARGIN, 10, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('BRCO · ' + L.brand, MARGIN + 6, 13.4);
  y = 22;
  doc.setFontSize(17);
  doc.setTextColor(...INK);
  doc.text(options.title || L.defaultTitle, MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${L.generatedAt} ${new Date().toLocaleString(locale)} · ${L.calculation} ${calculation.calculationId}`, MARGIN, y);
  y += 7;

  const info = [
    [L.farm, options.farm],
    [L.lot, options.lot],
    [L.author, options.author],
  ].filter(([, value]) => value);
  if (info.length) {
    table([L.field, L.value], info, { theme: 'plain', headStyles: { fillColor: false, textColor: MUTED }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } } });
  }
  if (options.animalSummary) paragraph(options.animalSummary, 9.5, INK);
  if (options.notes) {
    paragraph(`${L.notes}: ${options.notes}`, 9.5, INK);
  }
  y += 2;

  const want = (section) => options.sections.has(section);

  // --- Exigências e NDT (resultado agrupado) --------------------------------
  if (calculation.type !== 'diet') {
    if (want('summary')) {
      heading(L.summary);
      table([L.parameter, L.value, L.unit], calculation.highlights.map((item) => [item.label, fmt(item.value, locale, item.decimals), item.unit]));
    }
    if (want('details')) {
      for (const group of calculation.groups) {
        heading(group.label);
        const hasMax = group.items.some((item) => item.max !== undefined);
        table(
          hasMax ? [L.parameter, L.required, L.maximum, L.unit] : [L.parameter, L.value, L.unit],
          group.items.map((item) => (hasMax
            ? [item.label, fmt(item.value, locale, item.decimals), item.max !== undefined ? fmt(item.max, locale, item.decimals) : '-', item.unit]
            : [item.label, fmt(item.value, locale, item.decimals), item.unit]))
        );
      }
    }
    return finish(doc, L, options, calculation);
  }

  // --- Dieta ---------------------------------------------------------------
  const solution = calculation.solution ?? calculation.options?.find((o) => o.code === options.option)?.solution;
  if (!solution) return finish(doc, L, options, calculation);

  if (want('summary')) {
    heading(L.summary);
    const rows = [
      [L.intakeDM, `${fmt(solution.totals.intakeKgPerDay, locale, 3)} kg MS/animal/d`],
      solution.totals.intakeKgAsFedPerDay != null ? [L.intakeAsFed, `${fmt(solution.totals.intakeKgAsFedPerDay, locale, 3)} kg MN/animal/d`] : null,
      [L.costPerDay, `R$ ${fmt(solution.totals.costPerDay, locale)}/animal/d`],
      solution.totals.costPerKgGain != null ? [L.costPerKgGain, `R$ ${fmt(solution.totals.costPerKgGain, locale)}/kg`] : null,
      [L.status, calculation.statusLabel],
    ].filter(Boolean);
    table([L.parameter, L.value], rows, { columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } } });
  }

  if (want('recipe')) {
    heading(L.recipe);
    const priceUnit = solution.priceBasis === 'MN' ? 'R$/kg MN' : 'R$/kg MS';
    table(
      [L.ingredient, L.inclusion, 'kg MS/d', 'kg MN/d', priceUnit, 'R$/d'],
      solution.ingredients.filter((ing) => ing.percent > 0).map((ing) => [
        ing.name,
        `${fmt(ing.percent, locale)}%`,
        fmt(ing.kgPerDay, locale, 3),
        fmt(ing.kgAsFedPerDay, locale, 3),
        fmt(solution.priceBasis === 'MN' ? ing.priceAsFed : ing.price, locale),
        fmt(ing.costPerDay, locale),
      ])
    );
  }

  if (want('feeding') && solution.feeding) {
    const { feeding } = solution;
    heading(L.feeding);
    paragraph(L.feedingHint(feeding.animals, feeding.feedingsPerDay), 9, MUTED);
    table(
      [L.ingredient, L.perFeedingAsFed, L.perFeedingDM],
      [
        ...feeding.perFeeding.map((item) => [item.name, formatMass(item.kgAsFed, locale), formatMass(item.kgDryMatter, locale)]),
        [L.lotPerDay, `${fmt(feeding.kgAsFedPerDay, locale)} kg MN`, `${fmt(feeding.kgDryMatterPerDay, locale)} kg MS · R$ ${fmt(feeding.costPerDay, locale)}`],
      ],
      { didParseCell: (data) => { if (data.row.index === feeding.perFeeding.length) data.cell.styles.fontStyle = 'bold'; } }
    );
  }

  if (want('balance')) {
    heading(L.balance);
    table(
      [L.nutrient, L.required, L.supplied, L.difference, L.status],
      solution.balance.map((item) => [
        `${item.label} (${item.unit})`,
        item.required === null ? L.notAvailable : fmt(item.required, locale),
        item.supplied === null ? L.noData : fmt(item.supplied, locale),
        item.diff === null ? '-' : `${item.diff > 0 ? '+' : ''}${fmt(item.diff, locale)}`,
        item.statusLabel,
      ])
    );
  }

  if (want('safety') && solution.safetyChecks?.length) {
    heading(L.safety);
    table(
      [L.check, L.value, L.limit, L.status],
      solution.safetyChecks.map((check) => [
        `${check.label} (${check.unit})`,
        check.value === null ? L.noData : fmt(check.value, locale),
        limitText(check, locale),
        check.value === null ? L.noData : check.ok === null ? L.noLimit : check.ok ? (check.incomplete ? L.incomplete : L.within) : L.outside,
      ])
    );
  }

  if (want('warnings') && solution.warnings?.length) {
    heading(L.warnings);
    table([L.severity, L.message], solution.warnings.map((w) => [w.severityLabel, w.message]), { columnStyles: { 0: { cellWidth: 26 } } });
  }

  if (want('insights') && solution.costInsights && (solution.costInsights.limiting.length || solution.costInsights.unusedFoods.length)) {
    heading(L.insights);
    for (const item of [...solution.costInsights.limiting, ...solution.costInsights.unusedFoods]) paragraph(`- ${item.message}`, 9);
    y += 2;
  }

  if (want('requirements') && calculation.requirements) {
    for (const group of calculation.requirements.groups) {
      heading(`${L.requirements} · ${group.label}`);
      table(
        [L.parameter, L.required, L.unit],
        group.items.map((item) => [item.label, fmt(item.value, locale, item.decimals), item.unit])
      );
    }
  }

  if (want('feedingSheet') && solution.feeding) feedingSheet(doc, autoTable, solution, options);

  return finish(doc, L, options, calculation);
}

/**
 * Ficha de trato para levar ao curral: uma página, letras grandes, um bloco por trato
 * com caixa para marcar e espaço para data e responsável.
 */
function feedingSheet(doc, autoTable, solution, options) {
  const { labels: L, locale } = options;
  const { feeding } = solution;
  doc.addPage();
  let y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(L.sheetTitle, MARGIN, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const subtitle = [options.farm, options.lot, L.feedingHint(feeding.animals, feeding.feedingsPerDay)].filter(Boolean).join(' · ');
  doc.text(doc.splitTextToSize(subtitle, doc.internal.pageSize.getWidth() - MARGIN * 2), MARGIN, y);
  y += 10;

  const rows = feeding.perFeeding.map((item) => [
    item.name,
    item.kgAsFed == null ? `${formatMass(item.kgDryMatter, locale)} MS` : formatMass(item.kgAsFed, locale),
    ...Array.from({ length: feeding.feedingsPerDay }, () => ''),
  ]);
  autoTable(doc, {
    startY: y,
    head: [[L.ingredient, L.perFeeding, ...Array.from({ length: feeding.feedingsPerDay }, (_, i) => `${L.feedingN} ${i + 1}`)]],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { font: 'helvetica', fontSize: 13, cellPadding: 3.5, textColor: INK, lineColor: [200, 200, 200], lineWidth: 0.2, minCellHeight: 12 },
    headStyles: { fillColor: INK, textColor: 255, fontSize: 11 },
    columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } },
    theme: 'grid',
  });
  y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${L.total}: ${fmt(feeding.kgAsFedPerDay, locale, 1)} kg MN/d · ${fmt(feeding.kgDryMatterPerDay, locale, 1)} kg MS/d`, MARGIN, y);
  y += 12;
  doc.setTextColor(...INK);
  doc.setFontSize(11);
  doc.text(`${L.date}: ____/____/________     ${L.responsible}: ______________________________`, MARGIN, y);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize(L.sheetHint, doc.internal.pageSize.getWidth() - MARGIN * 2), MARGIN, y);
}

function finish(doc, L, options, calculation) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const height = doc.internal.pageSize.getHeight();
    doc.text(doc.splitTextToSize(L.disclaimer, doc.internal.pageSize.getWidth() - MARGIN * 2 - 20), MARGIN, height - 10);
    doc.text(`${page}/${pages}`, doc.internal.pageSize.getWidth() - MARGIN, height - 10, { align: 'right' });
  }
  const slug = (options.title || L.defaultTitle).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return { blob: doc.output('blob'), filename: `${slug || 'brco'}-${calculation.calculationId.slice(0, 8)}.pdf` };
}

/**
 * Massa em kg para exibir: abaixo de 1 kg mostra em gramas (ureia, calcário e sal no
 * trato ficam em poucos gramas e apareceriam como "0,00 kg").
 * @param {number|null} kg
 * @param {string} locale
 */
export function formatMass(kg, locale) {
  if (kg === null || kg === undefined) return '-';
  const value = Number(kg);
  if (Math.abs(value) >= 1) {
    return `${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
  }
  const grams = value * 1000;
  const decimals = Math.abs(grams) < 10 ? 1 : 0;
  return `${grams.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} g`;
}

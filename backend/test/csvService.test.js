require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { generateCsv, toCsv, escapeCsvValue } = require('../domain/csvService');

test('escapeCsvValue: escapa vírgulas, aspas e quebras de linha', () => {
  assert.equal(escapeCsvValue('simples'), 'simples');
  assert.equal(escapeCsvValue('a,b'), '"a,b"');
  assert.equal(escapeCsvValue('diz "oi"'), '"diz ""oi"""');
  assert.equal(escapeCsvValue('linha\nnova'), '"linha\nnova"');
  assert.equal(escapeCsvValue(null), '');
  assert.equal(escapeCsvValue(12.5), '12.5');
  assert.equal(escapeCsvValue(-3), '-3');
});

test('escapeCsvValue: neutraliza injeção de fórmulas no Excel', () => {
  assert.equal(escapeCsvValue('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(escapeCsvValue('+1'), "'+1");
});

test('toCsv: gera cabeçalho, linhas e BOM UTF-8', () => {
  assert.equal(toCsv([{ a: 1, b: 'x' }, { a: 2, b: 'y' }]), '﻿a,b\n1,x\n2,y');
  assert.equal(toCsv([]), '');
});

test('generateCsv: inclui parâmetros, valores, unidade e inputs', () => {
  const csv = generateCsv({
    type: 'Exigências',
    inputs: { pesoInicial: 20 },
    results: { 'Consumo de matéria seca': { tipo: 'g/d', valor_requerido: 900.5, valor_maximo: 990.55 } },
  });
  const [header, row] = csv.replace('﻿', '').split('\n');
  assert.ok(header.startsWith('Parâmetro,Valor Requerido,Valor Máximo,Unidade,Tipo de Calculo'));
  assert.ok(header.endsWith('Input: pesoInicial'));
  assert.ok(row.startsWith('Consumo de matéria seca,900.5,990.55,g/d,Exigências'));
  assert.ok(row.endsWith(',20'));
});

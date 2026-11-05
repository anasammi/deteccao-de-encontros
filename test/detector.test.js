const test = require('node:test');
const assert = require('node:assert/strict');
const { haversineDistanceMeters } = require('../src/haversine');
const { detectEncounters, classifyEncounter } = require('../src/detector');
const { parseDataset } = require('../src/parser');

function person(id, latitude, longitude, extra = {}) {
  return {
    idMonitorado: id,
    faccaoMonitorado: null,
    timestamp: '2024-01-01 00:00:00',
    latitude,
    longitude,
    medidaProtetiva: false,
    idsRestricaoMedida: [],
    ...extra,
  };
}

test('Haversine retorna zero para coordenadas iguais', () => {
  assert.equal(haversineDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }), 0);
});

test('classifica vínculo de medida protetiva', () => {
  const victim = person(1, 0, 0, { medidaProtetiva: true, idsRestricaoMedida: [2] });
  const aggressor = person(2, 0, 0);
  assert.equal(classifyEncounter(victim, aggressor), 'protetiva');
});

test('classifica mesma facção quando não há vínculo protetivo', () => {
  assert.equal(classifyEncounter(person(1, 0, 0, { faccaoMonitorado: 7 }), person(2, 0, 0, { faccaoMonitorado: 7 })), 'faccao');
});

test('não compara timestamps diferentes e não inclui distância igual ou maior que 20m', () => {
  const first = person(1, 0, 0);
  const otherTimestamp = person(2, 0, 0, { timestamp: '2024-01-01 00:00:05' });
  const farAway = person(3, 0, 0.00018);
  const encounters = detectEncounters([first, otherTimestamp, farAway]);
  assert.deepEqual(encounters, []);
});

test('parser aceita campos vazios e restrições entre aspas', () => {
  const input = [
    'idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida',
    '1;;"2024-01-01 00:00:00";-10.5;-40.2;true;"2,3"',
  ].join('\n');
  const [record] = parseDataset(input);
  assert.equal(record.faccaoMonitorado, null);
  assert.deepEqual(record.idsRestricaoMedida, [2, 3]);
});

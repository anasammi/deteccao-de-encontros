
const { haversineDistanceMeters } = require('./haversine');

const MAX_DISTANCE_METERS = 20;
const EARTH_RADIUS_METERS = 6_371_000;
const CELL_SIZE_METERS = MAX_DISTANCE_METERS;

function isProtectiveEncounter(personA, personB) {
  return (
    (personA.medidaProtetiva &&
      personA.idsRestricaoMedida.includes(personB.idMonitorado)) ||
    (personB.medidaProtetiva &&
      personB.idsRestricaoMedida.includes(personA.idMonitorado))
  );
}

function classifyEncounter(personA, personB) {
  if (isProtectiveEncounter(personA, personB)) {
    return 'protetiva';
  }

  if (
    personA.faccaoMonitorado !== null &&
    personB.faccaoMonitorado !== null &&
    personA.faccaoMonitorado === personB.faccaoMonitorado
  ) {
    return 'faccao';
  }

  return 'generico';
}

function toCartesian(record) {
  const lat = (record.latitude * Math.PI) / 180;
  const lon = (record.longitude * Math.PI) / 180;
  const cosLat = Math.cos(lat);

  return {
    x: EARTH_RADIUS_METERS * cosLat * Math.cos(lon),
    y: EARTH_RADIUS_METERS * cosLat * Math.sin(lon),
    z: EARTH_RADIUS_METERS * Math.sin(lat),
  };
}

function cellCoordinate(value) {
  return Math.floor(value / CELL_SIZE_METERS);
}

function cellKey(x, y, z) {
  return `${x},${y},${z}`;
}

function detectGroupEncounters(timestamp, people, encounters) {
  const grid = new Map();

  for (const person of people) {
    const point = toCartesian(person);

    const cellX = cellCoordinate(point.x);
    const cellY = cellCoordinate(point.y);
    const cellZ = cellCoordinate(point.z);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const candidates = grid.get(
            cellKey(cellX + dx, cellY + dy, cellZ + dz)
          );

          if (!candidates) continue;

          for (const other of candidates) {
            const distance = haversineDistanceMeters(
              person,
              other.person
            );

            if (distance < MAX_DISTANCE_METERS) {
              const first =
                person.idMonitorado < other.person.idMonitorado
                  ? person
                  : other.person;

              const second = first === person ? other.person : person;

              encounters.push({
                tipo: classifyEncounter(person, other.person),
                monitoradosEncontro: [
                  first.idMonitorado,
                  second.idMonitorado,
                ],
                timestamp,
                posicoes: {
                  [first.idMonitorado]: {
                    lat: first.latitude,
                    lon: first.longitude,
                  },
                  [second.idMonitorado]: {
                    lat: second.latitude,
                    lon: second.longitude,
                  },
                },
                distanciaMetros: distance,
              });
            }
          }
        }
      }
    }

    const key = cellKey(cellX, cellY, cellZ);

    if (!grid.has(key)) {
      grid.set(key, []);
    }

    grid.get(key).push({ person });
  }
}

function detectEncounters(records) {
  const recordsByTimestamp = new Map();

  for (const record of records) {
    let group = recordsByTimestamp.get(record.timestamp);

    if (!group) {
      group = [];
      recordsByTimestamp.set(record.timestamp, group);
    }

    group.push(record);
  }

  const encounters = [];

  for (const [timestamp, people] of recordsByTimestamp) {
    detectGroupEncounters(timestamp, people, encounters);
  }

  encounters.sort(
    (a, b) =>
      a.timestamp.localeCompare(b.timestamp) ||
      a.monitoradosEncontro[0] - b.monitoradosEncontro[0] ||
      a.monitoradosEncontro[1] - b.monitoradosEncontro[1]
  );

  return encounters;
}


function detectEncountersByGroup(timestamp, people) {
  const encounters = [];
  detectGroupEncounters(timestamp, people, encounters);
  return encounters;
}

module.exports = { detectEncounters, classifyEncounter, detectEncountersByGroup };

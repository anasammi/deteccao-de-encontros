
const fs = require('fs');
const readline = require('readline');
const { parseLine } = require('./parser');
const { detectEncountersByGroup } = require('./detector');

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error(
      'Uso: node src/index.js <arquivo-entrada> <arquivo-saida>'
    );
    process.exit(1);
  }

  const input = fs.createReadStream(inputPath, {
    encoding: 'utf8',
  });

  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });

  const output = fs.createWriteStream(outputPath);
  const encounters = [];

  let currentTimestamp = null;
  let currentGroup = [];

  for await (const line of rl) {
    if (line.startsWith('idMonitorado;')) continue;

    const record = parseLine(line);
    if (!record) continue;

    if (currentTimestamp !== null &&
        record.timestamp !== currentTimestamp) {
      encounters.push(
        ...detectEncountersByGroup(currentTimestamp, currentGroup)
      );

      currentGroup = [];
    }

    currentTimestamp = record.timestamp;
    currentGroup.push(record);
  }

  if (currentGroup.length > 0) {
    encounters.push(
      ...detectEncountersByGroup(currentTimestamp, currentGroup)
    );
  }

  encounters.sort(
    (a, b) =>
      a.timestamp.localeCompare(b.timestamp) ||
      a.monitoradosEncontro[0] - b.monitoradosEncontro[0] ||
      a.monitoradosEncontro[1] - b.monitoradosEncontro[1]
  );

  output.write(JSON.stringify(encounters) + '\n');
  output.end();

  console.log(`Processamento concluído: ${encounters.length} encontros.`);
}

main().catch(error => {
  console.error('Erro:', error.message);
  process.exit(1);
});


function parseLine(line) {
  if (!line.trim()) return null;

  const fields = [];
  let current = '';
  let insideQuotes = false;

  for (const char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ';' && !insideQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());

  if (fields.length < 7) return null;

  return {
    idMonitorado: Number(fields[0]),
    faccaoMonitorado: fields[1] || null,
    timestamp: fields[2],
    latitude: Number(fields[3]),
    longitude: Number(fields[4]),
    medidaProtetiva: fields[5].toLowerCase() === 'true',
    idsRestricaoMedida: fields[6]
      ? fields[6].split(',').map(id => Number(id.trim()))
      : [],
  };
}

function parseDataset(content) {
  const lines = content.split(/\r?\n/);

  return lines
    .filter(line => line.trim() && !line.startsWith('idMonitorado;'))
    .map(parseLine)
    .filter(record => record !== null);
}

module.exports = {
  parseLine,
  parseDataset,
};

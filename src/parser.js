const fs = require('fs');
const { Readable } = require('stream');
const csv = require('csv-parser');

function createStream(input) {
  if (typeof input === 'string' && fs.existsSync(input)) {
    // If it's a file path
    return fs.createReadStream(input);
  } else if (typeof input === 'string') {
    // Treat as raw CSV string
    return Readable.from([input]);
  } else {
    throw new Error('parseCSV requires a file path or CSV string');
  }
}
/**
 * Parse a CSV file with streaming and normalize rows.
 *
 * @param {string} filePath
 *
 * @returns {Promise<{ rows: Array }>}
 */
async function parseCSV(filePath) {
  const rows = [];

  return new Promise((resolve, reject) => {
    if (!filePath) return reject(new Error('filePath is required'));

    createStream(filePath)
      .pipe(csv())
      .on('data', (raw) => {
        const rawId = raw['providerTransactionId'] || raw['transactionId'];
        const rawAmount = raw['amount'];
        const rawCurrency = raw['currency'];
        const rawStatus = raw['status'];

        const normalized = {
          id: rawId,
          amount: rawAmount,
          currency: rawCurrency,
          status: rawStatus,
          // keep the raw object if needed
          _raw: raw,
        };

        rows.push(normalized);
      })
      .on('end', () => {
        resolve({ rows });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

module.exports = {
  parseCSV,
};

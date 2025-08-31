const { parseCSV } = require('./parser');
const { reconcile } = require('./reconciler');

async function main() {
  const [, , sourcePath, systemPath] = process.argv;

  let sourceResult;
  let systemResult;
  try {
    [sourceResult, systemResult] = await Promise.all([
      parseCSV(sourcePath),
      parseCSV(systemPath),
    ]);
  } catch (err) {
    // parse or IO error
    console.error(
      'Error reading/parsing CSVs:',
      err && err.message ? err.message : err
    );
    process.exit(1);
    return;
  }

  const sourceRows = Array.isArray(sourceResult.rows) ? sourceResult.rows : [];
  const systemRows = Array.isArray(systemResult.rows) ? systemResult.rows : [];

  // If both CSVs have no valid rows, exit with code 2
  if (sourceRows.length === 0 && systemRows.length === 0) {
    console.error('Both CSVs contain no valid rows.');
    process.exit(2);
    return;
  }

  // reconcile - parser normalizes rows to { id, amount, currency, status } so use those keys
  const report = reconcile(sourceRows, systemRows);

  const output = {
    missing_in_internal: report.missing_in_internal,
    missing_in_source: report.missing_in_source,
    mismatched_transactions: report.mismatched_transactions,
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

if (require.main === module) {
  main();
}

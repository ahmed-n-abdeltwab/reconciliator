/**
 * Reconcile two arrays of normalized transaction rows.
 *
 * Each row is expected to contain: id, amount, currency, status
 *
 * @param {Array<Object>} sourceRows
 * @param {Array<Object>} systemRows
 * @returns {{
 *   missing_in_internal: Array<Object>,
 *   missing_in_source: Array<Object>,
 *   mismatched_transactions: Array<Object>
 * }}
 */
function reconcile(sourceRows, systemRows) {
  function buildMap(rows) {
    const map = new Map();
    if (!Array.isArray(rows)) return map;
    for (const r of rows) {
      const id = r.id;
      if (!id) continue; // skip rows with empty id
      if (!map.has(id)) {
        map.set(id, r); // first occurrence wins
      }
    }
    return map;
  }

  const srcMap = buildMap(sourceRows);
  const sysMap = buildMap(systemRows);

  const missing_in_internal = [];
  const missing_in_source = [];
  const mismatched_transactions = [];

  // Missing in internal: in source but not in system
  for (const [id, srcRow] of srcMap.entries()) {
    if (!sysMap.has(id)) {
      missing_in_internal.push({
        id,
        amount: srcRow.amount,
        currency: srcRow.currency,
        status: srcRow.status,
      });
    }
  }

  // Missing in source: in system but not in source
  for (const [id, sysRow] of sysMap.entries()) {
    if (!srcMap.has(id)) {
      missing_in_source.push({
        id,
        amount: sysRow.amount,
        currency: sysRow.currency,
        status: sysRow.status,
      });
    }
  }

  // Mismatches: same ID but different amount or status
  for (const [id, srcRow] of srcMap.entries()) {
    if (!sysMap.has(id)) continue;
    const sysRow = sysMap.get(id);

    const discrepancies = {};

    // Check amount
    if (srcRow.amount !== sysRow.amount) {
      discrepancies.amount = {
        source: srcRow.amount,
        system: sysRow.amount,
      };
    }

    // Check status
    if ((srcRow.status || '') !== (sysRow.status || '')) {
      discrepancies.status = {
        source: srcRow.status,
        system: sysRow.status,
      };
    }

    if (Object.keys(discrepancies).length > 0) {
      mismatched_transactions.push({
        transactionId: id,
        discrepancies,
      });
    }
  }

  return {
    missing_in_internal,
    missing_in_source,
    mismatched_transactions,
  };
}

module.exports = { reconcile };

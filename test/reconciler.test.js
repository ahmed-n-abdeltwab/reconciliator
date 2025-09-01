const { parseCSV } = require('../src/parser');
const { reconcile } = require('../src/reconciler');

describe('reconcile', () => {
  test('should detect transactions missing in the source', async () => {
    const sourceData = `
providerTransactionId,amount,currency,status
tx1,678.34,USD,Paid
    `.trim();
    const systemData = `
providerTransactionId,amount,currency,status
tx1,678.34,USD,Paid
tx2,100,USD,completed
    `.trim();

    const [srcRes, sysRes] = await Promise.all([
      parseCSV(sourceData),
      parseCSV(systemData),
    ]);

    const report = reconcile(srcRes.rows, sysRes.rows);
    expect(report).toBeDefined();
    expect(report.missing_in_source).toEqual([
      {
        id: 'tx2',
        amount: 100,
        currency: 'USD',
        status: 'completed',
      },
    ]);
  });

  test('should detect transactions missing in the internal system', async () => {
    const sourceData = `
providerTransactionId,amount,currency,status
tx1,678.34,USD,Paid
tx2,100,USD,completed
    `.trim();
    const systemData = `
providerTransactionId,amount,currency,status
tx1,678.34,USD,Paid
    `.trim();

    const [srcRes, sysRes] = await Promise.all([
      parseCSV(sourceData),
      parseCSV(systemData),
    ]);

    const report = reconcile(srcRes.rows, sysRes.rows);
    expect(report).toBeDefined();
    expect(report.missing_in_internal).toEqual([
      {
        id: 'tx2',
        amount: 100,
        currency: 'USD',
        status: 'completed',
      },
    ]);
  });

  test('should detect mismatched amounts and statuses for transactions with the same ID', async () => {
    const sourceData = `
providerTransactionId,amount,currency,status
tx1,100,USD,completed
    `.trim();
    const systemData = `
providerTransactionId,amount,currency,status
tx1,678.34,USD,Paid
    `.trim();

    const [srcRes, sysRes] = await Promise.all([
      parseCSV(sourceData),
      parseCSV(systemData),
    ]);

    const report = reconcile(srcRes.rows, sysRes.rows);
    expect(report).toBeDefined();
    expect(report.mismatched_transactions).toEqual([
      {
        transactionId: 'tx1',
        discrepancies: {
          amount: {
            source: 100,
            system: 678.34,
          },
          status: {
            source: 'completed',
            system: 'Paid',
          },
        },
      },
    ]);
  });
});

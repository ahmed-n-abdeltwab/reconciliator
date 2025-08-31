const path = require('path');
const { parseCSV } = require('../src/parser');

describe('parseCSV', () => {
  test('throws an error if no filePath or CSV string is provided', async () => {
    await expect(parseCSV()).rejects.toThrow('filePath is required');
  });

  test('parses CSV file and preserves raw transaction fields', async () => {
    const fixturesDir = path.resolve(__dirname, 'fixtures');
    const file = path.join(fixturesDir, 'parser_test_transactions.csv');
    const res = await parseCSV(file);
    const tx1 = res.rows.find((r) => r.id === 'tx1');
    expect(tx1).toBeDefined();
    expect(tx1._raw).toEqual({
      providerTransactionId: 'tx1',
      email: 'test@test.com',
      userId: 'testUserId',
      provider: 'testProvider',
      amount: '50',
      currency: 'USD',
      status: 'disputed',
    });
  });

  test('uses providerTransactionId as id and preserves raw fields for source CSV', async () => {
    const csvData = `
providerTransactionId,amount,currency,status
tx2,678.34,USD,Paid 
    `.trim();

    const res = await parseCSV(csvData);

    const tx2 = res.rows.find((r) => r.id === 'tx2');
    expect(tx2).toBeDefined();
    expect(tx2._raw).toEqual({
      providerTransactionId: 'tx2',
      amount: '678.34',
      currency: 'USD',
      status: 'Paid',
    });
  });

  test('uses transactionId as id and preserves raw fields for system CSV', async () => {
    const csvData = `
transactionId,amount,currency,status
tx3,100,USD,completed
    `.trim();

    const res = await parseCSV(csvData);

    const tx3 = res.rows.find((r) => r.id === 'tx3');
    expect(tx3).toBeDefined();
    expect(tx3._raw).toEqual({
      transactionId: 'tx3',
      amount: '100',
      currency: 'USD',
      status: 'completed',
    });
  });
});

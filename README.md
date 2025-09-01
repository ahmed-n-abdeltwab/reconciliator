# Reconciliator

Node.js service to reconcile two CSVs (source vs system) and produce a JSON report containing missing records, mismatches by amount/status.

## Features

- Streaming CSV parsing
- Normalization: convert amounts from string to number
- Reconciliation: identify missing records, amount/status discrepancies

## Quick Start

Install dependencies

```bash
npm install
```

## Testing

Run unit tests:

```bash
npm test
```

## Usage

Basic:

```bash
npm run start
```

With custom column mappings:

```bash
node ./src/index.js --source source_transactions.csv --system system_transactions.csv
```

## Output schema

JSON printed to stdout (pretty, 2-space indent):

```json
{
  "missing_in_internal": [
    { "id": "<id>", "amount": <num>, "currency": "<cur>", "status": "<status>" }
  ],
  "missing_in_source": [
    { "id": "<id>", "amount": <num>, "currency": "<cur>", "status": "<status>" }
  ],
  "mismatched_transactions": [
    {
      "transactionId": "<id>",
      "discrepancies": {
        "amount": { "source": <num>, "system": <num> },    // omitted if equal
        "status": { "source": "<str>", "system": "<str>" },// omitted if equal
      }
    }
  ]
}
```

## Sample output

```json
{
  "missing_in_internal": [
    {
      "id": "tx_only_source",
      "amount": 50.0,
      "currency": "USD",
      "status": "paid"
    }
  ],
  "missing_in_source": [
    {
      "id": "tx_only_system",
      "amount": 200.0,
      "currency": "USD",
      "status": "paid"
    }
  ],
  "mismatched_transactions": [
    {
      "transactionId": "tx_mismatch",
      "discrepancies": {
        "amount": { "source": 5.0, "system": 5.01 },
        "status": { "source": "open", "system": "closed" }
      }
    }
  ]
}
```

## Design notes

- Streaming parse (fs.createReadStream + csv-parser) prevents OOM on large files and lets the parser work row-by-row.
- Map lookups by ID provide O(1) comparisons and matching.

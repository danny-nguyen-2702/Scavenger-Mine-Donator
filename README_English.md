# Scavenger Mine Donation Tool

A comprehensive tool for automating NIGHT token donations from multiple wallet addresses to designated recipient addresses using the Scavenger Mine API.

## Features

- ✅ **CSV Input**: Load seed phrases and recipient addresses from a CSV file
- ✅ **Flexible Account Selection**: Specify individual accounts or ranges (e.g., "0-49" or "0, 5, 10-15")
- ✅ **Self-Donation Support**: Undo previous donations by leaving recipient address empty
- ✅ **Batch Processing**: Process multiple seed phrases with multiple accounts each
- ✅ **API Integration**: Automatically submit donations to Scavenger Mine API
- ✅ **Excel Reporting**: Generate detailed Excel reports with summary and transaction details
- ✅ **Timestamped Output**: Each report is saved with a unique timestamp
- ✅ **Error Handling**: Robust error handling with detailed error messages
- ✅ **Progress Tracking**: Real-time progress updates during processing
- ✅ **Rate Limiting Protection**: Built-in delays to avoid API rate limits

## Prerequisites

- Node.js version 16 or higher
- npm or yarn package manager
- Access to Scavenger Mine API (https://scavenger.prod.gd.midnighttge.io)

## Installation

1. Clone or download this repository

2. Install dependencies:

```bash
npm install
```

## Setup

1. Create a `donor_wallets.csv` file in the same directory with the following structure:

```csv
seed phrase,account indexes,recipient address
your seed phrase here,0-49,addr1qx2luazflus83phn9hcltqvgp27dr3rf78g9jmkac6s6ntmugwgkw3cxg7s7h7y9mmuxj563txpazcwl58wdpvfkm4aq62cl4z
another seed phrase,"0, 1, 5, 10-15, 20, 25-35",addr1qx2luazflus83phn9hcltqvgp27dr3rf78g9jmkac6s6ntmugwgkw3cxg7s7h7y9mmuxj563txpazcwl58wdpvfkm4aq62cl4z
seed phrase for undo,0-9,
```

**CSV File Format:**

- `seed phrase`: The mnemonic seed phrase (24 words)
- `account indexes`: Account indexes to process, supports two formats:
  - Individual indexes: `"0, 3, 6, 7, 12"` (comma-separated)
  - Ranges: `"0-49"` (processes accounts 0 through 49)
  - Mixed: `"0, 5, 10-15, 20, 25-35"` (combines individual and ranges)
- `recipient address`: The Cardano address that will receive the consolidated NIGHT tokens
  - Leave empty to undo previous donation (self-donation)
  - Can also use the word "self" to indicate self-donation

## Account Indexes Format

The tool now supports flexible account index specification:

### Individual Indexes

```csv
seed phrase,account indexes,recipient address
your seed,0,addr1...
your seed,"0, 5, 10",addr1...
```

### Range Format

```csv
seed phrase,account indexes,recipient address
your seed,0-49,addr1...
your seed,100-199,addr1...
```

### Mixed Format

```csv
seed phrase,account indexes,recipient address
your seed,"0-9, 15, 20-29, 50",addr1...
```

### Self-Donation (Undo)

To undo a previous donation, leave the recipient address empty:

```csv
seed phrase,account indexes,recipient address
your seed,0-49,
```

## Usage

Run the donation tool:

```bash
npm start
```

or

```bash
node donator.js
```

## Output

The tool generates a timestamped Excel file (e.g., `donation_results_20240315_143022.xlsx`) with two sheets:

### Sheet 1: Summary

- Overview of each seed phrase processed
- Account indexes used
- Total accounts per seed
- Success/failure counts
- Success rate percentage
- Overall totals at the bottom

### Sheet 2: Details

- Detailed information for each donation attempt
- Includes donor address, recipient address, signatures
- Operation type (Donation or Undo)
- Full API responses
- Error messages for failed transactions
- Color-coded success/failure indicators
- Orange highlighting for undo operations

## How It Works

1. **CSV Parsing**: Reads the `donor_wallets.csv` file to get seed phrases and recipient addresses

2. **Account Index Parsing**: Processes the account indexes string to determine which accounts to use

   - Parses individual numbers and ranges
   - Removes duplicates and sorts the list

3. **Address Derivation**: For each seed phrase, derives wallet addresses based on the specified account indexes

4. **Message Signing**: Signs the donation message for each donor address:

   ```
   Assign accumulated Scavenger rights to: <recipient_address>
   ```

   For self-donations (undo), the recipient is the same as the donor address.

5. **API Submission**: Submits each donation to the Scavenger Mine API endpoint:

   ```
   POST /donate_to/<recipient>/<donor>/<signature>
   ```

6. **Result Tracking**: Records API responses and determines success/failure based on:

   - HTTP status code 200
   - Response body contains `status: "success"`

7. **Excel Report Generation**: Creates comprehensive Excel report with all results, saved with timestamp

## Success Criteria

A donation is considered successful when:

- API returns HTTP status code 200
- Response JSON contains `"status": "success"`

All other cases are marked as failed with the error message captured.

## Error Handling

The tool includes comprehensive error handling for:

- Invalid CSV format
- Invalid account index formats (e.g., "abc", "10-5")
- Address derivation failures
- Message signing errors
- API communication issues
- Network timeouts (30 second timeout per API call)

## Rate Limiting

The tool includes a 1-second delay between API calls to avoid rate limiting issues.

## Security Notes

⚠️ **Important Security Considerations:**

1. **Seed Phrase Security**: Keep your `donor_wallets.csv` file secure and never share it
2. **Truncated Display**: Seed phrases are truncated in logs and reports for security
3. **Local Processing**: All cryptographic operations are performed locally
4. **API Security**: Only signatures are sent to the API, not seed phrases

## Timestamped Output Files

Each run creates a uniquely named output file with the format:

```
donation_results_YYYYMMDD_HHMMSS.xlsx
```

Example: `donation_results_20240315_143022.xlsx`

This ensures you never accidentally overwrite previous results and can maintain a history of all donation operations.

## Troubleshooting

### Common Issues

1. **"CSV file not found"**

   - Ensure `donor_wallets.csv` exists in the same directory as the script

2. **"Invalid account index"**

   - Check that account indexes are valid numbers or ranges
   - Ranges must be in format "start-end" where start ≤ end
   - Individual indexes must be separated by commas

3. **"Invalid public key length"**

   - Check that the seed phrase is valid (24 words from BIP39 wordlist)

4. **API timeouts**

   - Check your internet connection
   - Verify the API endpoint is accessible
   - Consider increasing timeout in the code (default: 30 seconds)

5. **"Address is not registered"**

   - Ensure the donor addresses have been registered with Scavenger Mine first

6. **"Original address already has an active donation assignment"**
   - This address has already been assigned to donate to another address
   - To fix: Leave recipient address empty to undo the previous assignment first

## API Response Examples

### Successful Donation

```json
{
  "status": "success",
  "message": "Successfully assigned accumulated Scavenger rights from addr1... to addr1...",
  "donation_id": "123e4567-e89b-12d3-a456-426614174000",
  "solutions_consolidated": 5
}
```

### Successful Undo (Self-Donation)

```json
{
  "status": "success",
  "message": "Successfully undid donation assignment for addr1...",
  "solutions_consolidated": 0
}
```

### Failed Donation

```json
{
  "statusCode": 400,
  "message": "Original address is not registered",
  "error": "Bad Request"
}
```

## Examples

### Example 1: Simple Range

Process accounts 0-99 for a seed phrase:

```csv
seed phrase,account indexes,recipient address
your seed phrase here,0-99,addr1qx2luazflus83phn9hcltqvgp27dr3rf78g9jmkac6s6ntmugwgkw3cxg7s7h7y9mmuxj563txpazcwl58wdpvfkm4aq62cl4z
```

### Example 2: Specific Accounts

Process only specific accounts:

```csv
seed phrase,account indexes,recipient address
your seed phrase here,"0, 5, 10, 15, 20",addr1qx2luazflus83phn9hcltqvgp27dr3rf78g9jmkac6s6ntmugwgkw3cxg7s7h7y9mmuxj563txpazcwl58wdpvfkm4aq62cl4z
```

### Example 3: Mixed Format

Combine ranges and individual indexes:

```csv
seed phrase,account indexes,recipient address
your seed phrase here,"0-9, 15, 20-29, 50, 100-110",addr1qx2luazflus83phn9hcltqvgp27dr3rf78g9jmkac6s6ntmugwgkw3cxg7s7h7y9mmuxj563txpazcwl58wdpvfkm4aq62cl4z
```

### Example 4: Undo Previous Donations

Leave recipient empty to undo donations:

```csv
seed phrase,account indexes,recipient address
your seed phrase here,0-49,
```

### Example 5: Mixed Operations

Some donations and some undos:

```csv
seed phrase,account indexes,recipient address
seed one,0-49,addr1qx2luazflus83phn9hcltqvgp27dr3rf78g9jmkac6s6ntmugwgkw3cxg7s7h7y9mmuxj563txpazcwl58wdpvfkm4aq62cl4z
seed two,0-9,
seed three,"5, 10, 15",addr1qx2luazflus83phn9hcltqvgp27dr3rf78g9jmkac6s6ntmugwgkw3cxg7s7h7y9mmuxj563txpazcwl58wdpvfkm4aq62cl4z
```

## License

MIT

## Support

For issues or questions:

1. Check the error messages in the Excel report
2. Review the console output for detailed error information
3. Verify your CSV file format matches the examples
4. Ensure all donor addresses are registered with Scavenger Mine
5. For undo operations, ensure the address has an active donation to undo

import { Lucid } from 'lucid-cardano';
import { promises as fs } from 'fs';
import axios from 'axios';
import ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';

const M9_API_ENDPOINT = "https://scavenger.prod.gd.midnighttge.io";

// Helper to convert string to hex
function toHex(str) {
    return Buffer.from(str, 'utf8').toString('hex');
}

// Parse account indexes string to array of numbers
function parseAccountIndexes(indexString) {
    const indexes = [];
    const parts = indexString.split(',').map(s => s.trim());
    
    for (const part of parts) {
        if (part.includes('-')) {
            // Range format (e.g., "0-49")
            const [start, end] = part.split('-').map(n => parseInt(n.trim()));
            if (isNaN(start) || isNaN(end)) {
                throw new Error(`Invalid range format: ${part}`);
            }
            if (start > end) {
                throw new Error(`Invalid range: start (${start}) is greater than end (${end})`);
            }
            for (let i = start; i <= end; i++) {
                indexes.push(i);
            }
        } else {
            // Single number
            const num = parseInt(part);
            if (isNaN(num)) {
                throw new Error(`Invalid account index: ${part}`);
            }
            indexes.push(num);
        }
    }
    
    // Remove duplicates and sort
    return [...new Set(indexes)].sort((a, b) => a - b);
}

// Get timestamp string for filename
function getTimestampString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Parse CSV file
async function parseCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Derive address from seed phrase
async function deriveAddressFromMnemonic(seedPhrase, accountIndex) {
    try {
        const lucid = await Lucid.new(undefined, 'Mainnet');
        lucid.selectWalletFromSeed(seedPhrase, { accountIndex: accountIndex });
        
        const address = await lucid.wallet.address();
        
        // Extract public key by signing a test message
        const testPayload = toHex('test');
        const signedMessage = await lucid.wallet.signMessage(address, testPayload);
        const pubKeyHex = signedMessage.key.slice(-64);
        
        if (pubKeyHex.length !== 64) {
            throw new Error(`Invalid public key length: ${pubKeyHex.length}`);
        }
        
        return {
            accountIndex: accountIndex,
            walletAddress: address,
            publicKeyHex: pubKeyHex,
            success: true
        };
    } catch (error) {
        return {
            accountIndex: accountIndex,
            walletAddress: '',
            publicKeyHex: '',
            success: false,
            error: error.message
        };
    }
}

// Sign donation message
async function signMessage(seedPhrase, addressIndex, address, message) {
    try {
        const lucid = await Lucid.new(undefined, 'Mainnet');
        lucid.selectWalletFromSeed(seedPhrase, { accountIndex: addressIndex });
        
        const payload = toHex(message);
        const signedMessage = await lucid.wallet.signMessage(address, payload);
        
        return {
            signature: signedMessage.signature,
            success: true
        };
    } catch (error) {
        return {
            signature: '',
            success: false,
            error: error.message
        };
    }
}

// Call Scavenger Mine donate API
async function submitDonation(recipientAddress, donorAddress, signature) {
    try {
        const url = `${M9_API_ENDPOINT}/donate_to/${recipientAddress}/${donorAddress}/${signature}`;
        
        const response = await axios.post(url, {}, {
            timeout: 30000, // 30 seconds timeout
            validateStatus: function (status) {
                return true; // Accept all status codes to handle them manually
            }
        });
        
        return {
            status: response.status,
            data: response.data,
            success: response.status === 200 && response.data?.status === 'success'
        };
    } catch (error) {
        return {
            status: error.response?.status || 0,
            data: error.response?.data || { error: error.message },
            success: false
        };
    }
}

// Process donation for a single address
async function processSingleDonation(seedPhrase, accountIndex, recipientAddress = null) {
    const result = {
        seedPhrase: seedPhrase.substring(0, 20) + '...', // Truncate for security
        accountIndex: accountIndex,
        donorAddress: '',
        recipientAddress: '',
        donationMessage: '',
        donationSignature: '',
        apiResponse: {},
        success: false,
        error: '',
        isSelfDonation: false
    };
    
    try {
        // Step 1: Derive address
        console.log(`  Deriving address for account index ${accountIndex}...`);
        const addressInfo = await deriveAddressFromMnemonic(seedPhrase, accountIndex);
        
        if (!addressInfo.success) {
            result.error = `Failed to derive address: ${addressInfo.error}`;
            return result;
        }
        
        result.donorAddress = addressInfo.walletAddress;
        
        // If no recipient address provided, use donor address (self-donation to undo)
        const finalRecipientAddress = recipientAddress || addressInfo.walletAddress;
        result.recipientAddress = finalRecipientAddress;
        result.isSelfDonation = !recipientAddress;
        
        // Step 2: Sign donation message
        const actionType = result.isSelfDonation ? 'undo donation' : 'donation';
        console.log(`  Signing ${actionType} message for ${addressInfo.walletAddress.substring(0, 20)}...`);
        const donationMessage = `Assign accumulated Scavenger rights to: ${finalRecipientAddress}`;
        result.donationMessage = donationMessage;
        
        const signResult = await signMessage(
            seedPhrase,
            accountIndex,
            addressInfo.walletAddress,
            donationMessage
        );
        
        if (!signResult.success) {
            result.error = `Failed to sign message: ${signResult.error}`;
            return result;
        }
        
        result.donationSignature = signResult.signature;
        
        // Step 3: Submit to API
        console.log(`  Submitting ${actionType} to API...`);
        const apiResult = await submitDonation(
            finalRecipientAddress,
            addressInfo.walletAddress,
            signResult.signature
        );
        
        result.apiResponse = apiResult.data;
        result.success = apiResult.success;
        
        if (!apiResult.success) {
            result.error = apiResult.data?.message || apiResult.data?.error || 'API call failed';
        } else {
            if (result.isSelfDonation) {
                console.log(`  ✅ Successfully undid donation for ${addressInfo.walletAddress.substring(0, 20)}...`);
            } else {
                console.log(`  ✅ Successfully donated from ${addressInfo.walletAddress.substring(0, 20)}...`);
            }
        }
        
    } catch (error) {
        result.error = error.message;
    }
    
    return result;
}

// Process all donations for a seed phrase
async function processSeedPhrase(seedPhrase, accountIndexes, recipientAddress = null) {
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    console.log(`\nProcessing seed phrase with ${accountIndexes.length} accounts...`);
    console.log(`Account indexes: ${accountIndexes.join(', ')}`);
    
    if (recipientAddress) {
        console.log(`Recipient: ${recipientAddress}\n`);
    } else {
        console.log(`Recipient: Self (undo donation)\n`);
    }
    
    for (let i = 0; i < accountIndexes.length; i++) {
        const accountIndex = accountIndexes[i];
        console.log(`Processing account index ${accountIndex} (${i + 1}/${accountIndexes.length}):`);
        const result = await processSingleDonation(seedPhrase, accountIndex, recipientAddress);
        results.push(result);
        
        if (result.success) {
            successCount++;
        } else {
            failCount++;
            console.log(`  ❌ Failed: ${result.error}`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    return {
        seedPhrase: seedPhrase.substring(0, 20) + '...',
        accountIndexes: accountIndexes.join(', '),
        totalAccounts: accountIndexes.length,
        successCount: successCount,
        failCount: failCount,
        details: results
    };
}

// Create Excel report
async function createExcelReport(allResults, outputPath) {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    
    summarySheet.columns = [
        { header: 'Seed Phrase', key: 'seedPhrase', width: 25 },
        { header: 'Account Indexes', key: 'accountIndexes', width: 30 },
        { header: 'Total Accounts', key: 'totalAccounts', width: 15 },
        { header: 'Successful', key: 'successCount', width: 12 },
        { header: 'Failed', key: 'failCount', width: 12 },
        { header: 'Success Rate', key: 'successRate', width: 15 }
    ];
    
    // Add header formatting
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add summary data
    for (const result of allResults) {
        const successRate = result.totalAccounts > 0 
            ? ((result.successCount / result.totalAccounts) * 100).toFixed(2) + '%'
            : '0%';
        
        summarySheet.addRow({
            seedPhrase: result.seedPhrase,
            accountIndexes: result.accountIndexes,
            totalAccounts: result.totalAccounts,
            successCount: result.successCount,
            failCount: result.failCount,
            successRate: successRate
        });
    }
    
    // Add totals row
    const totalAccounts = allResults.reduce((sum, r) => sum + r.totalAccounts, 0);
    const totalSuccess = allResults.reduce((sum, r) => sum + r.successCount, 0);
    const totalFail = allResults.reduce((sum, r) => sum + r.failCount, 0);
    const overallSuccessRate = totalAccounts > 0 
        ? ((totalSuccess / totalAccounts) * 100).toFixed(2) + '%'
        : '0%';
    
    const totalsRow = summarySheet.addRow({
        seedPhrase: 'TOTAL',
        accountIndexes: '',
        totalAccounts: totalAccounts,
        successCount: totalSuccess,
        failCount: totalFail,
        successRate: overallSuccessRate
    });
    totalsRow.font = { bold: true };
    totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCC00' }
    };
    
    // Sheet 2: Details
    const detailsSheet = workbook.addWorksheet('Details');
    
    detailsSheet.columns = [
        { header: 'Seed Phrase', key: 'seedPhrase', width: 25 },
        { header: 'Account Index', key: 'accountIndex', width: 15 },
        { header: 'Donor Address', key: 'donorAddress', width: 65 },
        { header: 'Recipient Address', key: 'recipientAddress', width: 65 },
        { header: 'Type', key: 'type', width: 12 },
        { header: 'Donation Message', key: 'donationMessage', width: 80 },
        { header: 'Donation Signature', key: 'donationSignature', width: 100 },
        { header: 'Success', key: 'success', width: 10 },
        { header: 'API Response', key: 'apiResponse', width: 100 },
        { header: 'Error', key: 'error', width: 50 }
    ];
    
    // Add header formatting
    detailsSheet.getRow(1).font = { bold: true };
    detailsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add detail data
    for (const seedResult of allResults) {
        for (const detail of seedResult.details) {
            const row = detailsSheet.addRow({
                seedPhrase: detail.seedPhrase,
                accountIndex: detail.accountIndex,
                donorAddress: detail.donorAddress,
                recipientAddress: detail.recipientAddress,
                type: detail.isSelfDonation ? 'Undo' : 'Donation',
                donationMessage: detail.donationMessage,
                donationSignature: detail.donationSignature,
                success: detail.success ? 'Yes' : 'No',
                apiResponse: JSON.stringify(detail.apiResponse),
                error: detail.error
            });
            
            // Color code based on success
            if (detail.success) {
                row.getCell('success').fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF90EE90' } // Light green
                };
            } else {
                row.getCell('success').fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFF6B6B' } // Light red
                };
            }
            
            // Highlight undo operations
            if (detail.isSelfDonation) {
                row.getCell('type').fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFEB9C' } // Light orange
                };
            }
        }
    }
    
    // Enable filters
    summarySheet.autoFilter = {
        from: 'A1',
        to: `F${summarySheet.rowCount}`
    };
    
    detailsSheet.autoFilter = {
        from: 'A1',
        to: `J${detailsSheet.rowCount}`
    };
    
    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n📊 Excel report saved to: ${outputPath}`);
}

// Main function
async function main() {
    try {
        console.log('🚀 Scavenger Mine Donation Tool v2.0');
        console.log('=====================================\n');
        
        // Configuration
        const csvPath = './donor_wallets.csv'; // Update this path as needed
        const timestamp = getTimestampString();
        const outputPath = `./donation_results_${timestamp}.xlsx`;
        
        // Check if CSV file exists
        try {
            await fs.access(csvPath);
        } catch {
            console.error(`❌ CSV file not found: ${csvPath}`);
            console.error('Please ensure donor_wallets.csv is in the current directory.');
            process.exit(1);
        }
        
        // Parse CSV
        console.log(`📄 Reading CSV file: ${csvPath}`);
        const walletData = await parseCsvFile(csvPath);
        
        if (walletData.length === 0) {
            console.error('❌ No data found in CSV file');
            process.exit(1);
        }
        
        console.log(`✅ Found ${walletData.length} seed phrases to process\n`);
        
        // Process all seed phrases
        const allResults = [];
        
        for (let i = 0; i < walletData.length; i++) {
            const row = walletData[i];
            const seedPhrase = row['seed phrase'];
            const accountIndexesStr = row['account indexes'] || row['account indices'];
            const recipientAddress = row['recipient address'];
            
            if (!seedPhrase || !accountIndexesStr) {
                console.error(`❌ Invalid data in row ${i + 2}: missing seed phrase or account indexes`);
                continue;
            }
            
            // Parse account indexes
            let accountIndexes;
            try {
                accountIndexes = parseAccountIndexes(accountIndexesStr);
                if (accountIndexes.length === 0) {
                    console.error(`❌ No valid account indexes found in row ${i + 2}`);
                    continue;
                }
            } catch (error) {
                console.error(`❌ Error parsing account indexes in row ${i + 2}: ${error.message}`);
                continue;
            }
            
            console.log(`\n📍 Processing seed phrase ${i + 1}/${walletData.length}`);
            console.log('═'.repeat(50));
            
            // If recipient address is empty or same as "self", use null for self-donation
            const finalRecipientAddress = recipientAddress && recipientAddress.toLowerCase() !== 'self' 
                ? recipientAddress 
                : null;
            
            const result = await processSeedPhrase(seedPhrase, accountIndexes, finalRecipientAddress);
            allResults.push(result);
            
            console.log(`\n✅ Completed: ${result.successCount}/${result.totalAccounts} successful`);
        }
        
        // Create Excel report
        console.log('\n📊 Creating Excel report...');
        await createExcelReport(allResults, outputPath);
        
        // Print summary
        console.log('\n' + '═'.repeat(50));
        console.log('📈 FINAL SUMMARY');
        console.log('═'.repeat(50));
        
        const totalAccounts = allResults.reduce((sum, r) => sum + r.totalAccounts, 0);
        const totalSuccess = allResults.reduce((sum, r) => sum + r.successCount, 0);
        const totalFail = allResults.reduce((sum, r) => sum + r.failCount, 0);
        
        console.log(`Total seed phrases processed: ${allResults.length}`);
        console.log(`Total accounts processed: ${totalAccounts}`);
        console.log(`Total successful donations: ${totalSuccess}`);
        console.log(`Total failed donations: ${totalFail}`);
        console.log(`Overall success rate: ${totalAccounts > 0 ? ((totalSuccess / totalAccounts) * 100).toFixed(2) : 0}%`);
        console.log('\n✅ Process completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);
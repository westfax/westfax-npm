const fs = require('fs');
const path = require('path');
const WestFax = require('../index');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const faxNumber = process.env.FAX_NUMBER;
const username = process.env.WESTFAX_USERNAME;
const apiKey = process.env.WESTFAX_API_KEY;
const documentPath = path.join(__dirname, 'sample-document.pdf');

if ((!username && !apiKey) || !process.env.WESTFAX_PRODUCT_ID || !faxNumber) {
  console.error('Copy examples/.env.example to examples/.env and set credentials, WESTFAX_PRODUCT_ID, and FAX_NUMBER.');
  console.error('This example sends a real fax unless WESTFAX_API_URL points at the sandbox.');
  process.exit(1);
}

if (!fs.existsSync(documentPath)) {
  console.error(`Place the PDF to send at ${documentPath}`);
  process.exit(1);
}

const client = new WestFax({
  username,
  password: process.env.WESTFAX_PASSWORD,
  apiKey,
  productId: process.env.WESTFAX_PRODUCT_ID,
  baseUrl: process.env.WESTFAX_API_URL || undefined
});

async function sendFax(recipients, jobTitle) {
  const result = await client.sendFax({
    jobName: jobTitle,
    header: 'Sample Fax Header',
    billingCode: 'Customer-123',
    numbers: recipients,
    file: documentPath,
    csid: process.env.CSID || undefined,
    ani: process.env.ANI || undefined,
    faxQuality: 'Fine',
    feedbackEmail: process.env.FEEDBACK_EMAIL || undefined
  });

  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function runExamples() {
  console.log('Sending a fax to one recipient');
  await sendFax(faxNumber, 'Sample Single Fax Job');

  const moreNumbers = [process.env.FAX_NUMBER2, process.env.FAX_NUMBER3].filter(Boolean);
  if (moreNumbers.length === 0) {
    console.log('Set FAX_NUMBER2 to also send a multi-recipient fax.');
    return;
  }

  console.log('Sending a fax to multiple recipients');
  await sendFax([faxNumber, ...moreNumbers], 'Sample Multi-Recipient Fax Job');
}

runExamples().catch((error) => {
  console.error(error.response ? error.response.data : error.message);
  process.exitCode = 1;
});

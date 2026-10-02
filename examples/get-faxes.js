const fs = require('fs');
const path = require('path');
const WestFax = require('../index');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const username = process.env.WESTFAX_USERNAME;
const apiKey = process.env.WESTFAX_API_KEY;

if ((!username && !apiKey) || !process.env.WESTFAX_PRODUCT_ID) {
  console.error('Copy examples/.env.example to examples/.env and set credentials plus WESTFAX_PRODUCT_ID.');
  process.exit(1);
}

const client = new WestFax({
  username,
  password: process.env.WESTFAX_PASSWORD,
  apiKey,
  productId: process.env.WESTFAX_PRODUCT_ID,
  baseUrl: process.env.WESTFAX_API_URL || undefined
});

async function checkInboundFaxes() {
  const identifiers = await client.getFaxIdentifiers({
    faxDirection: 'Inbound',
    startDate: process.env.FAX_START_DATE || '1/1/2020'
  });

  if (!identifiers.Success) {
    console.log(JSON.stringify(identifiers, null, 2));
    return;
  }

  const fax = (identifiers.Result || [])[0];
  if (!fax) {
    console.log('No inbound faxes found.');
    return;
  }

  const faxId = { Id: fax.Id, Direction: 'Inbound' };
  const description = await client.getFaxDescriptionsUsingIds(faxId);
  console.log(JSON.stringify(description, null, 2));

  const documents = await client.getFaxDocuments(faxId, 'pdf');
  const fileContents = documents.Result
    && documents.Result[0]
    && documents.Result[0].FaxFiles
    && documents.Result[0].FaxFiles[0]
    && documents.Result[0].FaxFiles[0].FileContents;

  if (!fileContents) {
    console.log('No file contents were returned for this fax.');
    return;
  }

  const outputDir = path.join(__dirname, 'downloads');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `fax-${fax.Id}.pdf`);
  fs.writeFileSync(outputPath, Buffer.from(fileContents, 'base64'));
  console.log(`Saved ${outputPath}`);

  const marked = await client.changeFaxFilterValue(faxId, 'Retrieved');
  console.log(JSON.stringify(marked, null, 2));
}

checkInboundFaxes().catch((error) => {
  console.error(error.response ? error.response.data : error.message);
  process.exitCode = 1;
});

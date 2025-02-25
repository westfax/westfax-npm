// Example: Retrieve faxes
const WestFax = require('../index');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

// Initialize the WestFax client with your credentials
const client = new WestFax({
  username: process.env.WESTFAX_USERNAME,
  password: process.env.WESTFAX_PASSWORD,
  productId: process.env.WESTFAX_PRODUCT_ID,
  // Optional settings
  baseUrl: process.env.WESTFAX_API_URL || 'https://apisecure.westfax.com',
  responseEncoding: 'JSON'
});

// Function to check for inbound faxes
async function checkInboundFaxes() {
  try {
    console.log('Checking for inbound faxes...');
    
    // Get products with unread faxes
    const productsWithFaxes = await client.getProductsWithInboundFaxes('None');
    console.log('Products with unread faxes:', JSON.stringify(productsWithFaxes, null, 2));
    
    // If no products with faxes, exit
    if (!productsWithFaxes || !productsWithFaxes.length) {
      console.log('No unread faxes found.');
      return;
    }
    
    // Get fax descriptions for a product
    // For this example, we'll use the first product with unread faxes
    const productId = productsWithFaxes[0].ProductId;
    
    // Update the client's product ID to match
    client.productId = productId;
    
    // Get fax descriptions
    console.log(`Getting fax descriptions for product ${productId}...`);
    const faxDescriptions = await client.getFaxDescriptionsUsingIds({
      Id: productsWithFaxes[0].Id,
      Direction: 'Inbound'
    });
    console.log('Fax descriptions:', JSON.stringify(faxDescriptions, null, 2));
    
    // If no fax descriptions, exit
    if (!faxDescriptions || !faxDescriptions.length) {
      console.log('No fax descriptions found.');
      return;
    }
    
    // Get the fax document for the first fax
    const faxId = {
      Id: faxDescriptions[0].Id,
      Direction: 'Inbound'
    };
    
    console.log(`Retrieving fax document for ID ${faxId.Id}...`);
    const faxDocument = await client.getFaxDocuments(faxId, 'pdf');
    
    // Save the fax document
    if (faxDocument && faxDocument.FileData) {
      const outputDir = path.join(__dirname, 'downloads');
      
      // Create download directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, `fax-${faxId.Id}.pdf`);
      
      // The API returns base64-encoded file data
      const fileBuffer = Buffer.from(faxDocument.FileData, 'base64');
      fs.writeFileSync(outputPath, fileBuffer);
      
      console.log(`Fax document saved to ${outputPath}`);
      
      // Mark the fax as read
      console.log('Marking fax as read...');
      await client.changeFaxFilterValue(faxId, 'Retrieved');
      console.log('Fax marked as read successfully.');
    } else {
      console.log('No file data received for the fax.');
    }
    
    return faxDescriptions;
  } catch (error) {
    console.error('Error retrieving faxes:');
    if (error.response) {
      console.error('Response error:', error.response.data);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Execute the example
checkInboundFaxes()
  .then(() => console.log('Example completed successfully'))
  .catch(() => console.log('Example failed'))
  .finally(() => console.log('Done')); 
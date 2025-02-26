// Example: Send a fax
const WestFax = require('../index');
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

// Function to send a fax - works with both single and multiple recipients
async function sendFax(recipients, jobTitle) {
  try {
    // Path to the document you want to fax
    const filePath = path.join(__dirname, 'sample-document.pdf');
    
    // Send the fax
    const result = await client.sendFax({
      jobName: jobTitle,
      header: 'Sample Fax Header',
      billingCode: 'Customer-123',
      numbers: recipients, // Can be a single string or array of strings
      file: filePath,
      csid: process.env.CSID || '0000000000',
      ani: process.env.ANI || '0000000000',
      faxQuality: 'Fine',
      feedbackEmail: process.env.FEEDBACK_EMAIL
    });
    
    console.log('Fax sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error sending fax:');
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

// Execute the examples
async function runExamples() {
  console.log('=== EXAMPLE: SENDING FAX TO SINGLE RECIPIENT ===');
  try {
    // Single recipient - just pass a string
    await sendFax(
      process.env.FAX_NUMBER || '800-555-1212',
      'Sample Single Fax Job'
    );
    console.log('Single fax example completed successfully');
  } catch (err) {
    console.log('Single fax example failed');
  }
  
  console.log('\n=== EXAMPLE: SENDING FAX TO MULTIPLE RECIPIENTS ===');
  try {
    // Multiple recipients - pass an array of strings
    // Note: Maximum of 20 fax numbers allowed
    const faxNumbers = [
      process.env.FAX_NUMBER1 || '800-555-1212',
      process.env.FAX_NUMBER2 || '800-555-1213',
      process.env.FAX_NUMBER3 || '800-555-1214'
    ];
    
    await sendFax(
      faxNumbers,
      'Sample Multi-Recipient Fax Job'
    );
    console.log('Multiple fax example completed successfully');
  } catch (err) {
    console.log('Multiple fax example failed');
  }
}

runExamples().finally(() => console.log('All examples completed')); 
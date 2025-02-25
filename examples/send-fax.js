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

// Function to send a fax to a single recipient
async function sendSingleFax() {
  try {
    // Path to the document you want to fax
    const filePath = path.join(__dirname, 'sample-document.pdf');
    
    // Send the fax to a single recipient
    const result = await client.sendFax({
      jobName: 'Sample Single Fax Job',
      header: 'Sample Fax Header',
      billingCode: 'Customer-123',
      numbers: process.env.FAX_NUMBER || '800-555-1212', // Single destination fax number
      file: filePath,
      csid: process.env.CSID || '0000000000',
      ani: process.env.ANI || '0000000000',
      faxQuality: 'Fine',
      feedbackEmail: process.env.FEEDBACK_EMAIL
    });
    
    console.log('Single fax sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error sending single fax:');
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

// Function to send a fax to multiple recipients
async function sendMultipleFax() {
  try {
    // Path to the document you want to fax
    const filePath = path.join(__dirname, 'sample-document.pdf');
    
    // Get fax numbers from environment variables or use defaults
    // These will be converted to Numbers1, Numbers2, Numbers3, etc. in the API call
    const faxNumbers = [
      process.env.FAX_NUMBER1 || '800-555-1212',
      process.env.FAX_NUMBER2 || '800-555-1213',
      process.env.FAX_NUMBER3 || '800-555-1214'
    ];
    
    // Send the fax to multiple recipients
    // When passing an array of numbers, the client will automatically
    // format them as Numbers1, Numbers2, Numbers3, etc. as required by the API
    const result = await client.sendFax({
      jobName: 'Sample Multi-Recipient Fax Job',
      header: 'Sample Fax Header',
      billingCode: 'Customer-123',
      numbers: faxNumbers, // Array of destination fax numbers
      file: filePath,
      csid: process.env.CSID || '0000000000',
      ani: process.env.ANI || '0000000000',
      faxQuality: 'Fine',
      feedbackEmail: process.env.FEEDBACK_EMAIL
    });
    
    console.log('Multiple fax sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error sending multiple fax:');
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
    await sendSingleFax();
    console.log('Single fax example completed successfully');
  } catch (err) {
    console.log('Single fax example failed');
  }
  
  console.log('\n=== EXAMPLE: SENDING FAX TO MULTIPLE RECIPIENTS ===');
  try {
    await sendMultipleFax();
    console.log('Multiple fax example completed successfully');
  } catch (err) {
    console.log('Multiple fax example failed');
  }
}

runExamples().finally(() => console.log('All examples completed')); 
// Example: Get your ProductId programmatically
const WestFax = require('../index');
require('dotenv').config(); // Load environment variables from .env file

// Initialize the WestFax client with only username and password
const client = new WestFax({
  username: process.env.WESTFAX_USERNAME,
  password: process.env.WESTFAX_PASSWORD,
  // No productId needed for this initial call
  baseUrl: process.env.WESTFAX_API_URL || 'https://apisecure.westfax.com',
  responseEncoding: 'JSON'
});

/**
 * Get the ProductId using our helper method
 */
async function getProductIdHelper() {
  try {
    console.log('Getting ProductId using helper method...');
    const productId = await client.getProductId();
    
    if (productId) {
      console.log('Success! Your ProductId is:', productId);
      console.log('Use this ProductId when initializing the WestFax client for other API calls.');
    } else {
      console.error('No ProductId found. Make sure your credentials are correct and you have at least one product.');
    }
    
    return productId;
  } catch (error) {
    console.error('Error getting ProductId:', error.message);
    return null;
  }
}

/**
 * Get the ProductId directly using the getProductList method
 */
async function getProductIdFromProductList() {
  try {
    console.log('Getting ProductId from ProductList API...');
    const productList = await client.getProductList();
    
    if (productList.Success && productList.Result && productList.Result.length > 0) {
      const productId = productList.Result[0].Id;
      console.log('Success! Your ProductId is:', productId);
      
      // Show all available products
      console.log('\nAll available products:');
      productList.Result.forEach((product, index) => {
        console.log(`${index + 1}. ${product.Name} (ID: ${product.Id})`);
        console.log(`   Type: ${product.ProductType}`);
        if (product.InboundNumber) {
          console.log(`   Inbound Number: ${product.InboundNumber}`);
        }
        console.log('');
      });
      
      return productId;
    } else {
      console.error('No products found in ProductList API response.');
      return null;
    }
  } catch (error) {
    console.error('Error getting product list:', error.message);
    return null;
  }
}

/**
 * Get the ProductId from the F2E (Fax to Email) Product List API
 */
async function getProductIdFromF2EProductList() {
  try {
    console.log('Getting ProductId from F2E ProductList API...');
    const f2eProductList = await client.getF2EProductList();
    
    if (f2eProductList.Success && f2eProductList.Result && f2eProductList.Result.length > 0) {
      const productId = f2eProductList.Result[0].Id;
      console.log('Success! Your ProductId is:', productId);
      return productId;
    } else {
      console.error('No products found in F2E ProductList API response.');
      return null;
    }
  } catch (error) {
    console.error('Error getting F2E product list:', error.message);
    return null;
  }
}

// Execute the examples
async function runExamples() {
  console.log('=== EXAMPLE: GETTING PRODUCT ID USING HELPER METHOD ===');
  await getProductIdHelper();
  
  console.log('\n=== EXAMPLE: GETTING PRODUCT ID FROM PRODUCT LIST API ===');
  await getProductIdFromProductList();
  
  console.log('\n=== EXAMPLE: GETTING PRODUCT ID FROM F2E PRODUCT LIST API ===');
  await getProductIdFromF2EProductList();
}

runExamples().finally(() => console.log('All examples completed')); 
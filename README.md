# WestFax NPM

[![WestFax](https://westfax.com/img/WestFax_Logo.webp)](https://westfax.com)

A Node.js client library for interacting with the WestFax Secure Cloud Fax API. WestFax is a HIPAA Compliant Secure Cloud Fax company that specializes in high volume, high availability digital cloud fax with a primary focus on Healthcare and medical applications.

[![npm version](https://img.shields.io/npm/v/westfax.svg)](https://www.npmjs.com/package/westfax)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Send faxes to single or multiple recipients 
- Retrieve fax documents
- Manage fax filter values
- Get fax descriptions
- Check for inbound faxes
- Get product lists

## Installation

```bash
npm install westfax
```

## Important Notes

- **All API calls are production** - There is no "test" or "mock" API environment, so every API call you make will use real credentials and will send actual faxes.
- **You need a WestFax account** - To use this library, you must have a WestFax account with valid credentials.
- **ProductId is required** - Most API calls require a ProductId, which you can retrieve programmatically (see below).

## Getting Started

### Step 1: Get Your WestFax Credentials

Sign up for a WestFax account to receive your username and password.

### Step 2: Retrieve Your ProductId

Most WestFax API calls require a ProductId. Here's how to get it programmatically:

```javascript
const WestFax = require('westfax');

// Initialize client with just username and password
const client = new WestFax({
  username: 'your_username',
  password: 'your_password'
});

// Get product list and find your ProductId
async function getProductId() {
  try {
    const productList = await client.getF2EProductList();
    
    if (productList.Success && productList.Result.length > 0) {
      // The first product ID in the list
      const productId = productList.Result[0].Id;
      console.log(`Your ProductId is: ${productId}`);
      return productId;
    } else {
      console.error('No products found or API call failed');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving ProductId:', error.message);
    return null;
  }
}

// Call the function to get your ProductId
getProductId();
```

Alternatively, you can use cURL to get your ProductId:

```bash
curl --location --request POST 'https://apisecure.westfax.com/REST/Profile_GetProductList/json' \
  --form 'Username="your_username"' \
  --form 'Password="your_password"' \
  --form 'Cookies="false"'
```

The response will contain your ProductId in the `Id` field:

```json
{
  "Success": true,
  "Result": [
    {
      "Id": "00000000-1111-2222-3333-4444444444",  // This is your ProductId
      "Name": "FF-Acme Corp",
      "ProductType": "FaxForward",
      ...
    }
  ]
}
```

### Step 3: Initialize the Client with All Credentials

After obtaining your ProductId, initialize the client with all required credentials:

```javascript
const WestFax = require('westfax');

const client = new WestFax({
  username: 'your_username',
  password: 'your_password',
  productId: 'your_product_id',
  baseUrl: 'https://apisecure.westfax.com', // Optional, defaults to this URL
  responseEncoding: 'JSON' // Optional, defaults to 'JSON'
});
```

## Examples

The package includes several example scripts to help you get started:

- `examples/get-product-id.js` - Demonstrates how to retrieve your ProductId programmatically
- `examples/send-fax.js` - Shows how to send faxes to single and multiple recipients
- `examples/retrieve-fax.js` - Demonstrates how to retrieve and process fax documents

To run the examples:

1. Copy `examples/.env.example` to `examples/.env` and add your credentials
2. Run an example with `node examples/get-product-id.js`

## Usage

### Sending a Fax

```javascript
// Send a fax with a file path
const sendFaxResult = await client.sendFax({
  jobName: 'Test Fax',
  header: 'Test Header',
  billingCode: 'Customer Code 1234',
  numbers: '800-555-1212',
  file: '/path/to/document.pdf',
  csid: '0000000000',
  ani: '0000000000',
  faxQuality: 'Fine',
  feedbackEmail: 'your@email.com'
});

// Send to multiple recipients
// The library will automatically format these as Numbers1, Numbers2, Numbers3, etc.
// as required by the WestFax API
const multipleNumbersResult = await client.sendFax({
  jobName: 'Multiple Recipients',
  header: 'Important Document',
  numbers: ['800-555-1212', '800-555-1213', '800-555-1214'], // Multiple recipients
  file: '/path/to/document.pdf'
});

// Send with a file buffer
const fs = require('fs');
const fileBuffer = fs.readFileSync('/path/to/document.pdf');
const bufferResult = await client.sendFax({
  jobName: 'Buffer Example',
  header: 'From Buffer',
  numbers: '800-555-1212',
  file: fileBuffer,
  filename: 'document.pdf' // Optional filename when using buffer
});
```

### Retrieving Fax Documents

```javascript
// Retrieve a single fax document
const faxId = {
  Id: '12345678-1234-1234-1234-123456789abc',
  Direction: 'Inbound'
};

const singleDocResult = await client.getFaxDocuments(faxId, 'pdf');

// Retrieve multiple fax documents
const faxIds = [
  { Id: '12345678-1234-1234-1234-123456789abc', Direction: 'Inbound' },
  { Id: '87654321-4321-4321-4321-cba987654321', Direction: 'Outbound' }
];

const multipleDocsResult = await client.getFaxDocuments(faxIds, 'pdf');
```

### Changing Fax Filter Values

```javascript
// Mark a fax as read
const faxId = {
  Id: '12345678-1234-1234-1234-123456789abc',
  Direction: 'Inbound'
};

const markAsReadResult = await client.changeFaxFilterValue(faxId, 'Retrieved');

// Delete a fax
const deleteResult = await client.changeFaxFilterValue(faxId, 'Removed');

// Reset filter (mark as unread)
const resetResult = await client.changeFaxFilterValue(faxId, 'None');
```

### Getting Fax Descriptions

```javascript
const faxId = {
  Id: '12345678-1234-1234-1234-123456789abc',
  Direction: 'Inbound'
};

const faxDescription = await client.getFaxDescriptionsUsingIds(faxId);
```

### Getting Products with Inbound Faxes

```javascript
// Get products with unread faxes
const unreadFaxProducts = await client.getProductsWithInboundFaxes('None');

// Get products with read faxes
const readFaxProducts = await client.getProductsWithInboundFaxes('Retrieved');
```

### Getting Fax-to-Email Product List

```javascript
const productList = await client.getF2EProductList();
```

## Testing

The package includes comprehensive tests for all API methods. 

**Important Note**: There is no "mock" API for WestFax - all API calls go to the production environment. When running tests, real credentials are required, and actual API calls will be made.

### Running Tests with Your WestFax Credentials

To run tests with your WestFax credentials:

1. Create a `.env` file in the project root (or copy from `.env.example`)
2. Add your WestFax credentials:

```
WESTFAX_USERNAME=your_username
WESTFAX_PASSWORD=your_password
WESTFAX_PRODUCT_ID=your_product_id
```

3. Run the tests:

```bash
npm test
```

For integration tests that send real faxes, you can also set:

```
TEST_FAX_NUMBER=your_test_fax_number
TEST_FAX_FILE=path_to_test_file.pdf
```

### Test Safety

Since all API calls are to the production environment, be careful when running tests:

- All fax tests will send real faxes
- All tests will use your actual account
- Consider the cost implications of running tests that send faxes

If you prefer to avoid actually sending faxes during testing, you can modify the test cases to skip the actual sendFax tests.

## Getting Help

If you need assistance or have questions about the WestFax API, please contact WestFax support directly.

## API Reference

### Constructor

#### `new WestFax(config)`

Creates a new WestFax client instance.

- `config` (Object): Configuration options
  - `username` (String): WestFax API username
  - `password` (String): WestFax API password
  - `productId` (String): Default product ID to use for operations
  - `baseUrl` (String, optional): API base URL (default: 'https://apisecure.westfax.com')
  - `responseEncoding` (String, optional): Response format (default: 'JSON')
  - `cookies` (Boolean, optional): Whether to use cookies (default: false)

### Methods

#### `getProductId()`

Helper method to retrieve the first available ProductId for your account. This is useful when setting up the client for the first time.

Returns: Promise resolving to the ProductId string or null if none found

#### `getProductList()`

Gets a list of all products the user has access to.

Returns: Promise resolving to API response object with a Result array containing product information

#### `getF2EProductList()`

Gets a list of fax-to-email products the user has access to.

Returns: Promise resolving to API response object with a Result array containing product information

#### `sendFax(options)`

Sends a fax to one or more recipients.

- `options` (Object): Fax options
  - `jobName` (String, optional): Name of the fax job
  - `header` (String, optional): Header to display on the fax
  - `billingCode` (String, optional): Billing code
  - `numbers` (String|Array): Destination fax number(s)
    - Pass a single string for one recipient
    - Pass an array of strings for multiple recipients (will be formatted as Numbers1, Numbers2, etc.)
  - `file` (String|Buffer|Stream): File to fax (path, buffer, or stream)
  - `filename` (String, optional): Filename when using buffer or stream
  - `csid` (String, optional): CSID (Caller Service ID)
  - `ani` (String, optional): ANI (Automatic Number Identification)
  - `startDate` (String, optional): Start date for the fax
  - `faxQuality` (String, optional): Fax quality ('Fine' or 'Normal')
  - `feedbackEmail` (String, optional): Email for status notifications
  - `callbackUrl` (String, optional): Callback URL for status updates

Returns: Promise resolving to API response object

#### `getFaxDocuments(faxIds, format)`

Retrieves fax documents.

- `faxIds` (Object|Array): Fax identifier(s)
- `format` (String, optional): Document format (default: 'pdf')
  - Valid formats: 'pdf', 'tiff'

Returns: Promise resolving to API response object

#### `changeFaxFilterValue(faxIds, filter)`

Changes the filter value of faxes.

- `faxIds` (Object|Array): Fax identifier(s)
- `filter` (String): Filter value
  - 'None': Reset (mark as unread)
  - 'Retrieved': Mark as read
  - 'Removed': Delete

Returns: Promise resolving to API response object

#### `getFaxDescriptionsUsingIds(faxIds)`

Gets detailed descriptions of faxes.

- `faxIds` (Object|Array): Fax identifier(s)

Returns: Promise resolving to API response object

#### `getProductsWithInboundFaxes(filter)`

Gets products with inbound faxes matching a filter.

- `filter` (String, optional): Filter to apply (default: 'None')
  - 'None': Unread faxes
  - 'Retrieved': Read faxes
  - 'Removed': Deleted faxes

Returns: Promise resolving to API response object

## License

MIT 

declare module 'westfax' {
  export interface WestFaxConfig {
    baseUrl?: string;
    responseEncoding?: string;
    username?: string;
    password?: string;
    productId?: string;
    cookies?: boolean;
  }

  export interface SendFaxOptions {
    numbers: string | string[];
    // Add other options...
  }

  class WestFax {
    constructor(config?: WestFaxConfig);
    sendFax(options: SendFaxOptions): Promise<any>;
    // Add other methods...
  }

  export default WestFax;
} 
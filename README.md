# WestFax NPM

[![WestFax](https://westfax.com/img/WestFax_Logo.webp)](https://westfax.com)

A Node.js client for the WestFax Secure Cloud Fax API.

[![npm version](https://img.shields.io/npm/v/westfax.svg)](https://www.npmjs.com/package/westfax)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install westfax
```

Node.js 18 or newer is required.

## Hosts

| Host | Constant | Use |
| --- | --- | --- |
| `https://apisecure.westfax.com` | default, `WestFax.LEGACY_BASE_URL` | Production. This is the host the client uses when you omit `baseUrl`. It is still live. |
| `https://api2.westfax.com` | `WestFax.PRODUCTION_BASE_URL` | Production host published in the current WestFax docs. |
| `https://integrate.westfax.com` | `WestFax.SANDBOX_BASE_URL` | Developer sandbox. Calls do not send live faxes. |

Authenticate with `username` and `password`, or with `apiKey` (sent as `x-api-key`). Sandbox accounts can use either. Most calls also need a `productId`, which is the fax line id from `getProductList()` or `getF2EProductList()`.

```javascript
const WestFax = require('westfax');

const client = new WestFax({
  username: process.env.WESTFAX_USERNAME,
  password: process.env.WESTFAX_PASSWORD,
  productId: process.env.WESTFAX_PRODUCT_ID
});

// Sandbox
const sandbox = new WestFax({
  apiKey: process.env.WESTFAX_API_KEY,
  productId: process.env.WESTFAX_PRODUCT_ID,
  baseUrl: WestFax.SANDBOX_BASE_URL
});
```

The first product id is available from `client.getProductId()`. It returns `null` when the account has no products. Request failures are thrown.

## Sending a fax

`numbers` is a string for one recipient or an array of up to 20. `file` is a path, `Buffer`, or stream. `files` adds more documents (`Files1`, `Files2`, and so on). `callbackUrl` is posted as `CallBackUrl`.

```javascript
const result = await client.sendFax({
  jobName: 'Labs',
  header: 'Acme Clinic',
  billingCode: 'Customer Code 1234',
  numbers: ['800-555-0100', '800-555-0101'],
  file: '/path/to/document.pdf',
  faxQuality: 'Fine',
  feedbackEmail: 'ops@example.com',
  callbackUrl: 'https://example.com/webhooks/fax'
});

// result.Result is the JobId when result.Success is true
```

A finished job has `Status: "Complete"`. That means WestFax finished trying. Delivery for each recipient is `FaxCallInfoList[].Result` (`Sent`, `Busy`, `NoAnswer`, `Failed`, and so on).

```javascript
const status = await client.getFaxDescriptionsUsingIds({
  Id: result.Result,
  Direction: 'Outbound'
});
```

## Receiving a fax

```javascript
const identifiers = await client.getFaxIdentifiers({
  faxDirection: 'Inbound',
  startDate: '1/1/2020'
});

const faxId = {
  Id: identifiers.Result[0].Id,
  Direction: 'Inbound'
};

const documents = await client.getFaxDocuments(faxId, 'pdf');
const fileContents = documents.Result[0].FaxFiles[0].FileContents;
const pdf = Buffer.from(fileContents, 'base64');

await client.changeFaxFilterValue(faxId, 'Retrieved');
```

`changeFaxFilterValue` accepts `None` (unread), `Retrieved` (read), and `Removed`. Up to 10 fax ids can be sent in one call.

## Other calls

```javascript
await client.getFaxDescriptions({
  faxDirection: 'Outbound',
  startDate: '6/1/2026'
});

await client.searchFaxes({
  faxDirection: 'Inbound',
  page: 1,
  count: 25
});

await client.getFaxUsage({
  startDate: '6/1/2026 12:00:00AM',
  endDate: '7/1/2026 12:00:00AM'
});

await client.getProductsWithInboundFaxes('None');
```

`getFaxUsage` covers one fax line and at most 32 days. A longer span comes back as an API error.

Failed HTTP calls throw `WestFaxError`. `error.response` is still set when the server returned a body, and `error.infoString` carries the API message. A JSON body with `Success: false` is returned to you, not thrown, so existing checks of `result.Success` keep working.

## Examples

- `examples/get-product-id.js`
- `examples/send-fax.js`
- `examples/get-faxes.js`

Copy `examples/.env.example` to `examples/.env`, then run `node examples/get-product-id.js`. `send-fax.js` will not run until `FAX_NUMBER` is set, because a call against production sends a real fax.

## Testing

`npm test` does not call WestFax. It checks request construction against a mocked HTTP client.

`npm run test:real` calls `getProductList` on the live host using the credentials in the environment. It does not send a fax. Put credentials in a root `.env` file (see `.env.example`) or export them in the shell.

## API reference

### `new WestFax(config)`

- `username`, `password` — account credentials
- `apiKey` — optional `x-api-key`
- `productId` — default fax line id
- `baseUrl` — API host, without a trailing path
- `responseEncoding` — `JSON` (default) or `XML`
- `cookies` — default `false`
- `timeout` — milliseconds, default `120000`

### Methods

- `getProductId()` → `Promise<string|null>`
- `getProductList()` / `getF2EProductList()`
- `sendFax(options)`
- `getFaxDocuments(faxIds, format = 'pdf')` — `pdf`, `tiff`, `jpeg`, `png`, or `gif`
- `getFaxDescriptionsUsingIds(faxIds)`
- `changeFaxFilterValue(faxIds, filter)`
- `getProductsWithInboundFaxes(filter = 'None')`
- `getFaxIdentifiers({ faxDirection, startDate, productId })`
- `getFaxDescriptions({ faxDirection, startDate, productId })`
- `getFaxUsage({ startDate, endDate, productId })`
- `searchFaxes({ faxDirection, page, count, startDate, endDate, filter, productId })`

## License

MIT

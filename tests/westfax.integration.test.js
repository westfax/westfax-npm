require('dotenv').config();
const WestFax = require('../index');

const enabled = process.env.USE_REAL_API === 'true';
const describeReal = enabled ? describe : describe.skip;

describeReal('WestFax live API', () => {
  const username = process.env.WESTFAX_USERNAME;
  const password = process.env.WESTFAX_PASSWORD;
  const apiKey = process.env.WESTFAX_API_KEY;

  beforeAll(() => {
    if (!username && !apiKey) {
      throw new Error('Set WESTFAX_USERNAME and WESTFAX_PASSWORD, or WESTFAX_API_KEY');
    }
  });

  test('reads the product list without sending a fax', async () => {
    const client = new WestFax({
      username,
      password,
      apiKey,
      productId: process.env.WESTFAX_PRODUCT_ID,
      baseUrl: process.env.WESTFAX_API_URL
    });

    const result = await client.getProductList();
    expect(result).toHaveProperty('Success');
    if (result.Success && Array.isArray(result.Result) && result.Result.length > 0) {
      expect(result.Result[0]).toHaveProperty('Id');
    }
  }, 30000);
});

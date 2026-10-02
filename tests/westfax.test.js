const FormData = require('form-data');

const mockHttp = {
  post: jest.fn()
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockHttp)
}));

const WestFax = require('../index');
const { WestFaxError } = WestFax;

const PRODUCT_ID = '11111111-2222-3333-4444-555555555555';

function fields() {
  return FormData.prototype.append.mock.calls.map(([name, value]) => [name, value]);
}

function fieldMap() {
  return new Map(fields());
}

describe('WestFax client', () => {
  beforeEach(() => {
    mockHttp.post.mockReset();
    mockHttp.post.mockResolvedValue({ data: { Success: true, Result: 'job-id' } });
    jest.spyOn(FormData.prototype, 'append');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('uses the legacy production host by default', () => {
    const client = new WestFax();
    expect(client.baseUrl).toBe('https://apisecure.westfax.com');
    expect(client.baseUrl).toBe(WestFax.LEGACY_BASE_URL);
    expect(client.responseEncoding).toBe('JSON');
    expect(client.cookies).toBe(false);
    expect(client.timeout).toBe(120000);
    expect(WestFax.PRODUCTION_BASE_URL).toBe('https://api2.westfax.com');
    expect(WestFax.SANDBOX_BASE_URL).toBe('https://integrate.westfax.com');
  });

  test('accepts an API key, sandbox host, and custom timeout', () => {
    const client = new WestFax({
      apiKey: 'sandbox-key',
      productId: PRODUCT_ID,
      baseUrl: `${WestFax.SANDBOX_BASE_URL}/`,
      timeout: 5000
    });

    expect(client.apiKey).toBe('sandbox-key');
    expect(client.baseUrl).toBe(WestFax.SANDBOX_BASE_URL);
    expect(client.timeout).toBe(5000);
  });

  test('rejects an unknown response encoding', () => {
    expect(() => new WestFax({ responseEncoding: '../admin' })).toThrow(WestFaxError);
  });

  describe('sendFax', () => {
    const client = () => new WestFax({
      username: 'user',
      password: 'secret',
      productId: PRODUCT_ID,
      apiKey: 'live-key'
    });

    test('posts recipients, the document, and CallBackUrl', async () => {
      const result = await client().sendFax({
        jobName: 'Labs',
        header: 'Acme',
        billingCode: 'C-1',
        numbers: [' 800-555-1212 ', '800-555-1213'],
        file: Buffer.from('pdf'),
        filename: 'labs.pdf',
        csid: '111',
        ani: '222',
        startDate: '1/1/1999',
        faxQuality: 'fine',
        feedbackEmail: 'ops@example.com',
        callbackUrl: 'https://example.com/fax'
      });

      expect(result).toEqual({ Success: true, Result: 'job-id' });
      expect(fieldMap()).toEqual(new Map([
        ['Username', 'user'],
        ['Password', 'secret'],
        ['Cookies', 'false'],
        ['ProductId', PRODUCT_ID],
        ['JobName', 'Labs'],
        ['Header', 'Acme'],
        ['BillingCode', 'C-1'],
        ['Numbers1', '800-555-1212'],
        ['Numbers2', '800-555-1213'],
        ['Files0', expect.any(Buffer)],
        ['CSID', '111'],
        ['ANI', '222'],
        ['StartDate', '1/1/1999'],
        ['FaxQuality', 'Fine'],
        ['FeedbackEmail', 'ops@example.com'],
        ['CallBackUrl', 'https://example.com/fax']
      ]));

      const [url, , config] = mockHttp.post.mock.calls[0];
      expect(url).toBe(`https://apisecure.westfax.com/rest/Fax_SendFax/JSON`);
      expect(config.headers['x-api-key']).toBe('live-key');
      expect(config.headers['content-type']).toEqual(expect.stringContaining('multipart/form-data'));
      expect(config.headers.ContentType).toBeUndefined();
      expect(config.timeout).toBe(120000);
    });

    test('sends a single number as Numbers1 and extra files as Files1', async () => {
      await client().sendFax({
        numbers: '800-555-1212',
        file: Buffer.from('one'),
        files: [{ data: Buffer.from('two'), filename: 'second.pdf' }]
      });

      expect(fieldMap().get('Numbers1')).toBe('800-555-1212');
      expect(fieldMap().has('Numbers2')).toBe(false);
      expect(FormData.prototype.append).toHaveBeenCalledWith('Files0', expect.any(Buffer), {
        filename: 'document.pdf'
      });
      expect(FormData.prototype.append).toHaveBeenCalledWith('Files1', expect.any(Buffer), {
        filename: 'second.pdf'
      });
    });

    test('rejects more than 20 numbers before calling the API', async () => {
      const numbers = Array.from({ length: 21 }, (_, index) => `800555${String(index).padStart(4, '0')}`);
      await expect(client().sendFax({
        numbers,
        file: Buffer.from('pdf')
      })).rejects.toThrow('Maximum of 20 fax numbers allowed');
      expect(mockHttp.post).not.toHaveBeenCalled();
    });

    test('rejects a missing file, number, quality, or product id', async () => {
      await expect(client().sendFax({ numbers: '800-555-1212' })).rejects.toThrow('At least one file is required');
      await expect(client().sendFax({ file: Buffer.from('pdf') })).rejects.toThrow('At least one fax number is required');
      await expect(client().sendFax({
        numbers: '800-555-1212',
        file: Buffer.from('pdf'),
        faxQuality: 'Draft'
      })).rejects.toThrow('faxQuality must be Fine or Normal');

      const unsigned = new WestFax({ username: 'user', password: 'secret' });
      await expect(unsigned.sendFax({
        numbers: '800-555-1212',
        file: Buffer.from('pdf')
      })).rejects.toThrow('productId is required');
      expect(mockHttp.post).not.toHaveBeenCalled();
    });
  });

  describe('fax id calls', () => {
    const client = () => new WestFax({
      username: 'user',
      password: 'secret',
      productId: PRODUCT_ID
    });
    const faxIds = [
      { Id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', Direction: 'Inbound' },
      { Id: 'ffffffff-1111-2222-3333-444444444444', Direction: 'Outbound' }
    ];

    test('requests documents with FaxIds1 and a normalized format', async () => {
      await client().getFaxDocuments(faxIds[0], 'PDF');
      expect(fieldMap().get('Format')).toBe('pdf');
      expect(fieldMap().get('FaxIds1')).toBe(JSON.stringify(faxIds[0]));
    });

    test('numbers each fax id instead of posting one FaxIds blob', async () => {
      await client().getFaxDescriptionsUsingIds(faxIds);
      expect(fieldMap().get('FaxIds1')).toBe(JSON.stringify(faxIds[0]));
      expect(fieldMap().get('FaxIds2')).toBe(JSON.stringify(faxIds[1]));
      expect(fieldMap().has('FaxIds')).toBe(false);
    });

    test('rejects more than 10 fax ids and unknown filters', async () => {
      const tooMany = Array.from({ length: 11 }, () => faxIds[0]);
      await expect(client().changeFaxFilterValue(tooMany, 'Retrieved')).rejects.toThrow(
        'Maximum of 10 fax ids allowed'
      );
      await expect(client().changeFaxFilterValue(faxIds[0], 'Read')).rejects.toThrow(
        'filter must be None, Retrieved, or Removed'
      );
      expect(mockHttp.post).not.toHaveBeenCalled();
    });

    test('asks for products with inbound faxes without a product id', async () => {
      await client().getProductsWithInboundFaxes('retrieved');
      expect(fieldMap().get('Filter')).toBe('Retrieved');
      expect(fieldMap().has('ProductId')).toBe(false);
      expect(mockHttp.post.mock.calls[0][0]).toContain('/rest/Fax_GetProductsWithInboundFaxes/JSON');
    });
  });

  describe('account and history calls', () => {
    test('returns the first product id and falls back to the fax-to-email list', async () => {
      const client = new WestFax({ apiKey: 'key' });
      mockHttp.post
        .mockResolvedValueOnce({ data: { Success: true, Result: [] } })
        .mockResolvedValueOnce({
          data: { Success: true, Result: [{ Id: PRODUCT_ID, Name: 'Line' }] }
        });

      await expect(client.getProductId()).resolves.toBe(PRODUCT_ID);
      expect(mockHttp.post.mock.calls.map(([url]) => url)).toEqual([
        'https://apisecure.westfax.com/rest/Profile_GetProductList/JSON',
        'https://apisecure.westfax.com/rest/Profile_GetF2EProductList/JSON'
      ]);
      expect(fieldMap().has('Username')).toBe(false);
      expect(mockHttp.post.mock.calls[0][2].headers['x-api-key']).toBe('key');
    });

    test('returns null when neither product list has an id', async () => {
      const client = new WestFax({ username: 'user', password: 'secret' });
      mockHttp.post.mockResolvedValue({ data: { Success: false, ErrorString: 'Authorization_Failed_BadUsernamePassword' } });
      await expect(client.getProductId()).resolves.toBeNull();
    });

    test('requires credentials before making a request', async () => {
      const client = new WestFax();
      await expect(client.getProductList()).rejects.toThrow('Set username and password, or an API key');
      expect(mockHttp.post).not.toHaveBeenCalled();
    });

    test('loads identifiers, descriptions, usage, and a paged search', async () => {
      const client = new WestFax({
        username: 'user',
        password: 'secret',
        productId: PRODUCT_ID
      });

      await client.getFaxIdentifiers({ faxDirection: 'outbound', startDate: '1/1/2020' });
      expect(mockHttp.post.mock.calls[0][0]).toContain('/rest/Fax_GetFaxIdentifiers/JSON');
      expect(fieldMap().get('FaxDirection')).toBe('Outbound');
      expect(fieldMap().get('StartDate')).toBe('1/1/2020');

      jest.restoreAllMocks();
      jest.spyOn(FormData.prototype, 'append');
      await client.getFaxDescriptions({ faxDirection: 'Inbound', startDate: '6/1/2026' });
      expect(mockHttp.post.mock.calls[1][0]).toContain('/rest/Fax_GetFaxDescriptions/JSON');

      jest.restoreAllMocks();
      jest.spyOn(FormData.prototype, 'append');
      await client.getFaxUsage({ startDate: '6/1/2026', endDate: '7/1/2026' });
      expect(fieldMap().get('EndDate')).toBe('7/1/2026');
      expect(mockHttp.post.mock.calls[2][0]).toContain('/rest/Profile_GetFaxUsageByProductId/JSON');

      jest.restoreAllMocks();
      jest.spyOn(FormData.prototype, 'append');
      await client.searchFaxes({ page: 2, count: 10, filter: 'None' });
      expect(fieldMap().get('MethodParams1')).toBe(JSON.stringify({ Name: 'page', Value: '2' }));
      expect(fieldMap().get('MethodParams2')).toBe(JSON.stringify({ Name: 'count', Value: '10' }));
      expect(fieldMap().get('FaxDirection')).toBe('Inbound');
      expect(mockHttp.post.mock.calls[3][0]).toContain('/rest/Fax_GetF2EFaxDescriptions_PagedSearch/JSON');
    });

    test('wraps transport failures and keeps the response body', async () => {
      const client = new WestFax({ username: 'user', password: 'secret', productId: PRODUCT_ID });
      const failure = new Error('timeout of 120000ms exceeded');
      failure.code = 'ECONNABORTED';
      failure.response = {
        status: 500,
        data: { ErrorString: 'Api_Failed_', InfoString: 'Timespan is more than 32 days' }
      };
      mockHttp.post.mockRejectedValue(failure);

      await expect(client.getFaxUsage({
        startDate: '1/1/2020',
        endDate: '3/1/2020'
      })).rejects.toMatchObject({
        name: 'WestFaxError',
        message: 'Timespan is more than 32 days',
        errorString: 'Api_Failed_',
        status: 500,
        response: failure.response
      });
    });
  });
});

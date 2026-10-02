const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const PRODUCTION_BASE_URL = 'https://api2.westfax.com';
const LEGACY_BASE_URL = 'https://apisecure.westfax.com';
const SANDBOX_BASE_URL = 'https://integrate.westfax.com';
const DEFAULT_BASE_URL = LEGACY_BASE_URL;
const DEFAULT_TIMEOUT_MS = 120000;
const MAX_RECIPIENTS = 20;
const MAX_FAX_IDS = 10;

const FILTERS = {
  none: 'None',
  retrieved: 'Retrieved',
  removed: 'Removed'
};

const DIRECTIONS = {
  inbound: 'Inbound',
  outbound: 'Outbound'
};

const QUALITIES = {
  fine: 'Fine',
  normal: 'Normal'
};

const FORMATS = ['pdf', 'tiff', 'jpeg', 'png', 'gif'];

class WestFaxError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WestFaxError';
    this.status = details.status;
    this.code = details.code;
    this.response = details.response;
    this.errorString = details.errorString;
    this.infoString = details.infoString;
  }
}

class WestFax {
  /**
   * @param {Object} config
   * @param {string} [config.username]
   * @param {string} [config.password]
   * @param {string} [config.apiKey] x-api-key. Sandbox calls can use this instead of username and password.
   * @param {string} [config.productId]
   * @param {string} [config.baseUrl] Defaults to the legacy production host, which is still live.
   *   Current WestFax docs publish {@link WestFax.PRODUCTION_BASE_URL}. The sandbox is {@link WestFax.SANDBOX_BASE_URL}.
   * @param {string} [config.responseEncoding] JSON or XML.
   * @param {boolean} [config.cookies]
   * @param {number} [config.timeout] Request timeout in milliseconds.
   */
  constructor(config = {}) {
    const encoding = config.responseEncoding || 'JSON';
    if (!/^(JSON|XML)$/i.test(encoding)) {
      throw new WestFaxError('responseEncoding must be JSON or XML');
    }

    this.baseUrl = String(config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.responseEncoding = encoding;
    this.username = config.username || '';
    this.password = config.password || '';
    this.apiKey = config.apiKey || '';
    this.productId = config.productId || '';
    this.cookies = config.cookies || false;
    this.timeout = config.timeout == null ? DEFAULT_TIMEOUT_MS : config.timeout;
    this.http = axios.create({
      timeout: this.timeout,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
  }

  /**
   * Send a fax.
   * A string `numbers` value is one recipient. An array is sent as Numbers1, Numbers2, and so on (20 max).
   * `file` is a path, Buffer, or stream. `files` sends additional documents as Files1, Files2, and so on.
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async sendFax(options = {}) {
    const numbers = normalizeNumbers(options.numbers);
    const files = collectFiles(options);
    const productId = options.productId || this.productId;
    const formData = this._createForm({ productId, requireProductId: true });

    if (options.jobName) formData.append('JobName', options.jobName);
    if (options.header) formData.append('Header', options.header);
    if (options.billingCode) formData.append('BillingCode', options.billingCode);

    numbers.forEach((number, index) => {
      formData.append(`Numbers${index + 1}`, number);
    });

    files.forEach((file, index) => {
      appendFile(formData, file, index, options.filename);
    });

    if (options.csid) formData.append('CSID', options.csid);
    if (options.ani) formData.append('ANI', options.ani);
    if (options.startDate) formData.append('StartDate', options.startDate);
    if (options.faxQuality) formData.append('FaxQuality', normalizeQuality(options.faxQuality));
    if (options.feedbackEmail) formData.append('FeedbackEmail', options.feedbackEmail);

    const callbackUrl = options.callbackUrl || options.callBackUrl;
    if (callbackUrl) formData.append('CallBackUrl', callbackUrl);

    return this._post('Fax_SendFax', formData);
  }

  /**
   * Download fax documents. The file bytes are base64 in Result[].FaxFiles[].FileContents.
   * @param {Object|Object[]|string|string[]} faxIds
   * @param {string} [format]
   * @returns {Promise<Object>}
   */
  async getFaxDocuments(faxIds, format = 'pdf') {
    const formData = this._createForm({ requireProductId: true });
    formData.append('Format', normalizeFormat(format));
    appendFaxIds(formData, faxIds);
    return this._post('Fax_GetFaxDocuments', formData);
  }

  /**
   * Set a fax filter. None is unread, Retrieved is read, Removed is deleted.
   * @param {Object|Object[]|string|string[]} faxIds
   * @param {string} [filter]
   * @returns {Promise<Object>}
   */
  async changeFaxFilterValue(faxIds, filter = 'None') {
    const formData = this._createForm({ requireProductId: true });
    formData.append('Filter', normalizeFilter(filter));
    appendFaxIds(formData, faxIds);
    return this._post('Fax_ChangeFaxFilterValue', formData);
  }

  /**
   * Fax details for specific ids. Pass the id from Fax_SendFax with Direction Outbound,
   * or an inbound id from a webhook. Check FaxCallInfoList[].Result for each recipient.
   * Status Complete means the job finished trying, not that every recipient was delivered.
   * @param {Object|Object[]|string|string[]} faxIds
   * @returns {Promise<Object>}
   */
  async getFaxDescriptionsUsingIds(faxIds) {
    const formData = this._createForm({ requireProductId: true });
    appendFaxIds(formData, faxIds);
    return this._post('Fax_GetFaxDescriptionsUsingIds', formData);
  }

  /**
   * Products that have inbound faxes in the given filter.
   * @param {string} [filter]
   * @returns {Promise<Object>}
   */
  async getProductsWithInboundFaxes(filter = 'None') {
    const formData = this._createForm({ requireProductId: false, includeProductId: false });
    formData.append('Filter', normalizeFilter(filter));
    return this._post('Fax_GetProductsWithInboundFaxes', formData);
  }

  /**
   * Fax-to-email products (fax lines). Use Result[].Id as productId.
   * @returns {Promise<Object>}
   */
  async getF2EProductList() {
    return this._post('Profile_GetF2EProductList', this._createForm());
  }

  /**
   * All products the account can access.
   * @returns {Promise<Object>}
   */
  async getProductList() {
    return this._post('Profile_GetProductList', this._createForm());
  }

  /**
   * First product id from GetProductList, then GetF2EProductList.
   * Returns null when the account has no products. Request failures are thrown.
   * @returns {Promise<string|null>}
   */
  async getProductId() {
    const productList = await this.getProductList();
    const productId = firstProductId(productList);
    if (productId) return productId;

    const f2eProductList = await this.getF2EProductList();
    return firstProductId(f2eProductList);
  }

  /**
   * Fax ids for one direction since a start date. Use this to reconcile missed callbacks.
   * @param {Object} options
   * @param {string} options.faxDirection Inbound or Outbound
   * @param {string} options.startDate
   * @param {string} [options.productId]
   * @returns {Promise<Object>}
   */
  async getFaxIdentifiers(options = {}) {
    const formData = this._createForm({
      productId: options.productId,
      requireProductId: true
    });
    formData.append('FaxDirection', normalizeDirection(options.faxDirection));
    formData.append('StartDate', requireText(options.startDate, 'startDate'));
    return this._post('Fax_GetFaxIdentifiers', formData);
  }

  /**
   * Fax descriptions for one direction since a start date.
   * @param {Object} options
   * @param {string} options.faxDirection Inbound or Outbound
   * @param {string} options.startDate
   * @param {string} [options.productId]
   * @returns {Promise<Object>}
   */
  async getFaxDescriptions(options = {}) {
    const formData = this._createForm({
      productId: options.productId,
      requireProductId: true
    });
    formData.append('FaxDirection', normalizeDirection(options.faxDirection));
    formData.append('StartDate', requireText(options.startDate, 'startDate'));
    return this._post('Fax_GetFaxDescriptions', formData);
  }

  /**
   * Inbound and outbound counts for one fax line. The API allows a span of at most 32 days.
   * @param {Object} options
   * @param {string} options.startDate
   * @param {string} options.endDate
   * @param {string} [options.productId]
   * @returns {Promise<Object>}
   */
  async getFaxUsage(options = {}) {
    const formData = this._createForm({
      productId: options.productId,
      requireProductId: true
    });
    formData.append('StartDate', requireText(options.startDate, 'startDate'));
    formData.append('EndDate', requireText(options.endDate, 'endDate'));
    return this._post('Profile_GetFaxUsageByProductId', formData);
  }

  /**
   * Paged fax search (Fax_GetF2EFaxDescriptions_PagedSearch).
   * @param {Object} [options]
   * @param {string} [options.faxDirection]
   * @param {number} [options.page]
   * @param {number} [options.count]
   * @param {string} [options.startDate]
   * @param {string} [options.endDate]
   * @param {string} [options.filter]
   * @param {string} [options.productId]
   * @returns {Promise<Object>}
   */
  async searchFaxes(options = {}) {
    const page = options.page == null ? 1 : options.page;
    const count = options.count == null ? 25 : options.count;
    if (!Number.isInteger(page) || page < 1) {
      throw new WestFaxError('page must be an integer of 1 or greater');
    }
    if (!Number.isInteger(count) || count < 1) {
      throw new WestFaxError('count must be an integer of 1 or greater');
    }

    const formData = this._createForm({
      productId: options.productId,
      requireProductId: true
    });
    formData.append('FaxDirection', normalizeDirection(options.faxDirection || 'Inbound'));
    if (options.startDate) formData.append('StartDate', options.startDate);
    if (options.endDate) formData.append('EndDate', options.endDate);
    if (options.filter) formData.append('Filter', normalizeFilter(options.filter));
    formData.append('MethodParams1', JSON.stringify({ Name: 'page', Value: String(page) }));
    formData.append('MethodParams2', JSON.stringify({ Name: 'count', Value: String(count) }));
    return this._post('Fax_GetF2EFaxDescriptions_PagedSearch', formData);
  }

  _createForm({ productId = this.productId, requireProductId = false, includeProductId = true } = {}) {
    if (!this.username && !this.apiKey) {
      throw new WestFaxError('Set username and password, or an API key');
    }
    if (requireProductId && !productId) {
      throw new WestFaxError('productId is required');
    }

    const formData = new FormData();
    if (this.username) {
      formData.append('Username', this.username);
      formData.append('Password', this.password);
    }
    formData.append('Cookies', String(this.cookies));
    if (includeProductId && productId) {
      formData.append('ProductId', productId);
    }
    return formData;
  }

  async _post(action, formData) {
    const headers = {
      ...formData.getHeaders()
    };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;

    try {
      const response = await this.http.post(this._url(action), formData, {
        headers,
        timeout: this.timeout,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      return response.data;
    } catch (error) {
      throw wrapRequestError(error);
    }
  }

  _url(action) {
    return `${this.baseUrl}/rest/${action}/${this.responseEncoding}`;
  }
}

function wrapRequestError(error) {
  if (error instanceof WestFaxError) return error;
  const data = error.response && error.response.data;
  const info = data && (data.InfoString || data.ErrorString);
  return new WestFaxError(info || error.message || 'WestFax request failed', {
    status: error.response && error.response.status,
    code: error.code,
    response: error.response,
    errorString: data && data.ErrorString,
    infoString: data && data.InfoString
  });
}

function firstProductId(response) {
  if (!response || !response.Success || !Array.isArray(response.Result) || response.Result.length === 0) {
    return null;
  }
  return response.Result[0].Id || null;
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new WestFaxError(`${label} is required`);
  }
  return value;
}

function normalizeFilter(filter) {
  const value = FILTERS[String(filter).toLowerCase()];
  if (!value) {
    throw new WestFaxError('filter must be None, Retrieved, or Removed');
  }
  return value;
}

function normalizeDirection(direction) {
  const value = DIRECTIONS[String(direction).toLowerCase()];
  if (!value) {
    throw new WestFaxError('faxDirection must be Inbound or Outbound');
  }
  return value;
}

function normalizeQuality(quality) {
  const value = QUALITIES[String(quality).toLowerCase()];
  if (!value) {
    throw new WestFaxError('faxQuality must be Fine or Normal');
  }
  return value;
}

function normalizeFormat(format) {
  const value = String(format).toLowerCase();
  if (!FORMATS.includes(value)) {
    throw new WestFaxError('format must be pdf, tiff, jpeg, png, or gif');
  }
  return value;
}

function normalizeNumbers(numbers) {
  const list = Array.isArray(numbers) ? numbers : [numbers];
  if (list.length === 0 || list.some((number) => typeof number !== 'string' || number.trim() === '')) {
    throw new WestFaxError('At least one fax number is required');
  }
  if (list.length > MAX_RECIPIENTS) {
    throw new WestFaxError('Maximum of 20 fax numbers allowed');
  }
  return list.map((number) => number.trim());
}

function collectFiles(options) {
  const files = [];
  if (options.file) files.push(options.file);
  if (options.files) {
    if (!Array.isArray(options.files)) {
      throw new WestFaxError('files must be an array');
    }
    files.push(...options.files);
  }
  if (files.length === 0) {
    throw new WestFaxError('At least one file is required');
  }
  return files;
}

function appendFile(formData, file, index, fallbackName) {
  const field = `Files${index}`;
  const filename = fallbackName || 'document.pdf';

  if (typeof file === 'string') {
    formData.append(field, fs.createReadStream(file));
    return;
  }

  if (file && typeof file === 'object' && !Buffer.isBuffer(file) && file.data) {
    formData.append(field, file.data, { filename: file.filename || filename });
    return;
  }

  formData.append(field, file, { filename });
}

function appendFaxIds(formData, faxIds) {
  const ids = Array.isArray(faxIds) ? faxIds : [faxIds];
  if (ids.length === 0 || ids.some((id) => id == null || id === '')) {
    throw new WestFaxError('At least one fax id is required');
  }
  if (ids.length > MAX_FAX_IDS) {
    throw new WestFaxError('Maximum of 10 fax ids allowed');
  }

  ids.forEach((faxId, index) => {
    const value = typeof faxId === 'string' ? faxId : JSON.stringify(faxId);
    formData.append(`FaxIds${index + 1}`, value);
  });
}

WestFax.PRODUCTION_BASE_URL = PRODUCTION_BASE_URL;
WestFax.LEGACY_BASE_URL = LEGACY_BASE_URL;
WestFax.SANDBOX_BASE_URL = SANDBOX_BASE_URL;
WestFax.WestFaxError = WestFaxError;

module.exports = WestFax;
module.exports.WestFaxError = WestFaxError;
module.exports.PRODUCTION_BASE_URL = PRODUCTION_BASE_URL;
module.exports.LEGACY_BASE_URL = LEGACY_BASE_URL;
module.exports.SANDBOX_BASE_URL = SANDBOX_BASE_URL;

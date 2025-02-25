//index.js

// WestFax API Client
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class WestFax {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://apisecure.westfax.com';
    this.responseEncoding = config.responseEncoding || 'JSON';
    this.username = config.username || '';
    this.password = config.password || '';
    this.productId = config.productId || '';
    this.cookies = config.cookies || false;
  }

  /**
   * Send a fax using the WestFax API
   * @param {Object} options - Fax sending options
   * @param {string} options.jobName - Name of the fax job
   * @param {string} options.header - Header to display on the fax
   * @param {string} options.billingCode - Optional billing code
   * @param {string|string[]} options.numbers - Destination fax number(s). Can be a single string or an array of strings for multiple recipients.
   *                                           When an array is provided, numbers will be formatted as Numbers1, Numbers2, Numbers3, etc.
   * @param {string|Buffer|Stream} options.file - The file to fax (path or buffer)
   * @param {string} options.csid - Optional CSID (Caller Service ID)
   * @param {string} options.ani - Optional ANI (Automatic Number Identification)
   * @param {string} options.startDate - Optional start date for the fax
   * @param {string} options.faxQuality - Optional fax quality (Fine or Normal)
   * @param {string} options.feedbackEmail - Optional email for status notifications
   * @param {string} options.callbackUrl - Optional callback URL for status updates
   * @returns {Promise<Object>} - Response from the API
   */
  async sendFax(options = {}) {
    const formData = new FormData();
    
    // Add authentication and required fields
    formData.append('Username', this.username);
    formData.append('Password', this.password);
    formData.append('Cookies', this.cookies.toString());
    formData.append('ProductId', this.productId);
    
    // Add job details
    if (options.jobName) formData.append('JobName', options.jobName);
    if (options.header) formData.append('Header', options.header);
    if (options.billingCode) formData.append('BillingCode', options.billingCode);
    
    // Add fax numbers (required)
    if (options.numbers) {
      if (Array.isArray(options.numbers)) {
        options.numbers.forEach((number, index) => {
          formData.append(`Numbers${index + 1}`, number);
        });
      } else {
        formData.append('Numbers1', options.numbers);
      }
    }
    
    // Add file (required)
    if (options.file) {
      if (typeof options.file === 'string') {
        // It's a file path
        formData.append('Files0', fs.createReadStream(options.file));
      } else {
        // It's a buffer or stream
        formData.append('Files0', options.file, { filename: options.filename || 'document.pdf' });
      }
    }
    
    // Add optional fields
    if (options.csid) formData.append('CSID', options.csid);
    if (options.ani) formData.append('ANI', options.ani);
    if (options.startDate) formData.append('StartDate', options.startDate);
    if (options.faxQuality) formData.append('FaxQuality', options.faxQuality);
    if (options.feedbackEmail) formData.append('FeedbackEmail', options.feedbackEmail);
    if (options.callbackUrl) formData.append('CallbackUrl', options.callbackUrl);
    
    const response = await axios.post(
      `${this.baseUrl}/REST/Fax_SendFax/${this.responseEncoding}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'ContentType': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }

  /**
   * Retrieve fax documents for specified fax IDs
   * @param {Array|Object} faxIds - Fax identifiers to retrieve
   * @param {string} format - Format for returned documents (pdf, tiff, jpeg, png, or gif)
   * @returns {Promise<Object>} - Response from the API
   */
  async getFaxDocuments(faxIds, format = 'pdf') {
    const formData = new FormData();
    
    // Add authentication and required fields
    formData.append('Username', this.username);
    formData.append('Password', this.password);
    formData.append('Cookies', this.cookies.toString());
    formData.append('ProductId', this.productId);
    formData.append('Format', format);
    
    // Add fax IDs
    if (Array.isArray(faxIds)) {
      faxIds.forEach((faxId, index) => {
        formData.append(`FaxIds${index + 1}`, typeof faxId === 'string' ? faxId : JSON.stringify(faxId));
      });
    } else {
      formData.append('FaxIds1', typeof faxIds === 'string' ? faxIds : JSON.stringify(faxIds));
    }
    
    const response = await axios.post(
      `${this.baseUrl}/REST/Fax_GetFaxDocuments/${this.responseEncoding}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    return response.data;
  }

  /**
   * Change the filter value of specified faxes
   * @param {Array|Object} faxIds - Fax identifiers to update
   * @param {string} filter - Filter value to set (None, Retrieved, Removed)
   * @returns {Promise<Object>} - Response from the API
   */
  async changeFaxFilterValue(faxIds, filter = 'None') {
    const formData = new FormData();
    
    // Add authentication and required fields
    formData.append('Username', this.username);
    formData.append('Password', this.password);
    formData.append('Cookies', this.cookies.toString());
    formData.append('ProductId', this.productId);
    formData.append('Filter', filter);
    
    // Add fax IDs
    if (Array.isArray(faxIds)) {
      faxIds.forEach((faxId, index) => {
        formData.append(`FaxIds${index + 1}`, typeof faxId === 'string' ? faxId : JSON.stringify(faxId));
      });
    } else {
      formData.append('FaxIds1', typeof faxIds === 'string' ? faxIds : JSON.stringify(faxIds));
    }
    
    const response = await axios.post(
      `${this.baseUrl}/REST/Fax_ChangeFaxFilterValue/${this.responseEncoding}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    return response.data;
  }

  /**
   * Get detailed descriptions of specified faxes
   * @param {Array|Object} faxIds - Fax identifiers to get descriptions for
   * @returns {Promise<Object>} - Response from the API
   */
  async getFaxDescriptionsUsingIds(faxIds) {
    const formData = new FormData();
    
    // Add authentication and required fields
    formData.append('Username', this.username);
    formData.append('Password', this.password);
    formData.append('Cookies', this.cookies.toString());
    formData.append('ProductId', this.productId);
    
    // Add fax IDs
    if (Array.isArray(faxIds)) {
      formData.append('FaxIds', JSON.stringify(faxIds));
    } else {
      formData.append('FaxIds', typeof faxIds === 'string' ? faxIds : JSON.stringify(faxIds));
    }
    
    const response = await axios.post(
      `${this.baseUrl}/REST/Fax_GetFaxDescriptionsUsingIds/${this.responseEncoding}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    return response.data;
  }

  /**
   * Get products with inbound faxes matching a filter
   * @param {string} filter - Filter to apply (None, Retrieved, Removed)
   * @returns {Promise<Object>} - Response from the API
   */
  async getProductsWithInboundFaxes(filter = 'None') {
    const formData = new FormData();
    
    // Add authentication and required fields
    formData.append('Username', this.username);
    formData.append('Password', this.password);
    formData.append('Filter', filter);
    
    const response = await axios.post(
      `${this.baseUrl}/REST/Fax_GetProductsWithInboundFaxes/${this.responseEncoding}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    return response.data;
  }

  /**
   * Get a list of fax-to-email products the user has access to
   * @returns {Promise<Object>} - Response from the API
   */
  async getF2EProductList() {
    const formData = new FormData();
    
    // Add authentication and required fields
    formData.append('Username', this.username);
    formData.append('Password', this.password);
    formData.append('Cookies', this.cookies.toString());
    
    const response = await axios.post(
      `${this.baseUrl}/REST/Profile_GetF2EProductList/${this.responseEncoding}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    return response.data;
  }

  /**
   * Get a list of all products the user has access to
   * @returns {Promise<Object>} - Response from the API containing product list
   */
  async getProductList() {
    const formData = new FormData();
    
    // Add authentication and required fields
    formData.append('Username', this.username);
    formData.append('Password', this.password);
    formData.append('Cookies', this.cookies.toString());
    
    const response = await axios.post(
      `${this.baseUrl}/REST/Profile_GetProductList/${this.responseEncoding}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    return response.data;
  }
  
  /**
   * Helper method to get the first available ProductId
   * This is useful for new users to retrieve their ProductId
   * @returns {Promise<string|null>} - Returns the first ProductId found or null if none
   */
  async getProductId() {
    try {
      // Try the GetProductList API first
      const productList = await this.getProductList();
      
      if (productList.Success && productList.Result && productList.Result.length > 0) {
        return productList.Result[0].Id;
      }
      
      // If GetProductList fails or returns no results, try GetF2EProductList
      const f2eProductList = await this.getF2EProductList();
      
      if (f2eProductList.Success && f2eProductList.Result && f2eProductList.Result.length > 0) {
        return f2eProductList.Result[0].Id;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving ProductId:', error.message);
      return null;
    }
  }
}

module.exports = WestFax;  
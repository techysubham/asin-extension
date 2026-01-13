/**
 * Node.js Backend Implementation Template
 * 
 * This file provides a template for implementing the DatabaseService interface
 * with your Node.js backend. Create this file when you're ready to switch.
 * 
 * USAGE: Uncomment the code below and customize the API calls for your backend.
 */

class NodeJSDatabase {
  constructor(config) {
    this.config = config;
    this.apiUrl = config.nodejs.apiUrl;
    this.apiKey = config.nodejs.apiKey;
    this.endpoints = config.nodejs.endpoints;
  }

  async initialize() {
    // Test connection to your API
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (!response.ok) {
        throw new Error('API health check failed');
      }
      console.log('✅ Node.js API connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to Node.js API:', error);
      throw error;
    }
  }

  /**
   * Helper method to make API calls
   */
  async apiCall(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async saveAsins(account, category, asins) {
    return await this.apiCall(this.endpoints.saveAsins, 'POST', {
      account,
      category,
      asins
    });
  }

  async getAllAsins(accountFilter = null) {
    const url = accountFilter 
      ? `${this.endpoints.getAllAsins}?account=${encodeURIComponent(accountFilter)}`
      : this.endpoints.getAllAsins;
    return await this.apiCall(url);
  }

  async getAsins(account, category) {
    return await this.apiCall(
      `${this.endpoints.getAsins}?account=${encodeURIComponent(account)}&category=${encodeURIComponent(category)}`
    );
  }

  async deleteCategory(account, category) {
    return await this.apiCall(this.endpoints.deleteCategory, 'DELETE', {
      account,
      category
    });
  }

  async getAccounts() {
    return await this.apiCall(this.endpoints.getAccounts);
  }

  async addAccount(account) {
    return await this.apiCall(this.endpoints.addAccount, 'POST', { account });
  }

  async getCategories() {
    return await this.apiCall(this.endpoints.getCategories);
  }

  async addCategory(category) {
    return await this.apiCall(this.endpoints.addCategory, 'POST', { category });
  }

  async getStats() {
    return await this.apiCall(this.endpoints.getStats);
  }
}

/**
 * EXAMPLE NODE.JS BACKEND (Express.js):
 * 
 * const express = require('express');
 * const app = express();
 * app.use(express.json());
 * 
 * // Your database (MySQL, PostgreSQL, MongoDB, etc.)
 * const db = require('./your-database');
 * 
 * app.post('/api/asins/save', async (req, res) => {
 *   const { account, category, asins } = req.body;
 *   // Save to your database
 *   const result = await db.saveAsins(account, category, asins);
 *   res.json(result);
 * });
 * 
 * app.get('/api/asins/all', async (req, res) => {
 *   const { account } = req.query;
 *   const data = await db.getAllAsins(account);
 *   res.json(data);
 * });
 * 
 * // ... implement other endpoints
 * 
 * app.listen(3000, () => console.log('API running on port 3000'));
 */

// Make globally available
window.NodeJSDatabase = NodeJSDatabase;

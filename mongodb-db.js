/**
 * MongoDB Database Implementation
 * 
 * Connects to your Vercel API which stores data in MongoDB
 */

class MongoDBDatabase {
  constructor(config) {
    this.config = config.mongodb;
    this.apiUrl = this.config.apiUrl;
    this.endpoints = this.config.endpoints;
  }

  async initialize() {
    console.log('✅ MongoDB Database initialized');
    console.log('📍 API URL:', this.apiUrl);
  }

  /**
   * Make API request with error handling
   */
  async apiRequest(endpoint, options = {}) {
    try {
      const url = `${this.apiUrl}${endpoint}`;
      console.log('🌐 API Request:', options.method || 'GET', url);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  /**
   * Save ASINs to database
   */
  async saveAsins(account, category, asins) {
    try {
      const result = await this.apiRequest(this.endpoints.saveAsins, {
        method: 'POST',
        body: JSON.stringify({
          account,
          category,
          asins
        })
      });

      return {
        success: true,
        newCount: result.newCount || asins.length,
        totalCount: result.totalCount || asins.length,
        message: result.message
      };
    } catch (error) {
      console.error('Failed to save ASINs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all ASINs (optionally filtered by account)
   */
  async getAllAsins(accountFilter = null) {
    try {
      const endpoint = accountFilter 
        ? `${this.endpoints.getAllAsins}?account=${encodeURIComponent(accountFilter)}`
        : this.endpoints.getAllAsins;
      
      const result = await this.apiRequest(endpoint);
      return result.data || {};
    } catch (error) {
      console.error('Failed to get ASINs:', error);
      return {};
    }
  }

  /**
   * Get ASINs for specific account and category
   */
  async getAsins(account, category) {
    try {
      const endpoint = `${this.endpoints.getAsins}?account=${encodeURIComponent(account)}&category=${encodeURIComponent(category)}`;
      const result = await this.apiRequest(endpoint);
      return result.asins || [];
    } catch (error) {
      console.error('Failed to get ASINs:', error);
      return [];
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(account, category) {
    try {
      await this.apiRequest(this.endpoints.deleteCategory, {
        method: 'DELETE',
        body: JSON.stringify({ account, category })
      });
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      return false;
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts() {
    try {
      const result = await this.apiRequest(this.endpoints.getAccounts);
      return result.accounts || [];
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  }

  /**
   * Add new account
   */
  async addAccount(account) {
    try {
      await this.apiRequest(this.endpoints.addAccount, {
        method: 'POST',
        body: JSON.stringify({ account })
      });
      return true;
    } catch (error) {
      console.error('Failed to add account:', error);
      return false;
    }
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const result = await this.apiRequest(this.endpoints.getCategories);
      return result.categories || ['console', 'watch strap', 'phone case', 'electronics'];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return ['console', 'watch strap', 'phone case', 'electronics'];
    }
  }

  /**
   * Add new category
   */
  async addCategory(category) {
    try {
      await this.apiRequest(this.endpoints.addCategory, {
        method: 'POST',
        body: JSON.stringify({ category })
      });
      return true;
    } catch (error) {
      console.error('Failed to add category:', error);
      return false;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const result = await this.apiRequest(this.endpoints.getStats);
      return result.stats || { totalAsins: 0, accountCount: 0, categoryCount: 0 };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { totalAsins: 0, accountCount: 0, categoryCount: 0 };
    }
  }
}

// Make it globally accessible
window.MongoDBDatabase = MongoDBDatabase;

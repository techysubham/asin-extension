/**
 * Database Service Abstraction Layer
 * 
 * This service provides a unified interface for database operations.
 * Switch between Firebase and Node.js by changing the implementation in db-config.js
 * 
 * All extension code uses this interface, making backend changes transparent.
 */

class DatabaseService {
  constructor() {
    this.implementation = null;
  }

  /**
   * Initialize the database connection
   * @param {Object} config - Configuration object from db-config.js
   */
  async initialize(config) {
    if (config.type === 'firebase') {
      this.implementation = new FirebaseDatabase(config);
    } else if (config.type === 'nodejs') {
      this.implementation = new NodeJSDatabase(config);
    } else if (config.type === 'mongodb') {
      this.implementation = new MongoDBDatabase(config);
    } else if (config.type === 'chrome-storage') {
      // Use chrome.storage directly
      this.implementation = {
        initialize: async () => { console.log('✅ Using chrome.storage'); },
        saveAsins: async (account, category, asins) => {
          const data = await chrome.storage.sync.get(['savedAsins']);
          const savedAsins = data.savedAsins || {};
          if (!savedAsins[account]) savedAsins[account] = {};
          if (!savedAsins[account][category]) savedAsins[account][category] = [];
          const existingSet = new Set(savedAsins[account][category]);
          let newCount = 0;
          asins.forEach(asin => {
            if (!existingSet.has(asin)) { existingSet.add(asin); newCount++; }
          });
          savedAsins[account][category] = Array.from(existingSet);
          await chrome.storage.sync.set({ savedAsins });
          return { success: true, newCount, totalCount: savedAsins[account][category].length };
        },
        getAllAsins: async (accountFilter) => {
          const data = await chrome.storage.sync.get(['savedAsins']);
          const savedAsins = data.savedAsins || {};
          return accountFilter && savedAsins[accountFilter] ? { [accountFilter]: savedAsins[accountFilter] } : savedAsins;
        },
        getAsins: async (account, category) => {
          const data = await chrome.storage.sync.get(['savedAsins']);
          return data.savedAsins?.[account]?.[category] || [];
        },
        deleteCategory: async (account, category) => {
          const data = await chrome.storage.sync.get(['savedAsins']);
          const savedAsins = data.savedAsins || {};
          if (savedAsins[account]?.[category]) {
            delete savedAsins[account][category];
            if (Object.keys(savedAsins[account]).length === 0) delete savedAsins[account];
            await chrome.storage.sync.set({ savedAsins });
          }
          return true;
        },
        getAccounts: async () => {
          const data = await chrome.storage.sync.get(['accounts']);
          return data.accounts || [];
        },
        addAccount: async (account) => {
          const data = await chrome.storage.sync.get(['accounts']);
          const accounts = data.accounts || [];
          if (!accounts.includes(account)) accounts.push(account);
          await chrome.storage.sync.set({ accounts });
          return true;
        },
        getCategories: async () => {
          const data = await chrome.storage.sync.get(['categories']);
          return data.categories || ['console', 'watch strap', 'phone case', 'electronics'];
        },
        addCategory: async (category) => {
          const data = await chrome.storage.sync.get(['categories']);
          const categories = data.categories || [];
          if (!categories.includes(category)) categories.push(category);
          await chrome.storage.sync.set({ categories });
          return true;
        },
        getStats: async () => {
          const data = await chrome.storage.sync.get(['savedAsins']);
          const savedAsins = data.savedAsins || {};
          let totalAsins = 0, accountCount = 0, categoryCount = 0;
          for (const account in savedAsins) {
            accountCount++;
            for (const category in savedAsins[account]) {
              categoryCount++;
              totalAsins += savedAsins[account][category].length;
            }
          }
          return { totalAsins, accountCount, categoryCount };
        }
      };
    }
    
    await this.implementation.initialize();
    console.log(`✅ Database initialized: ${config.type}`);
  }

  /**
   * Save ASINs to a specific account and category
   * @param {string} account - Account name
   * @param {string} category - Category name
   * @param {Array<string>} asins - Array of ASIN strings
   * @returns {Promise<Object>} Result with success status and count of new ASINs
   */
  async saveAsins(account, category, asins) {
    return await this.implementation.saveAsins(account, category, asins);
  }

  /**
   * Get all saved ASINs organized by account and category
   * @param {string} accountFilter - Optional account filter
   * @returns {Promise<Object>} Nested object: {account: {category: [asins]}}
   */
  async getAllAsins(accountFilter = null) {
    return await this.implementation.getAllAsins(accountFilter);
  }

  /**
   * Get ASINs for a specific account and category
   * @param {string} account - Account name
   * @param {string} category - Category name
   * @returns {Promise<Array<string>>} Array of ASINs
   */
  async getAsins(account, category) {
    return await this.implementation.getAsins(account, category);
  }

  /**
   * Delete all ASINs in a category
   * @param {string} account - Account name
   * @param {string} category - Category name
   * @returns {Promise<boolean>} Success status
   */
  async deleteCategory(account, category) {
    return await this.implementation.deleteCategory(account, category);
  }

  /**
   * Get all accounts
   * @returns {Promise<Array<string>>} Array of account names
   */
  async getAccounts() {
    return await this.implementation.getAccounts();
  }

  /**
   * Add a new account
   * @param {string} account - Account name
   * @returns {Promise<boolean>} Success status
   */
  async addAccount(account) {
    return await this.implementation.addAccount(account);
  }

  /**
   * Get all categories
   * @returns {Promise<Array<string>>} Array of category names
   */
  async getCategories() {
    return await this.implementation.getCategories();
  }

  /**
   * Add a new category
   * @param {string} category - Category name
   * @returns {Promise<boolean>} Success status
   */
  async addCategory(category) {
    return await this.implementation.addCategory(category);
  }

  /**
   * Get statistics (total ASINs, accounts, categories)
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    return await this.implementation.getStats();
  }
}

// Make globally available
window.DatabaseService = DatabaseService;

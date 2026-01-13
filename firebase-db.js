/**
 * Firebase Realtime Database Implementation
 * 
 * This implements the DatabaseService interface using Firebase.
 * Uses Firebase Realtime Database for real-time sync and cloud storage.
 */

class FirebaseDatabase {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔥 Starting Firebase initialization...');
      console.log('Firebase config:', this.config.firebase);
      
      // Import Firebase SDK from CDN
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getDatabase, ref, set, get, update, remove, child } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
      
      console.log('✅ Firebase modules loaded');
      
      // Initialize Firebase
      const app = initializeApp(this.config.firebase);
      this.db = getDatabase(app);
      
      console.log('✅ Firebase app initialized');
      console.log('Database URL:', this.config.firebase.databaseURL);
      
      // Store Firebase methods for later use
      this.ref = ref;
      this.set = set;
      this.get = get;
      this.update = update;
      this.remove = remove;
      this.child = child;
      
      this.initialized = true;
      console.log('✅ Firebase initialized successfully - ready to save data!');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      console.error('Error details:', error.message);
      throw new Error('Failed to initialize Firebase: ' + error.message);
    }
  }

  /**
   * Save ASINs to Firebase
   */
  async saveAsins(account, category, asins) {
    try {
      console.log(`💾 Attempting to save ${asins.length} ASINs to ${account}/${category}`);
      
      const path = `asins/${this.sanitizeKey(account)}/${this.sanitizeKey(category)}`;
      console.log('Firebase path:', path);
      
      const dbRef = this.ref(this.db, path);
      
      // Get existing ASINs
      console.log('📖 Reading existing data...');
      const snapshot = await this.get(dbRef);
      const existingAsins = snapshot.exists() ? snapshot.val() : [];
      console.log('Existing ASINs:', existingAsins.length);
      
      // Merge and remove duplicates
      const existingSet = new Set(existingAsins);
      let newCount = 0;
      
      asins.forEach(asin => {
        if (!existingSet.has(asin)) {
          existingSet.add(asin);
          newCount++;
        }
      });
      
      const updatedAsins = Array.from(existingSet);
      console.log(`📝 Saving ${updatedAsins.length} total ASINs (${newCount} new)...`);
      
      // Save to Firebase
      await this.set(dbRef, updatedAsins);
      console.log('✅ ASINs saved to Firebase successfully!');
      
      // Update timestamp
      const metaPath = `meta/${this.sanitizeKey(account)}/${this.sanitizeKey(category)}`;
      await this.set(this.ref(this.db, metaPath), {
        lastUpdated: Date.now(),
        count: updatedAsins.length
      });
      
      return {
        success: true,
        newCount: newCount,
        totalCount: updatedAsins.length
      };
    } catch (error) {
      console.error('❌ Error saving ASINs to Firebase:', error);
      console.error('Error details:', error.message, error.code);
      throw error;
    }
  }

  /**
   * Get all ASINs organized by account and category
   */
  async getAllAsins(accountFilter = null) {
    try {
      const dbRef = this.ref(this.db, 'asins');
      const snapshot = await this.get(dbRef);
      
      if (!snapshot.exists()) {
        return {};
      }
      
      const allData = snapshot.val();
      
      if (accountFilter) {
        const sanitizedAccount = this.sanitizeKey(accountFilter);
        return allData[sanitizedAccount] ? { [accountFilter]: allData[sanitizedAccount] } : {};
      }
      
      return allData;
    } catch (error) {
      console.error('Error getting ASINs:', error);
      throw error;
    }
  }

  /**
   * Get ASINs for specific account and category
   */
  async getAsins(account, category) {
    try {
      const path = `asins/${this.sanitizeKey(account)}/${this.sanitizeKey(category)}`;
      const dbRef = this.ref(this.db, path);
      const snapshot = await this.get(dbRef);
      
      return snapshot.exists() ? snapshot.val() : [];
    } catch (error) {
      console.error('Error getting category ASINs:', error);
      throw error;
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(account, category) {
    try {
      const asinPath = `asins/${this.sanitizeKey(account)}/${this.sanitizeKey(category)}`;
      const metaPath = `meta/${this.sanitizeKey(account)}/${this.sanitizeKey(category)}`;
      
      await this.remove(this.ref(this.db, asinPath));
      await this.remove(this.ref(this.db, metaPath));
      
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts() {
    try {
      const dbRef = this.ref(this.db, 'accounts');
      const snapshot = await this.get(dbRef);
      
      return snapshot.exists() ? snapshot.val() : [];
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  }

  /**
   * Add a new account
   */
  async addAccount(account) {
    try {
      const accounts = await this.getAccounts();
      
      if (!accounts.includes(account)) {
        accounts.push(account);
        await this.set(this.ref(this.db, 'accounts'), accounts);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const dbRef = this.ref(this.db, 'categories');
      const snapshot = await this.get(dbRef);
      
      return snapshot.exists() ? snapshot.val() : ['console', 'watch strap', 'phone case', 'electronics'];
    } catch (error) {
      console.error('Error getting categories:', error);
      return ['console', 'watch strap', 'phone case', 'electronics'];
    }
  }

  /**
   * Add a new category
   */
  async addCategory(category) {
    try {
      const categories = await this.getCategories();
      
      if (!categories.includes(category)) {
        categories.push(category);
        await this.set(this.ref(this.db, 'categories'), categories);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const allAsins = await this.getAllAsins();
      
      let totalAsins = 0;
      let accountCount = 0;
      let categoryCount = 0;
      
      for (const account in allAsins) {
        accountCount++;
        for (const category in allAsins[account]) {
          categoryCount++;
          totalAsins += allAsins[account][category].length;
        }
      }
      
      return {
        totalAsins,
        accountCount,
        categoryCount
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalAsins: 0, accountCount: 0, categoryCount: 0 };
    }
  }

  /**
   * Sanitize Firebase keys (remove invalid characters)
   */
  sanitizeKey(key) {
    return key.replace(/[.#$\[\]]/g, '_');
  }
}

// Make globally available
window.FirebaseDatabase = FirebaseDatabase;

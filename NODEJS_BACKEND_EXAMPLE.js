/**
 * Node.js Backend - Complete Implementation Example
 * 
 * This is a complete working example using Express.js + MongoDB
 * You can adapt this for MySQL, PostgreSQL, or any other database
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(cors());

// ==================== DATABASE SCHEMA ====================

// MongoDB Schema (adapt for SQL databases)
const AsinSchema = new mongoose.Schema({
  account: String,
  category: String,
  asins: [String],
  lastUpdated: { type: Date, default: Date.now },
  count: Number
});

const AccountSchema = new mongoose.Schema({
  name: { type: String, unique: true }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, unique: true }
});

const AsinModel = mongoose.model('Asin', AsinSchema);
const AccountModel = mongoose.model('Account', AccountSchema);
const CategoryModel = mongoose.model('Category', CategorySchema);

// ==================== CONNECT TO DATABASE ====================

mongoose.connect('mongodb://localhost:27017/asin-database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ==================== API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Save ASINs
app.post('/api/asins/save', async (req, res) => {
  try {
    const { account, category, asins } = req.body;

    // Find existing record
    let record = await AsinModel.findOne({ account, category });

    if (record) {
      // Merge ASINs (avoid duplicates)
      const existingSet = new Set(record.asins);
      let newCount = 0;

      asins.forEach(asin => {
        if (!existingSet.has(asin)) {
          existingSet.add(asin);
          newCount++;
        }
      });

      record.asins = Array.from(existingSet);
      record.count = record.asins.length;
      record.lastUpdated = new Date();
      await record.save();

      res.json({
        success: true,
        newCount,
        totalCount: record.asins.length
      });
    } else {
      // Create new record
      record = new AsinModel({
        account,
        category,
        asins,
        count: asins.length
      });
      await record.save();

      res.json({
        success: true,
        newCount: asins.length,
        totalCount: asins.length
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all ASINs
app.get('/api/asins/all', async (req, res) => {
  try {
    const { account } = req.query;

    let query = {};
    if (account) {
      query.account = account;
    }

    const records = await AsinModel.find(query);

    // Transform to nested object structure
    const result = {};
    records.forEach(record => {
      if (!result[record.account]) {
        result[record.account] = {};
      }
      result[record.account][record.category] = record.asins;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific category ASINs
app.get('/api/asins/get', async (req, res) => {
  try {
    const { account, category } = req.query;

    const record = await AsinModel.findOne({ account, category });

    res.json(record ? record.asins : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
app.delete('/api/asins/delete', async (req, res) => {
  try {
    const { account, category } = req.body;

    await AsinModel.deleteOne({ account, category });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await AccountModel.find({});
    res.json(accounts.map(a => a.name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add account
app.post('/api/accounts/add', async (req, res) => {
  try {
    const { account } = req.body;

    const existing = await AccountModel.findOne({ name: account });
    if (existing) {
      return res.json({ success: true, message: 'Already exists' });
    }

    await AccountModel.create({ name: account });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await CategoryModel.find({});
    const defaultCategories = ['console', 'watch strap', 'phone case', 'electronics'];
    
    const allCategories = [...new Set([
      ...defaultCategories,
      ...categories.map(c => c.name)
    ])];

    res.json(allCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add category
app.post('/api/categories/add', async (req, res) => {
  try {
    const { category } = req.body;

    const existing = await CategoryModel.findOne({ name: category });
    if (existing) {
      return res.json({ success: true, message: 'Already exists' });
    }

    await CategoryModel.create({ name: category });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const records = await AsinModel.find({});
    
    let totalAsins = 0;
    const accounts = new Set();
    const categories = new Set();

    records.forEach(record => {
      totalAsins += record.asins.length;
      accounts.add(record.account);
      categories.add(record.category);
    });

    res.json({
      totalAsins,
      accountCount: accounts.size,
      categoryCount: categories.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Install dependencies:
 *    npm install express mongoose cors
 * 
 * 2. Start MongoDB:
 *    mongod --dbpath /path/to/data
 * 
 * 3. Run server:
 *    node server.js
 * 
 * 4. Test endpoints:
 *    curl http://localhost:3000/api/health
 * 
 * 5. Update extension:
 *    - Change db-config.js type to 'nodejs'
 *    - Set apiUrl to your server URL
 * 
 * FOR MYSQL/POSTGRESQL:
 * - Replace mongoose with sequelize
 * - Update schemas to Sequelize models
 * - Adjust queries for SQL syntax
 * 
 * FOR PRODUCTION:
 * - Add authentication middleware
 * - Use environment variables
 * - Enable HTTPS
 * - Add rate limiting
 * - Set up error logging
 */

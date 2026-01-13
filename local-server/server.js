const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'asin_extension';
let db;

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('✅ Connected to MongoDB');
    db = client.db(DB_NAME);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

// ==================== API ENDPOINTS ====================

// POST /api/asins/save
app.post('/api/asins/save', async (req, res) => {
  try {
    const { account, category, asins } = req.body;
    
    if (!account || !category || !Array.isArray(asins)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const collection = db.collection('saved_asins');
    const existing = await collection.findOne({ account, category });

    let newCount = 0;
    let totalCount = 0;

    if (existing) {
      const existingSet = new Set(existing.asins);
      asins.forEach(asin => {
        if (!existingSet.has(asin)) {
          existingSet.add(asin);
          newCount++;
        }
      });

      const updatedAsins = Array.from(existingSet);
      await collection.updateOne(
        { account, category },
        { $set: { asins: updatedAsins, updatedAt: new Date() } }
      );
      totalCount = updatedAsins.length;
    } else {
      await collection.insertOne({
        account,
        category,
        asins,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      newCount = asins.length;
      totalCount = asins.length;
    }

    console.log(`✅ Saved ${newCount} new ASINs to ${account}/${category}`);
    return res.json({ success: true, newCount, totalCount });
  } catch (error) {
    console.error('❌ Save error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/asins/get?account=xxx&category=xxx
app.get('/api/asins/get', async (req, res) => {
  try {
    const { account, category } = req.query;
    
    if (!account || !category) {
      return res.status(400).json({ error: 'Missing account or category' });
    }

    const collection = db.collection('saved_asins');
    const doc = await collection.findOne({ account, category });

    return res.json({ asins: doc?.asins || [] });
  } catch (error) {
    console.error('❌ Get error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/asins/all?account=xxx (optional filter)
app.get('/api/asins/all', async (req, res) => {
  try {
    const { account } = req.query;
    const collection = db.collection('saved_asins');

    const query = account ? { account } : {};
    const docs = await collection.find(query).toArray();

    const data = {};
    docs.forEach(doc => {
      if (!data[doc.account]) data[doc.account] = {};
      data[doc.account][doc.category] = doc.asins;
    });

    return res.json({ data });
  } catch (error) {
    console.error('❌ Get all error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/asins/delete
app.delete('/api/asins/delete', async (req, res) => {
  try {
    const { account, category } = req.body;
    
    if (!account || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const collection = db.collection('saved_asins');
    await collection.deleteOne({ account, category });

    console.log(`🗑️ Deleted ${account}/${category}`);
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const collection = db.collection('saved_asins');
    const accounts = await collection.distinct('account');
    return res.json({ accounts });
  } catch (error) {
    console.error('❌ Get accounts error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/accounts/add
app.post('/api/accounts/add', async (req, res) => {
  return res.json({ success: true });
});

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const collection = db.collection('saved_asins');
    const categories = await collection.distinct('category');
    
    const defaults = ['console', 'watch strap', 'phone case', 'electronics'];
    const all = [...new Set([...defaults, ...categories])];

    return res.json({ categories: all });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/categories/add
app.post('/api/categories/add', async (req, res) => {
  return res.json({ success: true });
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const collection = db.collection('saved_asins');
    const docs = await collection.find({}).toArray();

    let totalAsins = 0;
    const accounts = new Set();
    const categories = new Set();

    docs.forEach(doc => {
      totalAsins += doc.asins.length;
      accounts.add(doc.account);
      categories.add(doc.category);
    });

    return res.json({
      stats: { totalAsins, accountCount: accounts.size, categoryCount: categories.size }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});

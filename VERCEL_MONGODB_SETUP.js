/**
 * MongoDB Backend for Vercel API
 * 
 * Add these endpoints to your Vercel API project
 * Install: npm install mongodb
 */

import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string';
const DB_NAME = 'asin_extension';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

// ==================== API ENDPOINTS ====================

/**
 * POST /api/asins/save
 * Body: { account: string, category: string, asins: string[] }
 */
export async function saveAsins(req, res) {
  try {
    const { account, category, asins } = req.body;

    if (!account || !category || !Array.isArray(asins)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('asins');

    // Find existing document
    const existing = await collection.findOne({ account, category });

    let newCount = 0;
    let totalCount = 0;

    if (existing) {
      // Add new ASINs to existing
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
      // Create new document
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

    return res.status(200).json({
      success: true,
      newCount,
      totalCount,
      message: `Saved ${newCount} new ASINs`
    });
  } catch (error) {
    console.error('Save ASINs error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/asins/get?account=xxx&category=xxx
 */
export async function getAsins(req, res) {
  try {
    const { account, category } = req.query;

    if (!account || !category) {
      return res.status(400).json({ error: 'Missing account or category' });
    }

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('asins');

    const doc = await collection.findOne({ account, category });

    return res.status(200).json({
      asins: doc?.asins || []
    });
  } catch (error) {
    console.error('Get ASINs error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/asins/all?account=xxx (optional filter)
 */
export async function getAllAsins(req, res) {
  try {
    const { account } = req.query;

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('asins');

    const query = account ? { account } : {};
    const docs = await collection.find(query).toArray();

    // Transform to nested object format: { account: { category: [asins] } }
    const data = {};
    docs.forEach(doc => {
      if (!data[doc.account]) {
        data[doc.account] = {};
      }
      data[doc.account][doc.category] = doc.asins;
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Get all ASINs error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/asins/delete
 * Body: { account: string, category: string }
 */
export async function deleteCategory(req, res) {
  try {
    const { account, category } = req.body;

    if (!account || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('asins');

    await collection.deleteOne({ account, category });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/accounts
 */
export async function getAccounts(req, res) {
  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('asins');

    const accounts = await collection.distinct('account');

    return res.status(200).json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/accounts/add
 * Body: { account: string }
 */
export async function addAccount(req, res) {
  try {
    const { account } = req.body;

    if (!account) {
      return res.status(400).json({ error: 'Missing account name' });
    }

    // Account is created automatically when saving ASINs
    // This endpoint just validates the account name
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Add account error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/categories
 */
export async function getCategories(req, res) {
  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('asins');

    const categories = await collection.distinct('category');

    // Include default categories
    const defaultCategories = ['console', 'watch strap', 'phone case', 'electronics'];
    const allCategories = [...new Set([...defaultCategories, ...categories])];

    return res.status(200).json({ categories: allCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/categories/add
 * Body: { category: string }
 */
export async function addCategory(req, res) {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Missing category name' });
    }

    // Category is created automatically when saving ASINs
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Add category error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/stats
 */
export async function getStats(req, res) {
  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('asins');

    const docs = await collection.find({}).toArray();

    let totalAsins = 0;
    const accounts = new Set();
    const categories = new Set();

    docs.forEach(doc => {
      totalAsins += doc.asins.length;
      accounts.add(doc.account);
      categories.add(doc.category);
    });

    return res.status(200).json({
      stats: {
        totalAsins,
        accountCount: accounts.size,
        categoryCount: categories.size
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ==================== SETUP INSTRUCTIONS ====================
/*

1. Install MongoDB:
   npm install mongodb

2. Get MongoDB connection string:
   - Use MongoDB Atlas (free): https://www.mongodb.com/cloud/atlas
   - Create cluster → Connect → Get connection string
   - Example: mongodb+srv://username:password@cluster.mongodb.net/

3. Add to Vercel environment variables:
   - Go to your Vercel project settings
   - Add: MONGODB_URI = your-connection-string

4. Create API routes in your Vercel project:
   
   File structure:
   /api
     /asins
       save.js      → export { saveAsins as default } from './mongodb-backend'
       get.js       → export { getAsins as default } from './mongodb-backend'
       all.js       → export { getAllAsins as default } from './mongodb-backend'
       delete.js    → export { deleteCategory as default } from './mongodb-backend'
     /accounts
       index.js     → export { getAccounts as default } from './mongodb-backend'
       add.js       → export { addAccount as default } from './mongodb-backend'
     /categories
       index.js     → export { getCategories as default } from './mongodb-backend'
       add.js       → export { addCategory as default } from './mongodb-backend'
     stats.js       → export { getStats as default } from './mongodb-backend'

5. Deploy to Vercel:
   vercel --prod

*/

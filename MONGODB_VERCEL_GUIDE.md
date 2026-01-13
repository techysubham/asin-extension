# Add MongoDB to Your Vercel API

## Quick Setup (5 minutes)

### 1. Get MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create FREE cluster
3. Create Database User (username + password)
4. Add IP: `0.0.0.0/0` (allow all)
5. Get connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/asin_extension`

### 2. Add to Your Vercel Project

**In your Vercel project root, create `/api/asins/` folder:**

#### `/api/asins/save.js`
```javascript
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { account, category, asins } = req.body;
    const client = await connectDB();
    const db = client.db('asin_extension');
    const collection = db.collection('saved_asins');

    const existing = await collection.findOne({ account, category });
    
    if (existing) {
      const existingSet = new Set(existing.asins);
      let newCount = 0;
      asins.forEach(asin => {
        if (!existingSet.has(asin)) {
          existingSet.add(asin);
          newCount++;
        }
      });
      
      await collection.updateOne(
        { account, category },
        { $set: { asins: Array.from(existingSet), updatedAt: new Date() } }
      );
      
      return res.json({ success: true, newCount, totalCount: existingSet.size });
    } else {
      await collection.insertOne({ account, category, asins, createdAt: new Date() });
      return res.json({ success: true, newCount: asins.length, totalCount: asins.length });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### `/api/asins/all.js`
```javascript
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  try {
    const { account } = req.query;
    const client = await connectDB();
    const db = client.db('asin_extension');
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
    return res.status(500).json({ error: error.message });
  }
}
```

#### `/api/asins/get.js`
```javascript
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  try {
    const { account, category } = req.query;
    const client = await connectDB();
    const db = client.db('asin_extension');
    const doc = await db.collection('saved_asins').findOne({ account, category });

    return res.json({ asins: doc?.asins || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### `/api/asins/delete.js`
```javascript
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { account, category } = req.body;
    const client = await connectDB();
    const db = client.db('asin_extension');
    await db.collection('saved_asins').deleteOne({ account, category });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### `/api/accounts.js`
```javascript
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  try {
    const client = await connectDB();
    const db = client.db('asin_extension');
    const accounts = await db.collection('saved_asins').distinct('account');

    return res.json({ accounts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### `/api/accounts/add.js`
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return res.json({ success: true });
}
```

#### `/api/categories.js`
```javascript
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  try {
    const client = await connectDB();
    const db = client.db('asin_extension');
    const categories = await db.collection('saved_asins').distinct('category');
    
    const defaults = ['console', 'watch strap', 'phone case', 'electronics'];
    const all = [...new Set([...defaults, ...categories])];

    return res.json({ categories: all });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### `/api/categories/add.js`
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return res.json({ success: true });
}
```

#### `/api/stats.js`
```javascript
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  try {
    const client = await connectDB();
    const db = client.db('asin_extension');
    const docs = await db.collection('saved_asins').find({}).toArray();

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
    return res.status(500).json({ error: error.message });
  }
}
```

### 3. Install MongoDB in Your Vercel Project
```bash
npm install mongodb
```

### 4. Add Environment Variable in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://username:password@cluster.mongodb.net/asin_extension`

### 5. Deploy
```bash
git add .
git commit -m "Add MongoDB storage"
git push
```

Vercel will auto-deploy!

### 6. Test
1. Reload your Chrome extension
2. Collect some ASINs
3. Click "Save ASINs to Category"
4. Check MongoDB Atlas → Browse Collections → You'll see your data!

---

## Extension is Already Configured ✅
Your extension is pointing to `https://amazon-helper.vercel.app/api` and will automatically use these new endpoints!

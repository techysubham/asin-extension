# Local MongoDB Server Setup

## Quick Start (5 minutes)

### Step 1: Install MongoDB
**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Run installer → Complete installation
3. MongoDB will auto-start as a Windows service

**Or use MongoDB Compass (GUI):**
Download: https://www.mongodb.com/try/download/compass

### Step 2: Install Server Dependencies
Open terminal in this folder (`local-server`) and run:
```bash
npm install
```

### Step 3: Start the Server
```bash
npm start
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:3000
📊 API: http://localhost:3000/api
```

### Step 4: Update Extension Config
The extension config is already set! Just reload your extension in Chrome.

### Step 5: Test
1. Open Chrome extension
2. Collect ASINs from Amazon
3. Click "Save ASINs to Category"
4. Check MongoDB:
   - Open MongoDB Compass
   - Connect to `mongodb://localhost:27017`
   - Database: `asin_extension`
   - Collection: `saved_asins`
   - You'll see your saved ASINs!

---

## Commands

**Start server:**
```bash
npm start
```

**Start with auto-reload (development):**
```bash
npm run dev
```

**Stop server:**
Press `Ctrl+C` in the terminal

---

## Troubleshooting

**MongoDB not running?**
```bash
# Check if MongoDB is running
net start MongoDB

# Or start it manually
mongod
```

**Port 3000 already in use?**
Edit `server.js` line 5:
```javascript
const PORT = 3001; // Change to any available port
```

Then update extension config to `http://localhost:3001/api`

---

## View Your Data

**Option 1: MongoDB Compass (GUI)**
1. Open MongoDB Compass
2. Connect: `mongodb://localhost:27017`
3. Browse: `asin_extension` → `saved_asins`

**Option 2: Command Line**
```bash
mongosh
use asin_extension
db.saved_asins.find().pretty()
```

**Option 3: In Extension**
Click "View Saved ASINs" button in the extension!

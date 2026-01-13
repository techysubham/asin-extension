# Amazon ASIN Exporter - Database Integration Guide

## 🎉 Database Features Added!

Your extension now supports cloud database storage with easy switching between Firebase and Node.js backends.

## 📁 Files Created

- **db-service.js** - Abstraction layer (works with any backend)
- **firebase-db.js** - Firebase implementation
- **nodejs-db.js** - Node.js template (for future migration)
- **db-config.js** - Configuration file (switch backends here)

## 🚀 Quick Start with Firebase

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the wizard
3. Once created, click "Add app" → Choose Web (</> icon)
4. Copy the Firebase configuration object

### Step 2: Configure Extension

Open `db-config.js` and replace the Firebase config:

```javascript
firebase: {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
}
```

### Step 3: Setup Database

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Start in **test mode** (for development)
4. Rules will be:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **Production**: Add authentication and proper security rules!

### Step 4: Load Extension

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your extension folder
5. Test it on Amazon!

## ✅ Features

- ✨ **Cloud Storage**: ASINs saved to Firebase cloud database
- 🔄 **Real-time Sync**: Access your data from anywhere
- 📊 **Organized**: Store by Account → Category
- 🔒 **Secure**: Can add authentication later
- 🚀 **Fast**: Optimized queries and caching

## 🔄 Switching to Node.js Backend (Future)

When you're ready to switch to your own Node.js server:

### Step 1: Update Config

Open `db-config.js` and change:

```javascript
// Change this line
type: 'nodejs',  // was 'firebase'

// Update Node.js config
nodejs: {
  apiUrl: "https://your-domain.com/api",
  // or local: "http://localhost:3000/api"
  apiKey: "your-api-key"
}
```

### Step 2: Implement Backend

The `nodejs-db.js` file already has the interface. Just create your Node.js endpoints:

```javascript
// Example Express.js server
app.post('/api/asins/save', async (req, res) => {
  const { account, category, asins } = req.body;
  // Save to your database (MySQL, PostgreSQL, MongoDB, etc.)
  await yourDatabase.save(account, category, asins);
  res.json({ success: true });
});

// Implement other endpoints (see nodejs-db.js for full list)
```

### Step 3: That's It!

No changes needed in popup.js or other files. The abstraction layer handles everything!

## 📊 Database Structure

### Firebase Structure
```
/asins/
  /account1/
    /console/
      - [ASIN1, ASIN2, ...]
    /watch-strap/
      - [ASIN3, ASIN4, ...]
  /account2/
    /phone-case/
      - [ASIN5, ASIN6, ...]

/accounts/
  - [account1, account2, ...]

/categories/
  - [console, watch strap, phone case, ...]

/meta/
  /account1/
    /console/
      - lastUpdated: timestamp
      - count: 150
```

## 🔐 Security Best Practices

### For Production:

1. **Enable Firebase Authentication**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

2. **Add User-based Rules**
```json
{
  "rules": {
    "asins": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

3. **Restrict API Access**
- Add API key validation
- Use environment variables
- Implement rate limiting

## 🐛 Troubleshooting

### "Database initialization failed"
- Check Firebase config in `db-config.js`
- Verify Firebase project is active
- Check browser console for errors
- Extension falls back to chrome.storage automatically

### "Permission denied"
- Update Firebase database rules
- Check if database URL is correct
- Ensure Realtime Database is enabled (not Firestore)

### Module import errors
- Clear browser cache
- Reload extension
- Check manifest.json permissions

## 💾 Data Migration

To migrate data from chrome.storage to Firebase:

1. Export existing data from chrome.storage
2. Run this in console:
```javascript
chrome.storage.sync.get(['savedAsins'], async (data) => {
  if (data.savedAsins) {
    // Upload to Firebase
    for (const [account, categories] of Object.entries(data.savedAsins)) {
      for (const [category, asins] of Object.entries(categories)) {
        await dbService.saveAsins(account, category, asins);
      }
    }
  }
});
```

## 📈 Scalability

### Current Limits:
- **Firebase Free Tier**: 1GB storage, 10GB/month bandwidth
- **Chrome Storage**: 100KB sync limit

### When to Upgrade:
- Save > 10,000 ASINs
- Need multi-device sync
- Want advanced querying
- Require team collaboration

## 🎯 Next Steps

1. ✅ Set up Firebase (5 minutes)
2. ✅ Test the extension
3. 📝 Build your Node.js backend (when ready)
4. 🔄 Switch to Node.js (1 line change in config)

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Verify Firebase config
3. Test with simple query first
4. Review error messages

## 🎨 Customization

You can customize:
- Default categories in `db-config.js`
- Database structure in `firebase-db.js`
- API endpoints in `nodejs-db.js`
- UI in `popup.html` and `popup.css`

---

**Happy ASIN Collecting! 🚀**

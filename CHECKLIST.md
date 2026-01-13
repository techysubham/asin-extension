# ✅ Setup Checklist

## Pre-Flight Check

- [ ] Chrome browser installed
- [ ] Internet connection active
- [ ] Google account ready (for Firebase)

---

## 🔥 Firebase Setup (Recommended First)

### Firebase Console
- [ ] Go to https://console.firebase.google.com/
- [ ] Create new project named "asin-extension"
- [ ] Disable Google Analytics (optional)
- [ ] Wait for project creation (~30 seconds)

### Get Config
- [ ] Click "Add app" → Web (</>)
- [ ] Register app name: "ASIN Extension"
- [ ] Copy the config object (apiKey, authDomain, etc.)
- [ ] Don't close this window yet!

### Enable Database
- [ ] Left sidebar → "Realtime Database"
- [ ] Click "Create Database"
- [ ] Select region closest to you
- [ ] Choose "Start in test mode"
- [ ] Click "Enable"
- [ ] Database URL should show (e.g., https://xxx.firebaseio.com)

### Configure Extension
- [ ] Open `db-config.js` in your editor
- [ ] Find lines 15-23 (firebase config)
- [ ] Replace with YOUR config from Firebase console
- [ ] Save the file
- [ ] **Double-check:** No syntax errors, all quotes match

---

## 🧩 Extension Installation

### Load in Chrome
- [ ] Open Chrome
- [ ] Navigate to `chrome://extensions/`
- [ ] Enable "Developer mode" (toggle top-right)
- [ ] Click "Load unpacked"
- [ ] Select your extension folder
- [ ] Extension icon appears in toolbar

### Verify Installation
- [ ] Extension shows in extensions list
- [ ] No errors in console
- [ ] Icon is visible in toolbar
- [ ] Can click icon to open popup

---

## 🧪 Test Basic Features

### Test 1: Extension Opens
- [ ] Click extension icon
- [ ] Popup window appears
- [ ] All buttons visible
- [ ] No error messages

### Test 2: Navigate to Amazon
- [ ] Open Amazon.com (or your country)
- [ ] Search for any product (e.g., "phone case")
- [ ] Search results page loads
- [ ] Extension icon still works

### Test 3: Collect ASINs
- [ ] Click extension icon
- [ ] Click "Quick Collect" or "Apply Filter"
- [ ] Wait for collection to complete
- [ ] ASINs appear in text box
- [ ] Count shows (e.g., "50 ASINs")

---

## 💾 Test Database Features

### Test 4: Add Account
- [ ] In extension popup, find "Account:" dropdown
- [ ] Click "+ Add" button
- [ ] Enter account name (e.g., "MyStore")
- [ ] Click OK
- [ ] Account appears in dropdown
- [ ] Success message shows

### Test 5: Select Category
- [ ] Find "Category:" dropdown
- [ ] See default categories (console, watch strap, etc.)
- [ ] Select one (e.g., "console")
- [ ] Category is selected

### Test 6: Save ASINs
- [ ] Ensure ASINs are collected (from Test 3)
- [ ] Select account and category
- [ ] Click "Save ASINs to Category"
- [ ] Success message: "Saved X ASINs to..."
- [ ] No errors in browser console (F12)

### Test 7: Verify in Firebase
- [ ] Go back to Firebase console
- [ ] Click "Realtime Database" in left sidebar
- [ ] Should see /asins/ node
- [ ] Expand to see your account
- [ ] Expand to see your category
- [ ] ASINs are listed there
- [ ] ✅ **DATA IS IN THE CLOUD!**

### Test 8: View Saved ASINs
- [ ] In extension, click "View Saved ASINs"
- [ ] Your account and category appear
- [ ] ASIN count is correct
- [ ] Can see preview of ASINs
- [ ] No errors

### Test 9: Export
- [ ] Check the checkbox next to your category
- [ ] Click "Export Selected"
- [ ] Success message appears
- [ ] Can paste clipboard (Ctrl+V) - data is there
- [ ] Format is correct: === Account > Category ===

### Test 10: Delete Category
- [ ] In "View Saved ASINs"
- [ ] Find a test category
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] Category disappears
- [ ] Success message shows
- [ ] Check Firebase console - data is gone

---

## 🔍 Troubleshooting Checks

### If Database Fails
- [ ] Check browser console (F12) for errors
- [ ] Verify Firebase config in `db-config.js`
- [ ] Check Firebase project is active
- [ ] Verify internet connection
- [ ] Extension falls back to chrome.storage (check if data saves locally)

### If Extension Doesn't Load
- [ ] Check `chrome://extensions/` for errors
- [ ] Click "Details" → "Errors" to see details
- [ ] Verify all files are present in folder
- [ ] Try reloading extension (reload button)
- [ ] Check manifest.json is valid JSON

### If ASINs Don't Collect
- [ ] Verify you're on Amazon search results page
- [ ] Check browser console for errors
- [ ] Try refreshing Amazon page
- [ ] Reload extension
- [ ] Try "Get All ASINs" instead of filtered

---

## 🎯 Advanced Features Check

### Test Filters
- [ ] Set minimum rating (e.g., 5.0)
- [ ] Set minimum purchases (e.g., 100)
- [ ] Enable "Amazon shipping only"
- [ ] Click "Quick Collect"
- [ ] Verify only matching products collected
- [ ] Check console logs for filter details

### Test Multiple Pages
- [ ] Set "Number of pages" to 3
- [ ] Click "Quick Collect"
- [ ] Watch status: "Page 1/3...", "Page 2/3...", etc.
- [ ] Collection completes
- [ ] ASINs from multiple pages collected

### Test Account Filter
- [ ] Create multiple accounts
- [ ] Save ASINs to different accounts
- [ ] In "View Saved ASINs", use "Filter by Account" dropdown
- [ ] Select specific account
- [ ] Only that account's data shows
- [ ] Switch to "All Accounts"
- [ ] All data shows again

---

## 📊 Performance Check

### Response Times
- [ ] Quick Collect: < 10 seconds for 5 pages
- [ ] Save to database: < 2 seconds
- [ ] Load saved ASINs: < 1 second
- [ ] Export: Instant

### Data Accuracy
- [ ] Collected ASIN count matches what's shown
- [ ] No duplicate ASINs in same category
- [ ] ASINs are valid format (10 characters, alphanumeric)
- [ ] Saved data matches collected data

---

## 🔐 Security Check

### Firebase Rules (Development)
- [ ] In Firebase console → Realtime Database → Rules
- [ ] Should see: `.read: true, .write: true`
- [ ] ⚠️ **This is OK for testing only!**
- [ ] 📝 Note: Change for production

### Extension Permissions
- [ ] Review manifest.json permissions
- [ ] All permissions necessary
- [ ] No excessive permissions
- [ ] Host permissions limited to Amazon domains

---

## 📝 Documentation Check

- [ ] Read `QUICK_START.md`
- [ ] Skim `DATABASE_SETUP.md`
- [ ] Understand `ARCHITECTURE.md` basics
- [ ] Bookmark `IMPLEMENTATION_SUMMARY.md` for later

---

## 🎓 Knowledge Check

### You Should Now Know:
- [ ] How to collect ASINs from Amazon
- [ ] How to save ASINs by account/category
- [ ] Where data is stored (Firebase)
- [ ] How to view and export saved data
- [ ] How to add accounts and categories
- [ ] Where to find Firebase data

### For Later:
- [ ] How to switch to Node.js (see db-config.js)
- [ ] How to add authentication
- [ ] How to customize categories
- [ ] How to build your own backend

---

## ✅ Final Verification

### Everything Working If:
- ✅ Extension loads without errors
- ✅ Can collect ASINs from Amazon
- ✅ Can save ASINs to categories
- ✅ Data appears in Firebase console
- ✅ Can view saved data in extension
- ✅ Can export data to clipboard
- ✅ Can add accounts and categories
- ✅ Can delete categories

### You're Ready for Production When:
- ✅ All tests above pass
- ✅ Firebase authentication added
- ✅ Security rules updated
- ✅ Tested with real Amazon searches
- ✅ Exported data successfully used
- ✅ Multiple accounts/categories working

---

## 🚀 Next Steps

### Immediate:
- [ ] Collect ASINs from real Amazon searches
- [ ] Organize by multiple accounts
- [ ] Use different categories
- [ ] Export and use data

### This Week:
- [ ] Add Firebase authentication (see DATABASE_SETUP.md)
- [ ] Update security rules for production
- [ ] Customize default categories
- [ ] Add more accounts

### When Ready to Scale:
- [ ] Review NODEJS_BACKEND_EXAMPLE.js
- [ ] Plan your database schema
- [ ] Build Node.js backend
- [ ] Test locally
- [ ] Switch db-config.js to 'nodejs'
- [ ] Deploy to production

---

## 📞 Support Resources

- 🔥 Firebase Issues: https://firebase.google.com/support
- 📚 Extension Docs: See DATABASE_SETUP.md
- 🏗️ Architecture: See ARCHITECTURE.md
- 💻 Backend Code: See NODEJS_BACKEND_EXAMPLE.js
- ⚡ Quick Help: See QUICK_START.md

---

## 🎉 Congratulations!

If you've checked all the boxes above, you have:
- ✅ Fully functional ASIN collection extension
- ✅ Cloud database integration
- ✅ Account and category organization
- ✅ Export functionality
- ✅ Ready to scale architecture

**Now go collect some ASINs! 🚀**

---

Last Updated: January 2026
Version: 2.0.0

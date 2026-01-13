/**
 * Database Configuration
 * 
 * Switch between Firebase and Node.js by changing the 'type' field.
 * 
 * IMPORTANT: 
 * 1. For Firebase: Add your Firebase config below
 * 2. For Node.js: Change type to 'nodejs' and set your API URL
 */

const DB_CONFIG = {
  // ==================== CURRENT DATABASE ====================
  // Change this to switch backends: 'firebase' or 'nodejs' or 'chrome-storage' or 'mongodb'
  type: 'chrome-storage', // Using chrome.storage
  
  // ==================== FIREBASE CONFIG ====================
  firebase: {
    // TODO: Replace with your Firebase project credentials
    // Get these from: Firebase Console → Project Settings → Your apps → Web app
    apiKey: "AIzaSyBJlTjdEsUIWDz2b7VTCX51wnnrVCff9pM",
  authDomain: "asin-extension.firebaseapp.com",
  projectId: "asin-extension",
  storageBucket: "asin-extension.firebasestorage.app",
  messagingSenderId: "818607823968",
  appId: "1:818607823968:web:34b04adea45841f584f705",
  measurementId: "G-GPVBN6NFFY"
  },
  
  // ==================== MONGODB API CONFIG ====================
  mongodb: {
    // Local MongoDB server
    apiUrl: "http://localhost:3000/api",
    
    // Endpoints
    endpoints: {
      saveAsins: "/asins/save",
      getAsins: "/asins/get",
      getAllAsins: "/asins/all",
      deleteCategory: "/asins/delete",
      getAccounts: "/accounts",
      addAccount: "/accounts/add",
      getCategories: "/categories",
      addCategory: "/categories/add",
      getStats: "/stats"
    }
  },
  
  // ==================== NODE.JS API CONFIG ====================
  nodejs: {
    // Your existing API endpoint
    apiUrl: "https://amazon-helper.vercel.app/api",
    
    // Endpoints
    endpoints: {
      saveAsins: "/asins/save",
      getAsins: "/asins/get",
      getAllAsins: "/asins/all",
      deleteCategory: "/asins/delete",
      getAccounts: "/accounts",
      addAccount: "/accounts/add",
      getCategories: "/categories",
      addCategory: "/categories/add",
      getStats: "/stats"
    }
  }
};

/**
 * HOW TO SWITCH FROM FIREBASE TO NODE.JS:
 * 
 * 1. Change DB_CONFIG.type from 'firebase' to 'nodejs'
 * 2. Update DB_CONFIG.nodejs.apiUrl with your server URL
 * 3. Create nodejs-db.js (template provided below)
 * 4. That's it! The extension will automatically use your Node.js backend
 * 
 * No changes needed in popup.js or other extension files!
 */

/**
 * FIREBASE SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Click "Add app" → Choose "Web" (</> icon)
 * 4. Copy the config object and paste above
 * 5. Go to "Realtime Database" → Create database
 * 6. Set rules to test mode (or configure auth):
 *    {
 *      "rules": {
 *        ".read": true,
 *        ".write": true
 *      }
 *    }
 * 
 * For production, add authentication and proper security rules!
 */

// Make globally available (no export for Chrome extension)
window.DB_CONFIG = DB_CONFIG;

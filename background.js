// Background service worker for Chrome extension
console.log('Amazon ASIN Filter Extension loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Set default settings
    chrome.storage.sync.set({
      minRating: 4.0,
      minPurchases: 50,
      excludeBrand: 'Otterbox',
      maxDeliveryDays: 8,
      amazonShipping: true,
      inStockOnly: true,
      searchSponsoredOnly: true,
      brandFilter: true,
      autoApply: false
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ settings });
    });
    return true;
  }
  
  if (request.action === 'updateSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle toolbar icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
});

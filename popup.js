// Database service instance
const dbService = new DatabaseService();
let dbInitialized = false;

// Initialize database on page load
async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    console.log('Initializing database with config:', DB_CONFIG.type);
    await dbService.initialize(DB_CONFIG);
    dbInitialized = true;
    console.log('✅ Database service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('Error details:', error.message, error.stack);
    dbInitialized = false;
  }
}

// Ensure content script is loaded
async function ensureContentScriptLoaded(tabId) {
  // Try to ping multiple times
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      if (response && response.ready) {
        console.log('Content script is ready');
        return true;
      }
    } catch (error) {
      console.log(`Ping attempt ${attempt} failed:`, error.message);
      
      // Content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ['content.css']
        });
        
        console.log('Scripts injected, waiting...');
        // Wait longer for script to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to ping again
        try {
          const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
          if (response && response.ready) {
            console.log('Content script ready after injection');
            return true;
          }
        } catch (pingError) {
          console.log('Ping failed after injection:', pingError.message);
          if (attempt < 5) {
            console.log('Retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
      } catch (injectError) {
        console.error('Injection error:', injectError);
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }
  }
  console.error('Failed to load content script after 5 attempts');
  return false;
}

// Build Amazon filter URL
function buildAmazonFilterUrl(baseUrl, filters) {
  const url = new URL(baseUrl);
  const params = new URLSearchParams(url.search);
  
  // Note: Rating filter is applied by content script, not via URL parameter
  // The Amazon URL parameter 'p_72:1318476011' can be unreliable
  
  // Add Prime/Amazon shipping filter
  if (filters.amazonShipping) {
    params.set('prime', 'true');
  }
  
  // Add in-stock filter
  if (filters.inStockOnly) {
    params.set('availability', '1');
  }
  
  url.search = params.toString();
  return url.toString();
}

// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.sync.get([
    'searchKeywords',
    'brandFilter',
    'excludeBrand',
    'minRating',
    'minPurchases',
    'amazonShipping',
    'inStockOnly',
    'maxDeliveryDays',
    'searchSponsoredOnly'
  ]);

  if (settings.searchKeywords) {
    document.getElementById('searchKeywords').value = settings.searchKeywords;
  }
  if (settings.brandFilter !== undefined) {
    document.getElementById('brandFilter').checked = settings.brandFilter;
  }
  if (settings.excludeBrand) {
    document.getElementById('excludeBrand').value = settings.excludeBrand;
  }
  if (settings.minRating) {
    document.getElementById('minRating').value = settings.minRating;
  }
  if (settings.minPurchases !== undefined) {
    document.getElementById('minPurchases').value = settings.minPurchases;
  }
  if (settings.amazonShipping !== undefined) {
    document.getElementById('amazonShipping').checked = settings.amazonShipping;
  }
  if (settings.inStockOnly !== undefined) {
    document.getElementById('inStockOnly').checked = settings.inStockOnly;
  }
  if (settings.maxDeliveryDays) {
    document.getElementById('maxDeliveryDays').value = settings.maxDeliveryDays;
  }
  if (settings.searchSponsoredOnly !== undefined) {
    document.getElementById('searchSponsoredOnly').checked = settings.searchSponsoredOnly;
  }
});

// Apply filter button
document.getElementById('applyFilter').addEventListener('click', async () => {
  showStatus('Initializing...', 'info');
  
  const filterConfig = {
    searchKeywords: document.getElementById('searchKeywords').value.trim(),
    brandFilter: document.getElementById('brandFilter').checked,
    excludeBrand: document.getElementById('excludeBrand').value.trim().toLowerCase(),
    minRating: parseFloat(document.getElementById('minRating').value),
    minPurchases: parseInt(document.getElementById('minPurchases').value),
    amazonShipping: document.getElementById('amazonShipping').checked,
    inStockOnly: document.getElementById('inStockOnly').checked,
    maxDeliveryDays: parseInt(document.getElementById('maxDeliveryDays').value),
    searchSponsoredOnly: document.getElementById('searchSponsoredOnly').checked
  };

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('amazon.')) {
    showStatus('Please navigate to an Amazon page first', 'error');
    return;
  }

  // Ensure content script is loaded
  const scriptLoaded = await ensureContentScriptLoaded(tab.id);
  if (!scriptLoaded) {
    showStatus('Failed to load extension on this page. Try refreshing the page.', 'error');
    return;
  }
  
  showStatus('Scrolling page to load all products...', 'info');

  // Send message to content script
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'applyFilter',
      config: filterConfig
    });
    
    if (response && response.asins && response.asins.length > 0) {
      displayResults(response.asins);
      showStatus(`Found ${response.asins.length} matching products`, 'success');
    } else if (response && response.asins && response.asins.length === 0) {
      showStatus('No products matched the filter criteria. Try "Get All ASINs" to see all products.', 'info');
      console.log('All products were filtered out. Check browser console for details.');
    } else {
      showStatus('No products found on page. Make sure you are on an Amazon search results page.', 'error');
    }
  } catch (error) {
    console.error('Extension error:', error);
    showStatus('Error: ' + error.message + '. Try refreshing the page and reopening the extension.', 'error');
  }
});

// Get all ASINs button (no filtering)
document.getElementById('getAllAsins').addEventListener('click', async () => {
  showStatus('Initializing...', 'info');
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('amazon.')) {
    showStatus('Please navigate to an Amazon page first', 'error');
    return;
  }

  // Ensure content script is loaded
  const scriptLoaded = await ensureContentScriptLoaded(tab.id);
  if (!scriptLoaded) {
    showStatus('Failed to load extension on this page. Try refreshing the page.', 'error');
    return;
  }
  
  showStatus('Scrolling page to load all products...', 'info');

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'getAllAsins'
    });
    
    if (response && response.asins && response.asins.length > 0) {
      displayResults(response.asins);
      showStatus(`Found ${response.asins.length} total ASINs on page`, 'success');
    } else {
      showStatus('No ASINs found on page.', 'error');
    }
  } catch (error) {
    console.error('Extension error:', error);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Collect from multiple pages
document.getElementById('collectMultiplePages').addEventListener('click', async () => {
  const maxPages = parseInt(document.getElementById('maxPages').value);
  
  if (maxPages < 1 || maxPages > 50) {
    showStatus('Please enter a number between 1 and 50', 'error');
    return;
  }
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('amazon.')) {
    showStatus('Please navigate to an Amazon page first', 'error');
    return;
  }

  // Ensure content script is loaded
  showStatus('Initializing...', 'info');
  const scriptLoaded = await ensureContentScriptLoaded(tab.id);
  if (!scriptLoaded) {
    showStatus('Failed to load extension on this page. Try refreshing the page.', 'error');
    return;
  }

  showStatus(`Collecting ASINs from up to ${maxPages} pages... This may take a while.`, 'info');
  
  // Get filter config if user wants filtering
  const applyFilters = confirm(`Collect ASINs with current filter settings?\n\nClick OK to apply filters\nClick Cancel to collect ALL ASINs`);
  
  const filterConfig = applyFilters ? {
    brandFilter: document.getElementById('brandFilter').checked,
    excludeBrand: document.getElementById('excludeBrand').value.trim().toLowerCase(),
    minRating: parseFloat(document.getElementById('minRating').value),
    minPurchases: parseInt(document.getElementById('minPurchases').value),
    amazonShipping: document.getElementById('amazonShipping').checked,
    inStockOnly: document.getElementById('inStockOnly').checked,
    maxDeliveryDays: parseInt(document.getElementById('maxDeliveryDays').value),
    searchSponsoredOnly: document.getElementById('searchSponsoredOnly').checked
  } : null;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'collectMultiplePages',
      config: filterConfig,
      maxPages: maxPages
    });
    
    if (response && response.asins && response.asins.length > 0) {
      displayResults(response.asins);
      const filterText = applyFilters ? 'matching' : 'total';
      showStatus(`✓ Collected ${response.asins.length} ${filterText} ASINs from ${response.pagesProcessed} page(s)`, 'success');
    } else if (response && response.error) {
      showStatus(`Error: ${response.error}. Collected ${response.asins?.length || 0} ASINs from ${response.pagesProcessed} pages.`, 'error');
      if (response.asins && response.asins.length > 0) {
        displayResults(response.asins);
      }
    } else {
      showStatus('No ASINs found.', 'error');
    }
  } catch (error) {
    console.error('Extension error:', error);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Quick collect (fast mode)
document.getElementById('quickCollect').addEventListener('click', async () => {
  const maxPages = parseInt(document.getElementById('maxPages').value);
  
  if (maxPages < 1 || maxPages > 50) {
    showStatus('Please enter a number between 1 and 50', 'error');
    return;
  }
  
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('amazon.')) {
    showStatus('Please navigate to an Amazon page first', 'error');
    return;
  }

  // Get filter settings
  const filterConfig = {
    searchKeywords: document.getElementById('searchKeywords').value.trim(),
    minRating: parseFloat(document.getElementById('minRating').value),
    amazonShipping: document.getElementById('amazonShipping').checked,
    inStockOnly: document.getElementById('inStockOnly').checked,
    excludeBrand: document.getElementById('excludeBrand').value.trim().toLowerCase()
  };

  // Do NOT modify or navigate to a new URL. Only work with the current search results page.

  // Ensure content script is loaded
  showStatus('Initializing...', 'info');
  const scriptLoaded = await ensureContentScriptLoaded(tab.id);
  if (!scriptLoaded) {
    showStatus('❌ Failed to initialize. Please refresh the page (F5) and try again.', 'error');
    console.error('Content script failed to load after 5 attempts');
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'quickCollect',
      maxPages: maxPages,
      excludeBrand: filterConfig.excludeBrand,
      searchKeywords: filterConfig.searchKeywords,
      minRating: filterConfig.minRating || 0,
      maxDeliveryDays: parseInt(document.getElementById('maxDeliveryDays').value) || 0
    });
    
    if (response && response.asins && response.asins.length > 0) {
      displayResults(response.asins);
      const timeMsg = response.timeSeconds ? ` in ${response.timeSeconds}s` : '';
      showStatus(`⚡ Collected ${response.asins.length} ASINs from ${response.pagesProcessed} page(s)${timeMsg}`, 'success');
    } else if (response && response.error) {
      showStatus(`${response.error}`, 'error');
      if (response.error.includes('No results')) {
        setTimeout(() => {
          showStatus('💡 Try: "phone case", "iphone 14 case", "samsung case" instead', 'info');
        }, 3000);
      }
      if (response.asins && response.asins.length > 0) {
        displayResults(response.asins);
      }
    } else {
      showStatus('No ASINs found.', 'error');
    }
  } catch (error) {
    console.error('Extension error:', error);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Clear filter button
document.getElementById('clearFilter').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('amazon.')) {
    showStatus('Please navigate to an Amazon page first', 'error');
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'clearFilter'
    });
    showStatus('Filter cleared', 'info');
  } catch (error) {
    showStatus('Error clearing filter. Try refreshing the page.', 'error');
  }
});

// Save settings button
document.getElementById('saveSettings').addEventListener('click', async () => {
  const settings = {
    searchKeywords: document.getElementById('searchKeywords').value.trim(),
    brandFilter: document.getElementById('brandFilter').checked,
    excludeBrand: document.getElementById('excludeBrand').value.trim(),
    minRating: document.getElementById('minRating').value,
    minPurchases: document.getElementById('minPurchases').value,
    amazonShipping: document.getElementById('amazonShipping').checked,
    inStockOnly: document.getElementById('inStockOnly').checked,
    maxDeliveryDays: document.getElementById('maxDeliveryDays').value,
    searchSponsoredOnly: document.getElementById('searchSponsoredOnly').checked
  };

  await chrome.storage.sync.set(settings);
  showStatus('Settings saved successfully!', 'success');
});

// Display results
function displayResults(asins) {
  const resultsSection = document.getElementById('results');
  const asinOutput = document.getElementById('asinOutput');
  const asinCount = document.getElementById('asinCount');
  const exportBtn = document.getElementById('exportAsins');
  const saveSection = document.getElementById('saveSection');
  const saveToCategoryBtn = document.getElementById('saveToCategory');
  
  asinOutput.value = asins.join('\n');
  asinCount.textContent = asins.length;
  resultsSection.style.display = 'block';
  saveSection.style.display = 'block';
  exportBtn.disabled = false;
  saveToCategoryBtn.disabled = false;
  
  // Store ASINs for export and saving
  window.currentAsins = asins;
  currentAsins = asins;
}

// Export ASINs button
document.getElementById('exportAsins').addEventListener('click', () => {
  if (!window.currentAsins || window.currentAsins.length === 0) {
    showStatus('No ASINs to export', 'error');
    return;
  }
  
  const content = window.currentAsins.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const filename = `amazon_asins_${new Date().toISOString().split('T')[0]}.txt`;
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      showStatus('Export failed: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatus('ASINs exported successfully!', 'success');
    }
    // Clean up the blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  });
});

// Copy ASINs button
document.getElementById('copyAsins').addEventListener('click', async () => {
  const asinOutput = document.getElementById('asinOutput');
  try {
    await navigator.clipboard.writeText(asinOutput.value);
    showStatus('ASINs copied to clipboard!', 'success');
  } catch (error) {
    // Fallback for older browsers
    asinOutput.select();
    document.execCommand('copy');
    showStatus('ASINs copied to clipboard!', 'success');
  }
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status show ${type}`;
  
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

// ==================== Account & Category Management ====================

let currentAsins = [];

// Load accounts and categories on page load
async function loadAccountsAndCategories() {
  // Ensure database is initialized
  await initializeDatabase();
  
  let accounts, categories;
  
  if (dbInitialized) {
    // Use database service
    try {
      accounts = await dbService.getAccounts();
      categories = await dbService.getCategories();
    } catch (error) {
      console.error('Error loading from database:', error);
      // Fallback to chrome.storage
      const data = await chrome.storage.sync.get(['accounts', 'categories']);
      accounts = data.accounts || [];
      categories = data.categories || ['console', 'watch strap', 'phone case', 'electronics'];
    }
  } else {
    // Use chrome.storage as fallback
    const data = await chrome.storage.sync.get(['accounts', 'categories']);
    accounts = data.accounts || [];
    categories = data.categories || ['console', 'watch strap', 'phone case', 'electronics'];
  }
  
  // Populate account dropdown
  const accountSelect = document.getElementById('accountSelect');
  const viewAccountFilter = document.getElementById('viewAccountFilter');
  accountSelect.innerHTML = '<option value="">Select Account</option>';
  viewAccountFilter.innerHTML = '<option value="">All Accounts</option>';
  
  accounts.forEach(account => {
    accountSelect.innerHTML += `<option value="${account}">${account}</option>`;
    viewAccountFilter.innerHTML += `<option value="${account}">${account}</option>`;
  });
  
  // Populate category dropdown
  const categorySelect = document.getElementById('categorySelect');
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  categories.forEach(category => {
    categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

// Add new account
document.getElementById('addAccount').addEventListener('click', async () => {
  const accountName = prompt('Enter new account name:');
  if (!accountName || !accountName.trim()) return;
  
  try {
    if (dbInitialized) {
      const accounts = await dbService.getAccounts();
      if (accounts.includes(accountName.trim())) {
        showStatus('Account already exists!', 'error');
        return;
      }
      await dbService.addAccount(accountName.trim());
    } else {
      const data = await chrome.storage.sync.get(['accounts']);
      const accounts = data.accounts || [];
      if (accounts.includes(accountName.trim())) {
        showStatus('Account already exists!', 'error');
        return;
      }
      accounts.push(accountName.trim());
      await chrome.storage.sync.set({ accounts });
    }
    
    await loadAccountsAndCategories();
    showStatus('Account added successfully!', 'success');
  } catch (error) {
    console.error('Error adding account:', error);
    showStatus('Failed to add account', 'error');
  }
});

// Add new category
document.getElementById('addCategory').addEventListener('click', async () => {
  const categoryName = prompt('Enter new category name:');
  if (!categoryName || !categoryName.trim()) return;
  
  try {
    if (dbInitialized) {
      const categories = await dbService.getCategories();
      if (categories.includes(categoryName.trim())) {
        showStatus('Category already exists!', 'error');
        return;
      }
      await dbService.addCategory(categoryName.trim());
    } else {
      const data = await chrome.storage.sync.get(['categories']);
      const categories = data.categories || [];
      if (categories.includes(categoryName.trim())) {
        showStatus('Category already exists!', 'error');
        return;
      }
      categories.push(categoryName.trim());
      await chrome.storage.sync.set({ categories });
    }
    
    await loadAccountsAndCategories();
    showStatus('Category added successfully!', 'success');
  } catch (error) {
    console.error('Error adding category:', error);
    showStatus('Failed to add category', 'error');
  }
});

// Save ASINs to selected category
document.getElementById('saveToCategory').addEventListener('click', async () => {
  const account = document.getElementById('accountSelect').value;
  const category = document.getElementById('categorySelect').value;
  
  if (!account) {
    showStatus('Please select an account', 'error');
    return;
  }
  
  if (!category) {
    showStatus('Please select a category', 'error');
    return;
  }
  
  if (currentAsins.length === 0) {
    showStatus('No ASINs to save', 'error');
    return;
  }
  
  try {
    let result;
    
    if (dbInitialized) {
      // Use database service
      result = await dbService.saveAsins(account, category, currentAsins);
      showStatus(`Saved ${result.newCount} new ASINs to ${account} > ${category}`, 'success');
    } else {
      // Fallback to chrome.storage
      const data = await chrome.storage.sync.get(['savedAsins']);
      const savedAsins = data.savedAsins || {};
      
      if (!savedAsins[account]) savedAsins[account] = {};
      if (!savedAsins[account][category]) savedAsins[account][category] = [];
      
      const existingAsins = new Set(savedAsins[account][category]);
      let newCount = 0;
      
      currentAsins.forEach(asin => {
        if (!existingAsins.has(asin)) {
          savedAsins[account][category].push(asin);
          newCount++;
        }
      });
      
      await chrome.storage.sync.set({ savedAsins });
      showStatus(`Saved ${newCount} new ASINs to ${account} > ${category}`, 'success');
    }
  } catch (error) {
    console.error('Error saving ASINs:', error);
    showStatus('Failed to save ASINs', 'error');
  }
});

// View saved ASINs
document.getElementById('viewSaved').addEventListener('click', async () => {
  try {
    let savedAsins = {};
    const accountFilter = document.getElementById('viewAccountFilter').value;
    
    if (dbInitialized) {
      // Use database service
      savedAsins = await dbService.getAllAsins(accountFilter);
    } else {
      // Fallback to chrome.storage
      const data = await chrome.storage.sync.get(['savedAsins']);
      savedAsins = data.savedAsins || {};
      
      // Apply account filter manually if needed
      if (accountFilter && savedAsins[accountFilter]) {
        savedAsins = { [accountFilter]: savedAsins[accountFilter] };
      } else if (accountFilter) {
        savedAsins = {};
      }
    }
    
    const savedViewer = document.getElementById('savedViewer');
    const savedAsinsList = document.getElementById('savedAsinsList');
    
    let html = '';
    
    for (const [account, categories] of Object.entries(savedAsins)) {
      html += `<div class="saved-account">
        <h4>📁 ${account}</h4>`;
      
      for (const [category, asins] of Object.entries(categories)) {
        html += `<div class="saved-category">
          <div class="category-header">
            <label>
              <input type="checkbox" class="category-checkbox" data-account="${account}" data-category="${category}">
              <strong>${category}</strong> (${asins.length} ASINs)
            </label>
            <button class="btn btn-small delete-category" data-account="${account}" data-category="${category}">Delete</button>
          </div>
          <div class="category-asins">${asins.slice(0, 10).join(', ')}${asins.length > 10 ? '...' : ''}</div>
        </div>`;
      }
      
      html += `</div>`;
    }
    
    if (html === '') {
      html = '<p>No saved ASINs yet. Collect some ASINs and save them to a category!</p>';
    }
    
    savedAsinsList.innerHTML = html;
    savedViewer.style.display = 'block';
    
    // Add delete handlers
    document.querySelectorAll('.delete-category').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const account = e.target.dataset.account;
        const category = e.target.dataset.category;
        
        if (!confirm(`Delete all ASINs from ${account} > ${category}?`)) return;
        
        try {
          if (dbInitialized) {
            await dbService.deleteCategory(account, category);
          } else {
            const data = await chrome.storage.sync.get(['savedAsins']);
            const savedAsins = data.savedAsins || {};
            
            if (savedAsins[account] && savedAsins[account][category]) {
              delete savedAsins[account][category];
              
              if (Object.keys(savedAsins[account]).length === 0) {
                delete savedAsins[account];
              }
              
              await chrome.storage.sync.set({ savedAsins });
            }
          }
          
          showStatus('Category deleted', 'success');
          document.getElementById('viewSaved').click();
        } catch (error) {
          console.error('Error deleting category:', error);
          showStatus('Failed to delete category', 'error');
        }
      });
    });
  } catch (error) {
    console.error('Error viewing saved ASINs:', error);
    showStatus('Failed to load saved ASINs', 'error');
  }
});

// Export selected categories
document.getElementById('exportSavedAsins').addEventListener('click', async () => {
  const checkedBoxes = document.querySelectorAll('.category-checkbox:checked');
  
  if (checkedBoxes.length === 0) {
    showStatus('Please select categories to export', 'error');
    return;
  }
  
  try {
    let savedAsins = {};
    
    if (dbInitialized) {
      savedAsins = await dbService.getAllAsins();
    } else {
      const data = await chrome.storage.sync.get(['savedAsins']);
      savedAsins = data.savedAsins || {};
    }
    
    let exportData = [];
    
    checkedBoxes.forEach(checkbox => {
      const account = checkbox.dataset.account;
      const category = checkbox.dataset.category;
      
      if (savedAsins[account] && savedAsins[account][category]) {
        exportData.push({
          account,
          category,
          asins: savedAsins[account][category]
        });
      }
    });
    
    // Create export text
    let exportText = '';
    exportData.forEach(item => {
      exportText += `\n=== ${item.account} > ${item.category} ===\n`;
      exportText += item.asins.join('\n') + '\n';
    });
    
    // Copy to clipboard
    await navigator.clipboard.writeText(exportText.trim());
    showStatus(`Exported ${exportData.length} categories to clipboard!`, 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Export failed', 'error');
  }
});

// Close saved viewer
document.getElementById('closeSavedViewer').addEventListener('click', () => {
  document.getElementById('savedViewer').style.display = 'none';
});

// Filter saved ASINs by account
document.getElementById('viewAccountFilter').addEventListener('change', () => {
  document.getElementById('viewSaved').click();
});

// Initialize database and load data on page load
(async function init() {
  await initializeDatabase();
  await loadAccountsAndCategories();
})();


// Add ASIN badge to each product card
function addAsinBadges() {
  const productCards = document.querySelectorAll('[data-component-type="s-search-result"]');
  productCards.forEach(card => {
    const asin = card.getAttribute('data-asin');
    if (asin && asin.length === 10 && !card.querySelector('.asin-badge')) {
      const badge = document.createElement('div');
      badge.className = 'asin-badge';
      badge.textContent = `ASIN: ${asin}`;
      badge.style.position = 'absolute';
      badge.style.top = '12px';
      badge.style.left = '12px';
      badge.style.background = 'linear-gradient(90deg, #232526 0%, #414345 100%)';
      badge.style.color = '#fff';
      badge.style.padding = '3px 10px';
      badge.style.borderRadius = '8px';
      badge.style.fontSize = '13px';
      badge.style.zIndex = '9999';
      badge.style.pointerEvents = 'none';
      badge.style.fontWeight = 'bold';
      badge.style.letterSpacing = '1px';
      badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
      badge.style.border = '2px solid #fff';
      badge.style.maxWidth = '90%';
      badge.style.overflow = 'hidden';
      badge.style.textOverflow = 'ellipsis';
      badge.style.whiteSpace = 'nowrap';
      card.style.position = 'relative';
      card.style.overflow = 'visible';
      card.appendChild(badge);
    }
  });
}

// Wait for Amazon search results grid to be present and populated
async function waitForSearchResults(timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const container = document.querySelector('[data-component-type="s-search-results"]');
    if (container && container.querySelectorAll('[data-component-type="s-search-result"]').length > 0) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  console.warn('⚠️ Timed out waiting for search results grid.');
  return false;
}
// Detect and log page refreshes or navigation changes
window.addEventListener('beforeunload', function () {
  console.log('⚠️ Page is about to refresh or navigate away.');
});

window.addEventListener('load', function () {
  console.log('🔄 Page loaded/reloaded at', new Date().toLocaleString());
  setTimeout(addAsinBadges, 1200); // Wait for products to load
});

// Also add badges after scroll/load events
document.addEventListener('scroll', () => setTimeout(addAsinBadges, 1000));
document.addEventListener('DOMContentLoaded', () => setTimeout(addAsinBadges, 1200));
// Initialization
console.log('🚀 Amazon ASIN Exporter - Content Script Loaded');
console.log('✅ Extension is ready on this page');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request.action);
  
  if (request.action === 'ping') {
    // Simple ping to check if content script is loaded
    console.log('✅ Content script is active and ready!');
    sendResponse({ ready: true });
    return false; // Synchronous response
  } else if (request.action === 'quickCollect') {
    // Quick collection - just get ASINs without detailed checking
    quickCollectAsins(request.maxPages, request.excludeBrand, request.searchKeywords, request.minRating, request.maxDeliveryDays).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Async response
  } else if (request.action === 'applyFilter') {
    // Scroll to load more products first
    scrollAndLoadProducts().then(() => {
      const asins = applyProductFilter(request.config);
      sendResponse({ success: true, asins: asins });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'getAllAsins') {
    // Get all ASINs without filtering
    scrollAndLoadProducts().then(() => {
      const allAsins = getAllAsinsOnPage();
      sendResponse({ success: true, asins: allAsins });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Async response
  } else if (request.action === 'collectMultiplePages') {
    // Collect ASINs from multiple pages
    collectFromMultiplePages(request.config, request.maxPages).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Async response
  } else if (request.action === 'clearFilter') {
    clearProductFilter();
    sendResponse({ success: true });
    return false; // Synchronous response
  }
  return false; // Default to synchronous
});

let currentConfig = null;

// Scroll page to load all products
async function scrollAndLoadProducts() {
  console.log('Scrolling to load all products...');
  console.log('⚠️ Note: Amazon limits products per page. Only currently visible products will be collected.');
  
  const scrollDelay = 1500; // ms between scrolls (slower for better loading)
  const maxScrolls = 50; // Much higher limit
  const stableScrollCount = 5; // Wait for 5 scrolls with no change
  let scrollCount = 0;
  let lastProductCount = 0;
  let noChangeCount = 0;
  
  while (scrollCount < maxScrolls) {
    // Scroll to absolute bottom to trigger lazy loading
    const beforeScroll = window.scrollY;
    window.scrollTo(0, document.body.scrollHeight);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, scrollDelay));
    
    // Count unique ASINs (not just elements)
    const currentAsins = new Set();
    document.querySelectorAll('[data-asin]').forEach(el => {
      const asin = el.getAttribute('data-asin');
      if (asin && asin.length >= 10) {
        currentAsins.add(asin);
      }
    });
    const currentProductCount = currentAsins.size;
    
    console.log(`Scroll ${scrollCount + 1}: Found ${currentProductCount} unique ASINs`);
    
    // If no new products loaded, increment counter
    if (currentProductCount === lastProductCount) {
      noChangeCount++;
      console.log(`No new products loaded (${noChangeCount}/${stableScrollCount})...`);
      
      // Try clicking "Load more" button if it exists
      const loadMoreBtn = document.querySelector('.s-pagination-next:not(.s-pagination-disabled), [data-cel-widget="load_more"], .a-pagination .a-last:not(.a-disabled)');
      if (loadMoreBtn && noChangeCount === 2) {
        console.log('Attempting to click "Load More" or "Next" button...');
        loadMoreBtn.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        noChangeCount = 0; // Reset after clicking
        continue;
      }
      
      // If we've had no new products for several scrolls, we're done
      if (noChangeCount >= stableScrollCount) {
        console.log('✓ Reached end of loaded products');
        console.log(`💡 Tip: Amazon typically loads 48-60 products per page. To get more, manually navigate to page 2, 3, etc.`);
        break;
      }
    } else {
      noChangeCount = 0; // Reset if we found new products
      console.log(`✓ Found ${currentProductCount - lastProductCount} new ASINs!`);
    }
    
    lastProductCount = currentProductCount;
    scrollCount++;
  }
  
  // Scroll back to top
  window.scrollTo(0, 0);
  console.log(`✓ Finished scrolling. Found ${lastProductCount} total unique ASINs on this page.`);
}

// Get all ASINs on page without filtering
function getAllAsinsOnPage() {
  const allAsins = new Set();
  
  // STRICT: Only get from main search results container
  const searchResultsContainer = document.querySelector('[data-component-type="s-search-results"]');
  
  if (!searchResultsContainer) {
    console.warn('No search results container found');
    return [];
  }
  
  // ONLY get items that are actual search results
  const items = searchResultsContainer.querySelectorAll('[data-component-type="s-search-result"]');
  
  if (items.length === 0) {
    console.warn('No search result items found');
    return [];
  }
  
  items.forEach(el => {
    const asin = el.getAttribute('data-asin');
    // Valid ASIN is exactly 10 characters
    if (asin && asin.length === 10 && /^[A-Z0-9]{10}$/i.test(asin)) {
      // Verify element is visible
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        allAsins.add(asin);
      }
    }
  });
  
  const asinsArray = Array.from(allAsins);
  console.log(`Found ${asinsArray.length} unique ASINs in visible search results`);
  return asinsArray;
}

// Quick ASIN collection (fast - no detailed filtering)
async function quickCollectAsins(maxPages, excludeBrand = '', searchKeywords = '', minRating = 0, maxDeliveryDays = 0) {
  console.log(`⚡ Starting QUICK collection (${maxPages} pages max)...`);
  
  // Parse comma-separated exclude brands
  const excludeBrands = excludeBrand ? excludeBrand.split(',').map(b => b.trim().toLowerCase()).filter(b => b) : [];
  
  if (excludeBrands.length > 0) {
    console.log(`  Excluding brands: ${excludeBrands.join(', ')}`);
  }
  if (searchKeywords) {
    console.log(`  Keywords: ${searchKeywords}`);
  }
  if (minRating > 0) {
    console.log(`  Minimum rating: ${minRating}`);
  }
  if (maxDeliveryDays > 0) {
    console.log(`  Maximum delivery days: ${maxDeliveryDays}`);
  }
  
  const startTime = Date.now();
  const keywords = searchKeywords ? searchKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k) : [];
  
  console.log(`  Keywords to match: ${JSON.stringify(keywords)}`);
  
  const allAsins = new Set();
  let currentPage = 1;
  let filteredCount = 0;
  let checkedCount = 0;
  
  try {
    // Wait for product grid to be loaded before starting extraction
    await waitForSearchResults();

    // Auto-scroll to load more products (simulate user scrolling)
    let lastCount = 0;
    for (let i = 0; i < 10; i++) { // up to 10 scrolls
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 600));
      const container = document.querySelector('[data-component-type="s-search-results"]');
      const items = container ? container.querySelectorAll('[data-component-type="s-search-result"]') : [];
      if (items.length > lastCount) {
        lastCount = items.length;
      } else {
        break; // No new items loaded
      }
    }
    while (currentPage <= maxPages) {
      console.log(`📄 Page ${currentPage}/${maxPages}...`);
      
      // Check if page explicitly says "No results"
      const pageText = document.body.textContent || '';
      if (pageText.includes('No results for your search query')) {
        console.warn('  ❌ Page shows "No results for your search query" - stopping collection');
        break;
      }
      
      // Quick scroll - just 2-3 scrolls
      for (let i = 0; i < 3; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Only collect from actual search results grid, not recommendations
      // STRICT: Only get from main search results, exclude everything else
      const searchResultsContainer = document.querySelector('[data-component-type="s-search-results"]');
      
      if (!searchResultsContainer) {
        console.warn('  ⚠️ No search results container found - this may not be a search results page');
        break;
      }
      
      // ONLY get items with data-component-type="s-search-result" 
      // This is the ONLY reliable way to get actual search results
      const searchResultItems = searchResultsContainer.querySelectorAll('[data-component-type="s-search-result"]');
      
      console.log(`  Found ${searchResultItems.length} search result items`);
      
      if (searchResultItems.length === 0) {
        console.warn('  ⚠️ No search result items found - page may not have loaded properly');
        break;
      }
      
      // Extract ASINs ONLY from these verified search result items
      const asinElements = [];
      const foundAsins = new Set(); // Track to avoid duplicates
      
      searchResultItems.forEach(item => {
        const asin = item.getAttribute('data-asin');
        // Valid ASIN is exactly 10 characters AND must not be a duplicate
        if (asin && asin.length === 10 && /^[A-Z0-9]{10}$/i.test(asin) && !foundAsins.has(asin)) {
          // Verify this element is actually visible (not hidden carousel/recommendation)
          const rect = item.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          
          if (isVisible) {
            asinElements.push(item);
            foundAsins.add(asin);
          }
        }
      });
      console.log(`  Found ${asinElements.length} valid ASIN elements in visible search results`);
      
      // Debug: show first few ASINs found
      let debugCount = 0;
      asinElements.forEach(el => {
        const asin = el.getAttribute('data-asin');
        if (debugCount < 5) {
          console.log(`    Element ${debugCount + 1}: data-asin="${asin}" (length: ${asin ? asin.length : 0})`);
          debugCount++;
        }
      });
      
      // Quick ASIN grab with filters
      asinElements.forEach(el => {
        const asin = el.getAttribute('data-asin');
        // Valid ASIN must be exactly 10 characters (alphanumeric, case-insensitive)
        if (!asin || asin.length !== 10 || !/^[A-Z0-9]{10}$/i.test(asin)) return;
        
        checkedCount++;
        
        // Get title from multiple possible locations
        let titleText = '';
        const titleEl = el.querySelector('h2 span, h2, .a-text-normal, .s-line-clamp-2, [data-cy="title-recipe"], .a-size-base-plus, .a-size-medium');
        if (titleEl) {
          titleText = titleEl.textContent.toLowerCase().trim();
        }
        
        // If no title found, try the whole element (less precise but catches more)
        if (!titleText) {
          titleText = el.textContent.toLowerCase();
        }
        
        // Get full product text for additional checks
        // Look more broadly - sometimes stock info is in parent or sibling elements
        const productCard = el.closest('[data-component-type="s-search-result"]') || el;
        const productText = productCard.textContent.toLowerCase();
        
        // Debug first few items - show ALL text to see if stock info is there
        if (checkedCount <= 5) {
          console.log(`    Product ${checkedCount}: ASIN=${asin}, Title="${titleText.substring(0, 80)}..."`);
          console.log(`    Full product text (first 400 chars): "${productText.substring(0, 400)}"`);
          if (keywords.length > 0) {
            const matches = keywords.map(k => ({ keyword: k, found: titleText.includes(k) }));
            console.log(`    Keyword check:`, matches);
          }
          // Check for low stock text - show what we're checking
          const hasLeftInStock = productText.includes('left in stock');
          const hasOnlyLeft = productText.match(/only \d+ left/i);
          console.log(`    Stock check: "left in stock"=${hasLeftInStock}, "only X left"=${!!hasOnlyLeft}`);
          if (hasLeftInStock || hasOnlyLeft) {
            const stockMatch = productText.match(/(only \d+ left[^.]{0,30}|[^.]{0,50}left in stock[^.]{0,50})/i);
            console.log(`    📦 STOCK TEXT FOUND: "${stockMatch?.[0] || 'match failed'}"`);
          }
        }
        
        // Filter out low stock items - ANY "left in stock" or "only X left" warnings
        const hasLowStock = productText.match(/only \d+ left/i) || 
                           productText.match(/\d+ left in stock/i);
        if (hasLowStock) {
          filteredCount++;
          if (checkedCount <= 10) {
            console.log(`    ❌ FILTERED OUT - low stock warning (ASIN: ${asin})`);
          }
          return;
        }
        
        // Filter out unavailable products
                // Filter out used products
                // Allow if 'used & new offers' or 'used and new offers' is present, but exclude if only 'used' is present without 'offer(s)'
                if (productText.includes('used')) {
                  const hasOffers = /used\s*(&|and)\s*new\s*offers?/.test(productText);
                  if (!hasOffers) {
                    filteredCount++;
                    if (checkedCount <= 10) {
                      console.log(`    ❌ FILTERED OUT - used product without offers (ASIN: ${asin})`);
                    }
                    return;
                  }
                }
        const isUnavailable = productText.includes('currently unavailable') ||
                             productText.includes('temporarily out of stock');
        
        if (isUnavailable) {
          filteredCount++;
          if (checkedCount <= 10) {
            console.log(`    ❌ FILTERED OUT - product unavailable (ASIN: ${asin})`);
          }
          return;
        }
        
        // Amazon shipping check - TEMPORARY: Accept all and show debug
        // We need to see what Prime indicators are actually present
        const primeBadgeSelectors = [
          '.a-icon-prime',
          '[aria-label*="Prime"]',
          'i.a-icon-prime',
          'span.a-icon-prime',
          'i[aria-label*="Prime"]',
          '[class*="prime"]',
          '.s-prime',
          'i[class*="a-icon-prime"]',
          'span[class*="prime"]'
        ];
        
        let hasPrimeBadge = false;
        let foundSelector = null;
        
        for (const selector of primeBadgeSelectors) {
          const element = productCard.querySelector(selector);
          if (element) {
            hasPrimeBadge = true;
            foundSelector = selector;
            break;
          }
        }
        
        // TEMPORARY: Show debug for ALL products (not just first 10)
        console.log(`    Product ${checkedCount} - ASIN ${asin}:`);
        console.log(`      Prime badge: ${hasPrimeBadge}${foundSelector ? ` (${foundSelector})` : ''}`);
        
        // Check for Prime in text
        const lowerText = productText.toLowerCase();
        const hasPrimeInText = lowerText.includes('prime');
        const hasFreeDelivery = lowerText.includes('free delivery') || lowerText.includes('free shipping');
        
        console.log(`      Prime in text: ${hasPrimeInText}`);
        console.log(`      Free delivery: ${hasFreeDelivery}`);
        
        // TEMPORARY: Accept ALL products to see what we get
        // The user will tell us which ASIN is correct
        console.log(`    ✅ TEMPORARILY ACCEPTING (for debugging)`);
        
        // Note: Comment out the filter for now
        /*
        if (!hasPrimeBadge) {
          filteredCount++;
          console.log(`    ❌ FILTERED OUT - no Prime badge detected (ASIN: ${asin})`);
          return;
        }
        */
        
        // Delivery days check
        if (maxDeliveryDays > 0) {
          const deliveryElement = productCard.querySelector('[aria-label*="delivery"], [aria-label*="arrives"], .a-text-bold');
          if (!deliveryElement) {
            filteredCount++;
            if (checkedCount <= 10) {
              console.log(`    ❌ FILTERED OUT - no delivery date info (ASIN: ${asin})`);
            }
            return;
          }
          const deliveryText = (deliveryElement.getAttribute('aria-label') || deliveryElement.textContent || '').toLowerCase();
          if (deliveryText && !checkDeliveryDate(deliveryText, maxDeliveryDays)) {
            filteredCount++;
            if (checkedCount <= 10) {
              console.log(`    ❌ FILTERED OUT - delivery exceeds ${maxDeliveryDays} days (ASIN: ${asin})`);
            }
            return;
          }
        }
        
        // Keyword filter (if keywords are provided, ONLY include products that match)
        if (keywords.length > 0 && titleText) {
          // Match only if ALL keywords are present in the title
          const allKeywordsPresent = keywords.every(keyword => titleText.includes(keyword));
          if (!allKeywordsPresent) {
            filteredCount++;
            if (checkedCount <= 5) {
              console.log(`    ❌ FILTERED OUT - not all keywords matched`);
            }
            return;
          } else if (checkedCount <= 5) {
            console.log(`    ✓ INCLUDED - all keywords matched`);
          }
        }
        
        // Brand filter - check against all excluded brands
        if (excludeBrands.length > 0) {
          const matchedBrand = excludeBrands.find(brand => titleText.includes(brand));
          if (matchedBrand) {
            filteredCount++;
            if (checkedCount <= 5) {
              console.log(`    ❌ FILTERED OUT - brand excluded: ${matchedBrand}`);
            }
            return;
          }
        }
        
        // Rating filter
        if (minRating > 0) {
          const ratingElement = el.querySelector('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt, [data-cy="reviews-ratings-slot"] span');
          if (ratingElement) {
            const ratingText = ratingElement.textContent;
            const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');
            if (rating > 0 && rating < minRating) {
              filteredCount++;
              if (checkedCount <= 5) {
                console.log(`    ❌ FILTERED OUT - rating ${rating} < minimum ${minRating}`);
              }
              return;
            }
          } else {
            filteredCount++;
            if (checkedCount <= 5) {
              console.log('    ❌ FILTERED OUT - no rating element found');
            }
            return;
          }
        }
        
        allAsins.add(asin);
      });
      
      console.log(`  ✓ Page ${currentPage}: ${allAsins.size} total ASINs (checked ${checkedCount} products)`);
      if (keywords.length > 0 || excludeBrands.length > 0) {
        console.log(`    (${filteredCount} items filtered out)`);
      }
      
      // Check for next page
      if (currentPage >= maxPages) {
        console.log(`  ✓ Reached maximum page limit (${maxPages})`);
        break;
      }
      
      console.log(`  🔍 Looking for next page button... (currentPage=${currentPage}, maxPages=${maxPages})`);
      const nextBtn = document.querySelector('.s-pagination-next:not(.s-pagination-disabled)');
      console.log(`  Next button found: ${nextBtn ? 'YES' : 'NO'}`);
      
      if (!nextBtn) {
        console.log('  → No more pages available (next button not found or disabled)');
        break;
      }
      
      console.log(`  → Clicking next button to navigate to page ${currentPage + 1}...`);
      // Quick navigation
      nextBtn.click();
      console.log(`  ⏱️ Waiting 3 seconds for page ${currentPage + 1} to load...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time for page load
      
      currentPage++;
      console.log(`  ✅ Now on page ${currentPage}`);
    }
    
    const timeSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    const finalAsins = Array.from(allAsins);
    
    console.log(`\n✅ Quick collection done!`);
    console.log(`⚡ ${finalAsins.length} ASINs collected in ${timeSeconds}s`);
    if (filteredCount > 0) {
      console.log(`🚫 ${filteredCount} items excluded (${excludeBrands.join(', ')})`);
    }
    console.log(`📊 ~${(finalAsins.length / parseFloat(timeSeconds)).toFixed(1)} ASINs/second`);
    
    window.scrollTo(0, 0);
    
    // Check if we got any results
    if (finalAsins.length === 0) {
      return {
        success: false,
        error: 'No ASINs found. The page may not have product listings, or all products were filtered out.',
        asins: [],
        pagesProcessed: currentPage
      };
    }
    
    return {
      success: true,
      asins: finalAsins,
      pagesProcessed: currentPage,
      timeSeconds: timeSeconds
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message,
      asins: Array.from(allAsins),
      pagesProcessed: currentPage - 1
    };
  }
}

// Collect ASINs from multiple pages
async function collectFromMultiplePages(config, maxPages) {
  console.log(`🔄 Starting multi-page collection (max ${maxPages} pages)...`);
  
  const allAsins = new Set();
  let currentPage = 1;
  const collectedPerPage = [];
  
  try {
    while (currentPage <= maxPages) {
      console.log(`\n📄 Processing page ${currentPage}/${maxPages}...`);
      
      // Scroll and load products on current page
      await scrollAndLoadProducts();
      
      // Get ASINs from current page
      let pageAsins;
      if (config) {
        // Apply filters
        currentConfig = config;
        pageAsins = filterProducts();
      } else {
        // No filter, get all
        pageAsins = getAllAsinsOnPage();
      }
      
      // Add to collection
      const beforeCount = allAsins.size;
      pageAsins.forEach(asin => allAsins.add(asin));
      const newAsins = allAsins.size - beforeCount;
      
      console.log(`✓ Page ${currentPage}: Found ${pageAsins.length} ASINs (${newAsins} new, ${allAsins.size} total)`);
      collectedPerPage.push({ page: currentPage, asins: pageAsins.length, newAsins: newAsins });
      
      // Check if there's a next page
      const nextButton = document.querySelector('.s-pagination-next:not(.s-pagination-disabled), a.s-pagination-item.s-pagination-next:not(.s-pagination-disabled)');
      
      if (!nextButton || currentPage >= maxPages) {
        if (!nextButton) {
          console.log(`✓ No more pages available. Stopped at page ${currentPage}.`);
        } else {
          console.log(`✓ Reached maximum page limit (${maxPages}).`);
        }
        break;
      }
      
      // Navigate to next page
      console.log(`⏭️  Navigating to page ${currentPage + 1}...`);
      nextButton.click();
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait for products to appear
      let waitCount = 0;
      while (document.querySelectorAll('[data-asin]').length < 10 && waitCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waitCount++;
      }
      
      currentPage++;
    }
    
    const finalAsins = Array.from(allAsins);
    console.log(`\n✅ Multi-page collection complete!`);
    console.log(`📊 Total pages processed: ${currentPage}`);
    console.log(`📦 Total unique ASINs collected: ${finalAsins.length}`);
    console.log('\nPer-page breakdown:', collectedPerPage);
    
    return {
      success: true,
      asins: finalAsins,
      pagesProcessed: currentPage,
      perPage: collectedPerPage
    };
    
  } catch (error) {
    console.error('❌ Error during multi-page collection:', error);
    return {
      success: false,
      error: error.message,
      asins: Array.from(allAsins),
      pagesProcessed: currentPage - 1
    };
  }
}

function applyProductFilter(config) {
  currentConfig = config;
  console.log('Applying filter with config:', config);
  
  // Add visual indicator that filter is active
  addFilterIndicator();
  
  // Filter products and collect ASINs
  const asins = filterProducts();
  
  // Set up observer to handle dynamically loaded content
  setupProductObserver();
  
  return asins;
}

function clearProductFilter() {
  currentConfig = null;
  removeFilterIndicator();
  
  // Show all hidden products
  const hiddenProducts = document.querySelectorAll('[data-asin-filter="hidden"]');
  hiddenProducts.forEach(product => {
    product.style.display = '';
    product.removeAttribute('data-asin-filter');
  });
  
  // Remove all filter badges
  document.querySelectorAll('.asin-filter-badge').forEach(badge => badge.remove());
}

function filterProducts() {
  if (!currentConfig) return [];

  let products = new Set();
  
  // STRICT: Only get from main search results container
  const searchResultsContainer = document.querySelector('[data-component-type="s-search-results"]');
  
  if (!searchResultsContainer) {
    console.warn('No search results container found - may not be on a search results page');
    return [];
  }
  
  // ONLY get items that are actual search results
  const items = searchResultsContainer.querySelectorAll('[data-component-type="s-search-result"]');
  
  if (items.length === 0) {
    console.warn('No search result items found');
    return [];
  }
  
  items.forEach(el => {
    const asin = el.getAttribute('data-asin');
    // Valid ASIN is exactly 10 characters
    if (asin && asin.length === 10 && /^[A-Z0-9]{10}$/i.test(asin)) {
      // Verify element is visible
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        products.add(el);
      }
    }
  });

  products = Array.from(products);
  console.log(`Found ${products.length} products in visible search results to check`);
  
  // Debug: Log first few ASINs found
  if (products.length > 0) {
    const sampleAsins = products.slice(0, 5).map(p => p.getAttribute('data-asin'));
    console.log('Sample ASINs found:', sampleAsins);
  } else {
    console.warn('No products found! Check if you are on an Amazon search results page.');
  }

  let visibleCount = 0;
  let hiddenCount = 0;
  const matchingAsins = [];

  products.forEach(product => {
    const asin = product.getAttribute('data-asin');
    
    // Skip if no valid ASIN
    if (!asin || asin === '' || asin.length < 10) return;

    const shouldShow = checkProduct(product, asin);
    
    if (shouldShow) {
      product.style.display = '';
      product.removeAttribute('data-asin-filter');
      visibleCount++;
      matchingAsins.push(asin);
      
      // Add badge showing it passed
      addPassBadge(product, asin);
    } else {
      product.style.display = 'none';
      product.setAttribute('data-asin-filter', 'hidden');
      hiddenCount++;
    }
  });

  console.log(`Filtered: ${visibleCount} shown, ${hiddenCount} hidden`);
  console.log(`Matching ASINs:`, matchingAsins);
  updateFilterIndicator(visibleCount, hiddenCount);
  
  return matchingAsins;
}

function checkProduct(product, asin) {
  const config = currentConfig;
  
  // Check 0: Keyword filter (if specified)
  if (config.searchKeywords) {
    const keywords = config.searchKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    if (keywords.length > 0) {
      // Try multiple selectors to find title
      const titleEl = product.querySelector('h2 span, h2, .a-text-normal, .s-line-clamp-2, [data-cy="title-recipe"], .a-size-base-plus, .a-size-medium');
      let titleText = '';
      
      if (titleEl) {
        titleText = titleEl.textContent.toLowerCase().trim();
      } else {
        // Fallback: search entire product element
        const h2 = product.querySelector('h2');
        if (h2) {
          titleText = h2.textContent.toLowerCase().trim();
        }
      }
      
      if (titleText) {
          const allKeywordsPresent = keywords.every(keyword => titleText.includes(keyword));
          if (!allKeywordsPresent) {
            console.log(`Filtered out ${asin}: not all keywords matched in "${titleText.substring(0, 50)}..."`);
          return false;
        }
      } else {
        console.log(`Filtered out ${asin}: could not find product title`);
        return false;
      }
    }
  }
  
  // Check 1: Brand filter (exclude specific brands)
  if (config.excludeBrand) {
    const brandElement = product.querySelector('.a-size-base-plus, h2 .a-text-normal, .s-line-clamp-2');
    if (brandElement) {
      const productTitle = brandElement.textContent.toLowerCase();
      // Parse comma-separated exclude brands
      const excludeBrands = config.excludeBrand.split(',').map(b => b.trim().toLowerCase()).filter(b => b);
      const matchedBrand = excludeBrands.find(brand => productTitle.includes(brand));
      if (matchedBrand) {
        console.log(`Filtered out ${asin}: excluded brand ${matchedBrand}`);
        return false;
      }
    }
  }

  // Check 2: Rating filter - ensure rating meets minimum requirement
  if (config.minRating) {
    const ratingElement = product.querySelector('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt, [data-cy="reviews-ratings-slot"] span');
    if (ratingElement) {
      const ratingText = ratingElement.textContent;
      const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');
      console.log(`🔍 Rating check for ${asin}: found rating ${rating}, minimum required ${config.minRating} (type: ${typeof config.minRating})`);
      // Filter out products below minimum rating
      if (rating > 0 && rating < config.minRating) {
        console.log(`❌ Filtered out ${asin}: rating ${rating} is below minimum ${config.minRating}`);
        return false;
      }
      if (rating >= config.minRating) {
        console.log(`✓ Product ${asin}: rating ${rating} meets minimum ${config.minRating}`);
      }
    } else {
      console.log(`❌ Filtered out ${asin}: no rating element found`);
      return false;
    }
  }

  // Check 3: Purchase count (number bought in past month)
  if (config.minPurchases) {
    const purchaseElements = product.querySelectorAll('.a-size-base.a-color-secondary, .a-size-small.a-color-secondary');
    let foundPurchases = null;
    
    for (const purchaseElement of purchaseElements) {
      const purchaseText = purchaseElement.textContent;
      const purchaseMatch = purchaseText.match(/(\d+[\d,]*)\+?\s*bought/i);
      if (purchaseMatch) {
        foundPurchases = parseInt(purchaseMatch[1].replace(/,/g, ''));
        break;
      }
    }
    
    // Only filter out if we found purchase data and it's below threshold
    if (foundPurchases !== null && foundPurchases < config.minPurchases) {
      console.log(`Filtered out ${asin}: purchases ${foundPurchases} < ${config.minPurchases}`);
      return false;
    }
    // If no purchase data found, allow it through
  }

  // Check 4: Amazon shipping only - must be Prime or shipped/sold by Amazon
  if (config.amazonShipping) {
    // Require Prime badge OR explicit 'Ships from Amazon' (not just seller name)
    const hasPrime = product.querySelector('.a-icon-prime, [aria-label*="Prime"]');
    const shippingText = product.textContent.toLowerCase();
    // Look for explicit fulfillment text, not just seller name
    const hasAmazonFulfillment = /ships\s+from\s+amazon/.test(shippingText) || /fulfilled\s+by\s+amazon/.test(shippingText);
    if (!hasPrime && !hasAmazonFulfillment) {
      console.log(`Filtered out ${asin}: not Amazon shipping/Prime`);
      return false;
    }
  }

  // Check 5: In stock only
  if (config.inStockOnly) {
    const stockText = product.textContent.toLowerCase();
    if (stockText.includes('currently unavailable') || 
        stockText.includes('out of stock') ||
        stockText.includes('temporarily out of stock')) {
      console.log(`Filtered out ${asin}: out of stock`);
      return false;
    }
  }

  // Check 6: Delivery date within X days
  if (config.maxDeliveryDays) {
    const deliveryElement = product.querySelector('[aria-label*="delivery"], [aria-label*="arrives"]');
    if (!deliveryElement) {
      console.log(`Filtered out ${asin}: no delivery date info`);
      return false;
    }
    const deliveryText = deliveryElement.getAttribute('aria-label') || deliveryElement.textContent;
    if (!checkDeliveryDate(deliveryText, config.maxDeliveryDays)) {
      console.log(`Filtered out ${asin}: delivery exceeds ${config.maxDeliveryDays} days`);
      return false;
    }
  }

  // Check 7: Sponsored items filter
  if (config.searchSponsoredOnly) {
    const isInSearchResults = product.closest('.s-result-list, .s-search-results') !== null;
    const isSponsored = product.querySelector('.s-sponsored-label, [data-component-type*="sp-sponsored"]') !== null ||
                       product.textContent.includes('Sponsored');
    
    // Only show if it's sponsored AND in search results
    if (!isSponsored || !isInSearchResults) {
      console.log(`Filtered out ${asin}: not a sponsored search result`);
      return false;
    }
  }

  console.log(`Product ${asin} passed all filters`);
  return true;
}

function checkDeliveryDate(deliveryText, maxDays) {
  // Try to extract date from delivery text
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lowerText = deliveryText.toLowerCase();
  
  // If "today" is mentioned
  if (lowerText.includes('today')) {
    return 0 <= maxDays;
  }
  
  // If "tomorrow" is mentioned
  if (lowerText.includes('tomorrow')) {
    return 1 <= maxDays;
  }
  
  // Look for "X days" pattern
  const daysMatch = lowerText.match(/(\d+)\s*days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    return days <= maxDays;
  }
  
  // Common patterns: "Get it by Friday, Jan 17", "Arrives Jan 17", "Feb 4 - 7", etc.
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  // Look for cross-month date range patterns like "Jan 31 - Feb 3" or same month "Feb 4 - 7"
  // Pattern: "Jan 31 - Feb 3" or "February 4 - 7"
  const crossMonthRange = lowerText.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})\s*-\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\w*?\s*(\d{1,2})/);
  if (crossMonthRange) {
    // crossMonthRange[1] = start month, crossMonthRange[2] = start day
    // crossMonthRange[3] = end month (optional), crossMonthRange[4] = end day
    let endMonthStr = crossMonthRange[3] || crossMonthRange[1];
    let endDay = parseInt(crossMonthRange[4]);
    let endMonthIndex = monthNames.findIndex(m => endMonthStr && endMonthStr.startsWith(m));
    if (endMonthIndex >= 0 && endDay >= 1 && endDay <= 31) {
      let year = today.getFullYear();
      const currentMonth = today.getMonth();
      if (endMonthIndex < currentMonth) {
        year++;
      } else if (endMonthIndex === currentMonth && endDay < today.getDate()) {
        year++;
      }
      const deliveryDate = new Date(year, endMonthIndex, endDay);
      const daysDiff = Math.floor((deliveryDate - today) / (1000 * 60 * 60 * 24));
      console.log(`      Delivery date (range): ${deliveryDate.toDateString()}, days from now: ${daysDiff}`);
      return daysDiff >= 0 && daysDiff <= maxDays;
    }
  }

  // Look for single date patterns like "Jan 17", "January 17"
  const dateMatch = lowerText.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})/);
  if (dateMatch) {
    const monthStr = dateMatch[1];
    const day = parseInt(dateMatch[2]);
    const monthIndex = monthNames.findIndex(m => monthStr.startsWith(m));
    if (monthIndex >= 0 && day >= 1 && day <= 31) {
      let year = today.getFullYear();
      const currentMonth = today.getMonth();
      if (monthIndex < currentMonth) {
        year++;
      } else if (monthIndex === currentMonth && day < today.getDate()) {
        year++;
      }
      const deliveryDate = new Date(year, monthIndex, day);
      const daysDiff = Math.floor((deliveryDate - today) / (1000 * 60 * 60 * 24));
      console.log(`      Delivery date: ${deliveryDate.toDateString()}, days from now: ${daysDiff}`);
      return daysDiff >= 0 && daysDiff <= maxDays;
    }
  }
  
  // If we can't parse it and maxDeliveryDays is set, filter it out to be safe
  // This ensures we don't include products with unclear delivery dates
  console.log(`      Could not parse delivery date from: "${deliveryText}" - filtering out`);
  return false;
}

function addPassBadge(product, asin) {
  // Remove existing badge if any
  const existingBadge = product.querySelector('.asin-filter-badge');
  if (existingBadge) existingBadge.remove();
  
  const badge = document.createElement('div');
  badge.className = 'asin-filter-badge';
  badge.textContent = `✓ ASIN: ${asin}`;
  
  // Try to insert at the top of the product card
  const insertTarget = product.querySelector('h2, .s-title-instructions-style') || product.firstChild;
  if (insertTarget) {
    insertTarget.parentNode.insertBefore(badge, insertTarget);
  }
}

function addFilterIndicator() {
  // Remove existing indicator
  removeFilterIndicator();
  
  const indicator = document.createElement('div');
  indicator.id = 'asin-filter-indicator';
  indicator.innerHTML = `
    <div class="asin-filter-indicator-content">
      <span class="indicator-icon">🔍</span>
      <span class="indicator-text">ASIN Filter Active</span>
      <span class="indicator-stats" id="filter-stats"></span>
    </div>
  `;
  document.body.appendChild(indicator);
}

function updateFilterIndicator(visible, hidden) {
  const stats = document.getElementById('filter-stats');
  if (stats) {
    stats.textContent = `Showing: ${visible} | Hidden: ${hidden}`;
  }
}

function removeFilterIndicator() {
  const indicator = document.getElementById('asin-filter-indicator');
  if (indicator) indicator.remove();
}

function setupProductObserver() {
  // Disconnect existing observer if any
  if (window.asinFilterObserver) {
    window.asinFilterObserver.disconnect();
  }

  // Create observer to watch for new products being added
  const observer = new MutationObserver((mutations) => {
    if (currentConfig) {
      filterProducts();
    }
  });

  // Observe the main search results container
  const searchContainer = document.querySelector('.s-search-results, .s-result-list');
  if (searchContainer) {
    observer.observe(searchContainer, {
      childList: true,
      subtree: true
    });
  }

  window.asinFilterObserver = observer;
}

// Auto-apply filter if settings are saved and we're on a search page
chrome.storage.sync.get(['autoApply', 'asins'], (data) => {
  if (data.autoApply && data.asins && window.location.href.includes('/s?')) {
    // Auto-apply after page loads
    setTimeout(() => {
      chrome.storage.sync.get(null, (settings) => {
        const config = {
          asins: settings.asins.split(/[\n,]+/).map(a => a.trim().toUpperCase()).filter(a => a),
          brandFilter: settings.brandFilter !== false,
          excludeBrand: settings.excludeBrand || 'otterbox',
          minRating: parseFloat(settings.minRating) || 4.0,
          minPurchases: parseInt(settings.minPurchases) || 50,
          amazonShipping: settings.amazonShipping !== false,
          inStockOnly: settings.inStockOnly !== false,
          maxDeliveryDays: parseInt(settings.maxDeliveryDays) || 8,
          searchSponsoredOnly: settings.searchSponsoredOnly !== false
        };
        applyProductFilter(config);
      });
    }, 2000);
  }
});

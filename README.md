# Amazon ASIN Filter Extension

A Chrome extension that filters Amazon search results based on ASIN numbers and advanced filtering criteria.

## Features

✅ **ASIN-based filtering**: Enter multiple ASINs to show only specific products
✅ **Brand filtering**: Exclude specific brands (default: Otterbox)
✅ **Rating filter**: Show only products with 4.0+ star ratings
✅ **Purchase count filter**: Show products with 50+ purchases
✅ **Amazon shipping only**: Filter for Prime/Amazon-shipped items
✅ **Stock availability**: Show only in-stock products
✅ **Delivery date filter**: Show products deliverable within 8 days
✅ **Sponsored items filter**: Include only sponsored items in search results

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `asin-extension` folder
6. The extension icon should appear in your toolbar

### Creating Icons (Optional)

The extension includes an SVG icon template. To create PNG icons:

1. Open `icons/icon.svg` in an image editor (like GIMP, Photoshop, or Inkscape)
2. Export as PNG at these sizes:
   - 16x16px → save as `icon16.png`
   - 48x48px → save as `icon48.png`
   - 128x128px → save as `icon128.png`
3. Save all icons in the `icons/` folder

Or use an online SVG to PNG converter.

## Usage

1. **Navigate to Amazon**: Go to any Amazon product search page
2. **Open the extension**: Click the extension icon in your toolbar
3. **Enter ASINs**: Input one or more ASIN numbers (one per line or comma-separated)
   ```
   B08N5WRWNW
   B09G9FPHY6
   B07ZPKN6YR
   ```
4. **Configure filters**: Adjust the filter criteria as needed:
   - Minimum rating (default: 4.0)
   - Minimum purchases (default: 50)
   - Excluded brands (default: Otterbox)
   - Maximum delivery days (default: 8)
   - Other checkboxes for shipping, stock, sponsored items

5. **Apply filter**: Click "Apply Filter" button
6. **View results**: Products matching your criteria will be highlighted with a green border and badge

## Filter Criteria

### ASIN Matching
Only products with ASINs in your list will be shown.

### Brand Exclusion
Products from specified brands (e.g., Otterbox) will be filtered out.

### Rating Threshold
Only products with ratings of 4.0 stars or higher will be displayed.

### Purchase Count
Only products with 50+ purchases (or your specified amount) will be shown.

### Amazon Shipping
Only Prime or Amazon-shipped products will be included.

### Stock Status
Out-of-stock or unavailable products will be filtered out.

### Delivery Date
Only products that can be delivered within 8 days (or your specified timeframe) will be shown.

### Sponsored Items
When enabled, only sponsored items appearing in search results will be shown (other sponsored items will be filtered out).

## Saving Settings

Click the "Save Settings" button to persist your configuration. The extension will remember your ASINs and filter preferences.

## Clearing Filters

Click "Clear Filter" to restore all products and remove the filter.

## Technical Details

- **Manifest Version**: 3
- **Permissions**: 
  - activeTab (to access current Amazon page)
  - storage (to save settings)
  - scripting (to inject filter logic)
- **Supported Amazon domains**: .com, .ca, .co.uk, .de, .fr, .in

## File Structure

```
asin-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup logic
├── content.js            # Content script (filtering logic)
├── content.css           # Content script styles
├── background.js         # Service worker
├── icons/                # Extension icons
│   ├── icon.svg         # SVG template
│   ├── icon16.png       # 16x16 icon (create from SVG)
│   ├── icon48.png       # 48x48 icon (create from SVG)
│   └── icon128.png      # 128x128 icon (create from SVG)
└── README.md            # This file
```

## Troubleshooting

### Extension not working?
1. Refresh the Amazon page after installing the extension
2. Make sure you're on an Amazon search results page
3. Check that you've entered valid ASIN numbers
4. Open the browser console (F12) to see any error messages

### No products showing?
Your filter criteria might be too strict. Try:
1. Reducing the minimum rating
2. Lowering the minimum purchase count
3. Increasing the delivery days
4. Unchecking some filter options

### Products not updating?
The extension monitors for dynamically loaded content, but if you scroll and new products don't get filtered, click "Apply Filter" again.

## Privacy

This extension:
- ✅ Runs entirely locally in your browser
- ✅ Does NOT send any data to external servers
- ✅ Only accesses Amazon pages when you're browsing them
- ✅ Stores settings only in Chrome's local storage

## Development

To modify the extension:

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload any open Amazon pages

## License

MIT License - feel free to modify and distribute.

## Support

For issues or feature requests, please check the code comments or create an issue in the repository.

---

**Note**: This extension is for personal use and is not affiliated with Amazon.

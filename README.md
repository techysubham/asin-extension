# Amazon ASIN Extension

This Chrome extension helps you collect, filter, and export ASINs from Amazon search result pages. It also displays a badge with the ASIN on each product card for easy identification.

## Features
- Collect ASINs from Amazon search results
- Filter products by rating, brand, and purchase count
- Responsive ASIN badge on every product card
- Export collected ASINs

## Installation
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the extension folder.

## Usage
- Visit any Amazon search results page.
- Use the extension popup to collect and filter ASINs.
- ASIN badges will appear on each product card.

## Development
- Main logic: `content.js`
- Popup UI: `popup.html`, `popup.js`, `popup.css`
- Database support: `firebase-db.js`, `mongodb-db.js`, `db-service.js`, `db-config.js`

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

# OSRS Grand Exchange Dashboard

A real-time pricing dashboard for Old School RuneScape (OSRS) items, displaying live Grand Exchange data with interactive charts and trend analysis.

## Features

- **Real-time Price Data**: Live pricing information from the OSRS Wiki API
- **Multiple Item Tracking**: Monitor prices for Mithril Nails, Dragon Bones, Rune Scimitar, and more
- **Interactive Charts**: Visual price comparison and trading volume distribution
- **Auto-Refresh**: Automatic updates every 30 seconds (can be toggled)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Theme**: Easy on the eyes with a gaming-inspired dark theme

## Items Tracked

1. **Mithril Nails** (ID: 4819)
2. **Dragon Bones** (ID: 536)
3. **Rune Scimitar** (ID: 1333)
4. Death Rune (ID: 560)
5. Blood Rune (ID: 565)
6. Cannonball (ID: 2)
7. Shark (ID: 385)

## API Documentation

This dashboard uses the [OSRS Wiki Real-time Prices API](https://prices.runescape.wiki):

### Endpoints Used

- **Latest Prices**: `https://prices.runescape.wiki/api/v1/osrs/latest`
  - Returns real-time high/low prices and trading volumes

- **Item Mapping**: `https://prices.runescape.wiki/api/v1/osrs/mapping`
  - Provides item names, IDs, and metadata

### API Response Format

The API returns data in the following format:

```json
{
  "timestamp": 1234567890,
  "data": {
    "4819": {
      "high": 45,
      "highTime": 1234567890,
      "low": 44,
      "lowTime": 1234567889,
      "highPriceVolume": 12000,
      "lowPriceVolume": 8000
    }
  }
}
```

## Installation & Usage

### Quick Start

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd runescapeDASH
   ```

2. Open `index.html` in your web browser:
   - **Option 1**: Double-click `index.html`
   - **Option 2**: Use a local server (recommended):
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

3. The dashboard will automatically fetch and display the latest prices!

### Using a Local Server

For the best experience, run the dashboard with a local web server:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js (with http-server):**
```bash
npx http-server -p 8000
```

Then open your browser to `http://localhost:8000`

## Features Explained

### Price Cards

Each item card displays:
- **Item Name & ID**: Official OSRS item identification
- **Trend Indicator**: Visual representation of price movement
- **High/Low Prices**: Current buy and sell prices
- **Average Price**: Calculated mid-point
- **Trading Volume**: Number of items traded

### Charts

1. **Price Comparison Chart**: Bar chart showing high vs low prices across all tracked items
2. **Volume Distribution**: Doughnut chart showing relative trading volumes

### Controls

- **Refresh Button**: Manually update all prices immediately
- **Auto-Refresh Toggle**: Enable/disable automatic 30-second updates

## Technical Details

### Technologies Used

- **HTML5**: Structure and semantics
- **CSS3**: Responsive styling and animations
- **JavaScript (ES6+)**: Data fetching and UI updates
- **Chart.js v4.4.0**: Interactive data visualization
- **OSRS Wiki API**: Real-time pricing data

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### File Structure

```
runescapeDASH/
├── index.html          # Main HTML structure
├── styles.css          # Styling and theme
├── app.js              # JavaScript logic and API calls
└── README.md           # This file
```

## Adding More Items

To track additional items, edit the `TRACKED_ITEMS` object in `app.js`:

```javascript
const TRACKED_ITEMS = {
    4819: { name: 'Mithril nails', id: 4819 },
    536: { name: 'Dragon bones', id: 536 },
    1333: { name: 'Rune Scimitar', id: 1333 },
    // Add your item here:
    ITEM_ID: { name: 'Item Name', id: ITEM_ID }
};
```

Find item IDs on the [OSRS Wiki](https://oldschool.runescape.wiki).

## API Rate Limits

Please be respectful of the OSRS Wiki API:
- Default auto-refresh is set to 30 seconds
- Use a descriptive User-Agent (already configured)
- Don't refresh more frequently than necessary

## Troubleshooting

### Prices Not Loading

1. Check your internet connection
2. Ensure the OSRS Wiki API is accessible
3. Check browser console for errors (F12)
4. Try disabling ad blockers or CORS extensions

### Charts Not Displaying

1. Ensure JavaScript is enabled
2. Check that Chart.js CDN is accessible
3. Try clearing browser cache

## Credits

- **Data Source**: [OSRS Wiki](https://oldschool.runescape.wiki)
- **API**: [prices.runescape.wiki](https://prices.runescape.wiki)
- **Charts**: [Chart.js](https://www.chartjs.org)

## Disclaimer

This project is not affiliated with or endorsed by Jagex Ltd. Old School RuneScape is a registered trademark of Jagex Ltd.

## License

MIT License - Feel free to use and modify for your own projects!
// OSRS Grand Exchange Dashboard
// Using the OSRS Wiki Real-time Prices API

// API Configuration
const API_BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRS-Dashboard-Demo - Learning Project';

// Item IDs for the tracked items (from OSRS Wiki)
const TRACKED_ITEMS = {
    4819: { name: 'Mithril nails', id: 4819 },
    536: { name: 'Dragon bones', id: 536 },
    1333: { name: 'Rune scimitar', id: 1333 },
    // Additional popular items
    560: { name: 'Death rune', id: 560 },
    565: { name: 'Blood rune', id: 565 },
    2: { name: 'Cannonball', id: 2 },
    385: { name: 'Shark', id: 385 }
};

// State management
let priceData = {};
let historicalData = {};
let autoRefreshInterval = null;
let priceComparisonChart = null;
let volumeChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    fetchPriceData();
    initializeCharts();

    // Start auto-refresh if enabled
    if (document.getElementById('autoRefresh').checked) {
        startAutoRefresh();
    }
});

// Event listeners
function initializeEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => {
        fetchPriceData();
    });

    document.getElementById('autoRefresh').addEventListener('change', (e) => {
        if (e.target.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
}

// Auto-refresh functionality
function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing interval
    autoRefreshInterval = setInterval(() => {
        fetchPriceData();
    }, 30000); // 30 seconds
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Fetch latest price data from OSRS Wiki API
async function fetchPriceData() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.classList.add('updating');

    try {
        // Fetch latest prices
        const response = await fetch(`${API_BASE_URL}/latest`, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        // Fetch mapping data to get item names
        const mappingResponse = await fetch(`${API_BASE_URL}/mapping`, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        if (mappingResponse.ok) {
            const mappingData = await mappingResponse.json();
            updateItemNames(mappingData);
        }

        priceData = data.data;
        updateLastUpdateTime(data.timestamp || Date.now());
        renderItemCards();
        updateCharts();

    } catch (error) {
        console.error('Error fetching price data:', error);
        showError('Failed to fetch price data. Please try again later.');
    } finally {
        refreshBtn.classList.remove('updating');
    }
}

// Update item names from mapping data
function updateItemNames(mappingData) {
    mappingData.forEach(item => {
        if (TRACKED_ITEMS[item.id]) {
            TRACKED_ITEMS[item.id].name = item.name;
            TRACKED_ITEMS[item.id].examine = item.examine;
            TRACKED_ITEMS[item.id].members = item.members;
            TRACKED_ITEMS[item.id].limit = item.limit;
        }
    });
}

// Update last update timestamp
function updateLastUpdateTime(timestamp) {
    const date = new Date(timestamp);
    const timeString = date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Render item cards
function renderItemCards() {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '';

    Object.values(TRACKED_ITEMS).forEach(item => {
        const itemData = priceData[item.id];

        if (!itemData) {
            return;
        }

        const card = createItemCard(item, itemData);
        grid.appendChild(card);
    });
}

// Create individual item card
function createItemCard(item, data) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const highPrice = data.high || 0;
    const lowPrice = data.low || 0;
    const avgPrice = highPrice && lowPrice ? Math.round((highPrice + lowPrice) / 2) : (highPrice || lowPrice);

    const highVolume = data.highPriceVolume || 0;
    const lowVolume = data.lowPriceVolume || 0;

    // Calculate trend (simplified - comparing high vs low)
    let trend = 'stable';
    let trendIcon = '━';
    let trendPercent = 0;

    if (highPrice && lowPrice) {
        const diff = highPrice - lowPrice;
        trendPercent = ((diff / lowPrice) * 100).toFixed(2);

        if (diff > lowPrice * 0.02) {
            trend = 'up';
            trendIcon = '↑';
        } else if (diff < -lowPrice * 0.02) {
            trend = 'down';
            trendIcon = '↓';
        }
    }

    card.innerHTML = `
        <div class="item-header">
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-id">ID: ${item.id}</div>
            </div>
            <div class="trend-indicator trend-${trend}">
                ${trendIcon} ${Math.abs(trendPercent)}%
            </div>
        </div>

        <div class="price-info">
            <div class="price-row">
                <span class="price-label">High Price:</span>
                <span class="price-value price-high">${formatGP(highPrice)}</span>
            </div>
            <div class="price-row">
                <span class="price-label">Low Price:</span>
                <span class="price-value price-low">${formatGP(lowPrice)}</span>
            </div>
            <div class="price-row">
                <span class="price-label">Average:</span>
                <span class="price-value price-neutral">${formatGP(avgPrice)}</span>
            </div>
        </div>

        <div class="volume-info">
            <div class="volume-row">
                <span class="price-label">High Volume:</span>
                <span>${formatNumber(highVolume)}</span>
            </div>
            <div class="volume-row">
                <span class="price-label">Low Volume:</span>
                <span>${formatNumber(lowVolume)}</span>
            </div>
            <div class="volume-row">
                <span class="price-label">Total Volume:</span>
                <span><strong>${formatNumber(highVolume + lowVolume)}</strong></span>
            </div>
        </div>
    `;

    return card;
}

// Format gold pieces (GP)
function formatGP(amount) {
    if (!amount) return '0 gp';

    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(2)}M gp`;
    } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K gp`;
    } else {
        return `${amount} gp`;
    }
}

// Format numbers with commas
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Initialize charts
function initializeCharts() {
    const priceCtx = document.getElementById('priceComparisonChart');
    const volumeCtx = document.getElementById('volumeChart');

    // Price Comparison Chart
    priceComparisonChart = new Chart(priceCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'High Price',
                data: [],
                backgroundColor: 'rgba(76, 175, 80, 0.6)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2
            }, {
                label: 'Low Price',
                data: [],
                backgroundColor: 'rgba(244, 67, 54, 0.6)',
                borderColor: 'rgba(244, 67, 54, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Price Comparison',
                    color: '#d4af37',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e0e0e0',
                        callback: function(value) {
                            return formatGP(value);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    // Volume Chart
    volumeChart = new Chart(volumeCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                label: 'Trading Volume',
                data: [],
                backgroundColor: [
                    'rgba(212, 175, 55, 0.8)',
                    'rgba(139, 115, 85, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(244, 67, 54, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(156, 39, 176, 0.8)'
                ],
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Trading Volume Distribution',
                    color: '#d4af37',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        padding: 15
                    }
                }
            }
        }
    });
}

// Update charts with current data
function updateCharts() {
    if (!priceComparisonChart || !volumeChart) return;

    const labels = [];
    const highPrices = [];
    const lowPrices = [];
    const volumes = [];

    Object.values(TRACKED_ITEMS).forEach(item => {
        const itemData = priceData[item.id];

        if (itemData) {
            labels.push(item.name);
            highPrices.push(itemData.high || 0);
            lowPrices.push(itemData.low || 0);
            volumes.push((itemData.highPriceVolume || 0) + (itemData.lowPriceVolume || 0));
        }
    });

    // Update price comparison chart
    priceComparisonChart.data.labels = labels;
    priceComparisonChart.data.datasets[0].data = highPrices;
    priceComparisonChart.data.datasets[1].data = lowPrices;
    priceComparisonChart.update();

    // Update volume chart
    volumeChart.data.labels = labels;
    volumeChart.data.datasets[0].data = volumes;
    volumeChart.update();
}

// Show error message
function showError(message) {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = `
        <div class="error">
            <strong>Error:</strong> ${message}
        </div>
    `;
}

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
let historicalData = {}; // Stores up to 1 day of price data for each item
let itemMiniCharts = {}; // Stores Chart.js instances for mini-graphs
let autoRefreshInterval = null;
let priceComparisonChart = null;
let volumeChart = null;

// Configuration for historical data (1 day at 30s intervals = 2880 data points max)
const MAX_HISTORICAL_POINTS = 2880; // 24 hours * 60 minutes * 2 (30s intervals)

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
        storeHistoricalData(data.timestamp || Date.now());
        renderItemCards();
        updateCharts();
        updateMiniCharts();

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

// Store historical price data for mini-graphs
function storeHistoricalData(timestamp) {
    Object.values(TRACKED_ITEMS).forEach(item => {
        const itemData = priceData[item.id];

        if (!itemData) return;

        // Initialize historical data array for this item if it doesn't exist
        if (!historicalData[item.id]) {
            historicalData[item.id] = [];
        }

        const highPrice = itemData.high || 0;
        const lowPrice = itemData.low || 0;
        const avgPrice = highPrice && lowPrice ? Math.round((highPrice + lowPrice) / 2) : (highPrice || lowPrice);

        // Add new data point
        historicalData[item.id].push({
            timestamp: timestamp,
            avgPrice: avgPrice,
            highPrice: highPrice,
            lowPrice: lowPrice,
            highVolume: itemData.highPriceVolume || 0,
            lowVolume: itemData.lowPriceVolume || 0
        });

        // Keep only the last 24 hours of data (2880 data points at 30s intervals)
        if (historicalData[item.id].length > MAX_HISTORICAL_POINTS) {
            historicalData[item.id].shift();
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

        <div class="mini-chart-container">
            <div class="mini-chart-header">24-Hour Price Trend</div>
            <canvas id="miniChart-${item.id}" class="mini-chart"></canvas>
        </div>
    `;

    // Create mini-chart after DOM insertion
    setTimeout(() => createMiniChart(item.id), 0);

    return card;
}

// Create mini-chart for an item
function createMiniChart(itemId) {
    const canvas = document.getElementById(`miniChart-${itemId}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Get historical data for this item
    const history = historicalData[itemId] || [];

    // Prepare data for the chart
    const labels = history.map(point => {
        const date = new Date(point.timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });

    const prices = history.map(point => point.avgPrice);

    // Destroy existing chart if it exists
    if (itemMiniCharts[itemId]) {
        itemMiniCharts[itemId].destroy();
    }

    // Create gradient for line
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.05)');

    // Create new chart
    itemMiniCharts[itemId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Price',
                data: prices,
                borderColor: '#d4af37',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#d4af37',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointHoverBackgroundColor: '#f0c850',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    titleColor: '#d4af37',
                    bodyColor: '#e0e0e0',
                    borderColor: '#d4af37',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            if (history[context[0].dataIndex]) {
                                const timestamp = history[context[0].dataIndex].timestamp;
                                const date = new Date(timestamp);
                                return date.toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                });
                            }
                            return '';
                        },
                        label: function(context) {
                            const dataPoint = history[context.dataIndex];
                            if (!dataPoint) return '';

                            return [
                                `Average: ${formatGP(dataPoint.avgPrice)}`,
                                `High: ${formatGP(dataPoint.highPrice)}`,
                                `Low: ${formatGP(dataPoint.lowPrice)}`,
                                `High Vol: ${formatNumber(dataPoint.highVolume)}`,
                                `Low Vol: ${formatNumber(dataPoint.lowVolume)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

// Update all mini-charts with latest data
function updateMiniCharts() {
    Object.keys(itemMiniCharts).forEach(itemId => {
        createMiniChart(parseInt(itemId));
    });
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

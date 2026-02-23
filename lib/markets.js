// Central market registry
// Adding a new market = insert to DB + add entry here
// No code changes needed anywhere else

export const MARKETS = {
  DUBAI_AUTO_MARKET: '00000000-0000-0000-0000-000000000010',
};

export const MARKET_CONFIG = {
  [MARKETS.DUBAI_AUTO_MARKET]: {
    name: 'Dubai Auto Market',
    city: 'Dubai',
    address: 'Ras Al Khor Industrial Area 1, Dubai, UAE',
    coordinates: { lat: 25.1849, lng: 55.3248 },
    google_maps_url: 'https://maps.google.com/?q=Dubai+Auto+Market+Ras+Al+Khor',
    sections: ['A', 'B', 'C', 'D', 'E'],
    gates: ['Gate 1', 'Gate 2', 'Gate 3'],
    operating_hours: 'Sat–Thu 8am–8pm, Fri 4pm–8pm',
    total_showrooms: 800,
  }
};

export function getMarketConfig(marketId) {
  return MARKET_CONFIG[marketId] || null;
}

export function getAllMarkets() {
  return Object.entries(MARKET_CONFIG).map(([id, config]) => ({
    id,
    ...config
  }));
}


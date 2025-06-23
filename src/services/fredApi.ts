
export interface RateData {
  date: string;
  value: number;
  title: string;
  series_id: string;
}

export interface FredApiResponse {
  observations: Array<{
    date: string;
    value: string;
  }>;
}

// Using CORS proxy to access FRED API
const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_API_KEY = 'fd4f231b539db735d3e4ba635a444b92';

export const RATE_SERIES = {
  PRIME: {
    id: 'DPRIME',
    title: 'Prime Rate',
    description: 'Bank Prime Loan Rate'
  },
  TREASURY_10Y: {
    id: 'DGS10',
    title: '10-Year Treasury',
    description: '10-Year Treasury Constant Maturity Rate'
  },
  TREASURY_2Y: {
    id: 'DGS2',
    title: '2-Year Treasury',
    description: '2-Year Treasury Constant Maturity Rate'
  },
  SOFR: {
    id: 'SOFR',
    title: 'SOFR',
    description: 'Secured Overnight Financing Rate'
  }
};

export const fetchRateData = async (seriesId: string): Promise<RateData | null> => {
  try {
    const fredUrl = `${FRED_API_BASE}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(fredUrl)}`;
    
    console.log(`Fetching data for ${seriesId} via proxy:`, proxyUrl);
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const proxyData = await response.json();
    const data: FredApiResponse = JSON.parse(proxyData.contents);
    console.log(`Response for ${seriesId}:`, data);
    
    if (data.observations && data.observations.length > 0) {
      const latest = data.observations[0];
      const seriesInfo = Object.values(RATE_SERIES).find(s => s.id === seriesId);
      
      // Skip if value is "." (missing data)
      if (latest.value === '.') {
        console.log(`No data available for ${seriesId} on ${latest.date}`);
        return null;
      }
      
      return {
        date: latest.date,
        value: parseFloat(latest.value),
        title: seriesInfo?.title || seriesId,
        series_id: seriesId
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching data for ${seriesId}:`, error);
    // Return mock data as fallback
    const seriesInfo = Object.values(RATE_SERIES).find(s => s.id === seriesId);
    return {
      date: new Date().toISOString().split('T')[0],
      value: getMockRate(seriesId),
      title: seriesInfo?.title || seriesId,
      series_id: seriesId
    };
  }
};

// Mock data as fallback
const getMockRate = (seriesId: string): number => {
  const mockRates: Record<string, number> = {
    'DPRIME': 8.50,
    'DGS10': 4.25,
    'DGS2': 4.15,
    'SOFR': 5.35
  };
  return mockRates[seriesId] || 0;
};

export const fetchAllRates = async (): Promise<RateData[]> => {
  console.log('Fetching all rates...');
  const promises = Object.values(RATE_SERIES).map(series => 
    fetchRateData(series.id)
  );
  
  const results = await Promise.all(promises);
  const validResults = results.filter((rate): rate is RateData => rate !== null);
  console.log('All rates fetched:', validResults);
  return validResults;
};

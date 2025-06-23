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

// Using a different CORS proxy that works better with FRED API
const CORS_PROXY = 'https://corsproxy.io/?';
const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_API_KEY = 'fd4f231b539db735d3e4ba635a444b92';

export const RATE_SERIES = {
  PRIME: {
    id: 'DPRIME',
    title: 'Prime Rate',
    description: 'Bank Prime Loan Rate'
  },
  SOFR: {
    id: 'SOFR',
    title: 'SOFR',
    description: 'Secured Overnight Financing Rate'
  },
  TREASURY_1Y: {
    id: 'DGS1',
    title: '1-Year Treasury',
    description: '1-Year Treasury Constant Maturity Rate'
  },
  TREASURY_2Y: {
    id: 'DGS2',
    title: '2-Year Treasury',
    description: '2-Year Treasury Constant Maturity Rate'
  },
  TREASURY_5Y: {
    id: 'DGS5',
    title: '5-Year Treasury',
    description: '5-Year Treasury Constant Maturity Rate'
  },
  TREASURY_10Y: {
    id: 'DGS10',
    title: '10-Year Treasury',
    description: '10-Year Treasury Constant Maturity Rate'
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
    
    const data: FredApiResponse = await response.json();
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
    return null;
  }
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

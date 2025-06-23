
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
    const url = `${FRED_API_BASE}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
    
    console.log(`Fetching data for ${seriesId} from:`, url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: FredApiResponse = await response.json();
    console.log(`Response for ${seriesId}:`, data);
    
    if (data.observations && data.observations.length > 0) {
      const latest = data.observations[0];
      const seriesInfo = Object.values(RATE_SERIES).find(s => s.id === seriesId);
      
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

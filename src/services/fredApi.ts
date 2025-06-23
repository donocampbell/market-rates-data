export interface RateData {
  date: string;
  value: number;
  title: string;
  series_id: string;
}

// Use the Vercel proxy instead of calling Nasdaq directly
const API_BASE = '/api/nasdaq-proxy';

export const RATE_SERIES = {
  PRIME: {
    id: 'FRED/DPRIME',
    title: 'Prime Rate',
    description: 'Bank Prime Loan Rate',
    column: 1 // value column index (1-based)
  },
  SOFR: {
    id: 'NYFED/SOFR',
    title: 'SOFR',
    description: 'Secured Overnight Financing Rate',
    column: 1
  },
  TREASURY_1Y: {
    id: 'USTREASURY/YIELD',
    title: '1-Year Treasury',
    description: '1-Year Treasury Constant Maturity Rate',
    column: 4 // 1 YR column in USTREASURY/YIELD
  },
  TREASURY_2Y: {
    id: 'USTREASURY/YIELD',
    title: '2-Year Treasury',
    description: '2-Year Treasury Constant Maturity Rate',
    column: 5 // 2 YR column
  },
  TREASURY_5Y: {
    id: 'USTREASURY/YIELD',
    title: '5-Year Treasury',
    description: '5-Year Treasury Constant Maturity Rate',
    column: 7 // 5 YR column
  },
  TREASURY_10Y: {
    id: 'USTREASURY/YIELD',
    title: '10-Year Treasury',
    description: '10-Year Treasury Constant Maturity Rate',
    column: 9 // 10 YR column
  }
};

// Helper to get the correct value from USTREASURY/YIELD columns
const getTreasuryValue = (row: any[], column: number) => {
  // row[0] is date, columns are 1-based
  const val = row[column];
  return val === null ? null : parseFloat(val);
};

export const fetchRateData = async (seriesId: string): Promise<RateData | null> => {
  try {
    const seriesInfo = Object.values(RATE_SERIES).find(s => s.id === seriesId || s.id.split('/')[1] === seriesId);
    if (!seriesInfo) return null;
    
    const params = new URLSearchParams({
      dataset: seriesInfo.id,
      rows: '1',
      order: 'desc'
    });
    
    const url = `${API_BASE}?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Nasdaq fetchRateData response:', data);
    const dataset = data.dataset;
    const latest = dataset.data[0];
    let value: number | null = null;
    if (seriesInfo.id === 'USTREASURY/YIELD') {
      value = getTreasuryValue(latest, seriesInfo.column);
    } else {
      value = latest[1] !== null ? parseFloat(latest[1]) : null;
    }
    if (value === null) return null;
    return {
      date: latest[0],
      value,
      title: seriesInfo.title,
      series_id: seriesInfo.id
    };
  } catch (error) {
    console.error(`Error fetching Nasdaq data for ${seriesId}:`, error);
    return null;
  }
};

export const fetchAllRates = async (): Promise<RateData[]> => {
  const promises = Object.values(RATE_SERIES).map(series => fetchRateData(series.id));
  const results = await Promise.all(promises);
  return results.filter((rate): rate is RateData => rate !== null);
};

export const fetchRateHistory = async (
  seriesId: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; value: number }[]> => {
  try {
    const seriesInfo = Object.values(RATE_SERIES).find(s => s.id === seriesId || s.id.split('/')[1] === seriesId);
    if (!seriesInfo) return [];
    
    const params = new URLSearchParams({
      dataset: seriesInfo.id,
      start_date: startDate,
      end_date: endDate,
      order: 'asc',
      collapse: 'daily'
    });
    
    const url = `${API_BASE}?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Nasdaq fetchRateHistory response:', data);
    const dataset = data.dataset;
    // For USTREASURY/YIELD, columns: [DATE, 1 MO, 2 MO, 3 MO, 6 MO, 1 YR, 2 YR, 3 YR, 5 YR, 7 YR, 10 YR, 20 YR, 30 YR]
    return dataset.data
      .map((row: any[]) => {
        let value: number | null = null;
        if (seriesInfo.id === 'USTREASURY/YIELD') {
          value = getTreasuryValue(row, seriesInfo.column);
        } else {
          value = row[1] !== null ? parseFloat(row[1]) : null;
        }
        return value !== null ? { date: row[0], value } : null;
      })
      .filter((d: any) => d !== null);
  } catch (error) {
    console.error(`Error fetching Nasdaq history for ${seriesId}:`, error);
    return [];
  }
};

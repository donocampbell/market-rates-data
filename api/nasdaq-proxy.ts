import type { VercelRequest, VercelResponse } from '@vercel/node';

const NASDAQ_API_KEY = process.env.NASDAQ_API_KEY;
const NASDAQ_API_BASE = 'https://data.nasdaq.com/api/v3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!NASDAQ_API_KEY) {
    return res.status(500).json({ error: 'NASDAQ_API_KEY not configured' });
  }

  try {
    const { dataset, ...queryParams } = req.query;
    
    if (!dataset) {
      return res.status(400).json({ error: 'Dataset parameter is required' });
    }

    // Build the Nasdaq API URL
    const url = new URL(`${NASDAQ_API_BASE}/datasets/${dataset}.json`);
    url.searchParams.set('api_key', NASDAQ_API_KEY);
    
    // Add all other query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        url.searchParams.set(key, value);
      }
    });

    console.log('Proxying request to:', url.toString());

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 
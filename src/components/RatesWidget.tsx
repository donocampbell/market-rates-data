
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { fetchAllRates, RateData } from '@/services/fredApi';

const RatesWidget = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: rates, isLoading, error, refetch } = useQuery({
    queryKey: ['rates'],
    queryFn: fetchAllRates,
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  // Update lastUpdated when we get new data
  useEffect(() => {
    if (rates) {
      setLastUpdated(new Date());
    }
  }, [rates]);

  const formatRate = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (error) {
    return (
      <Card className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading rates data. Please check your FRED API key.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Current Market Rates
            </h2>
            <p className="text-slate-600">
              Live benchmark rates from Federal Reserve Economic Data
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-100 to-green-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Rate Type
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  Current Rate
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  As of Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rates?.map((rate, index) => (
                <tr 
                  key={rate.series_id}
                  className={`hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        rate.title.includes('Prime') ? 'bg-blue-400' :
                        rate.title.includes('Treasury') ? 'bg-green-400' :
                        'bg-purple-400'
                      }`} />
                      <div>
                        <div className="font-medium text-slate-900">
                          {rate.title}
                        </div>
                        <div className="text-sm text-slate-500">
                          Series: {rate.series_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {formatRate(rate.value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-slate-700">
                      {formatDate(rate.date)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500 text-center">
        Data sourced from Federal Reserve Economic Data (FRED) • Updates hourly
      </div>
    </Card>
  );
};

export default RatesWidget;

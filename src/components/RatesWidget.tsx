import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Clock, AlertCircle } from 'lucide-react';
import { fetchAllRates, RateData, fetchRateHistory } from '@/services/fredApi';
import Sparkline from './Sparkline';

function downsampleToMonthly(values: number[], dates: string[]): { values: number[]; dates: string[] } {
  if (!values.length || !dates.length || values.length !== dates.length) return { values: [], dates: [] };
  const monthly: { [key: string]: { value: number; date: string } } = {};
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    // Always take the latest value for the month
    monthly[key] = { value: values[i], date: dates[i] };
  }
  // Sort by date ascending
  const sorted = Object.values(monthly).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return {
    values: sorted.map((m) => m.value),
    dates: sorted.map((m) => m.date),
  };
}

const RatesWidget = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [historyData, setHistoryData] = useState<Record<string, { values: number[]; dates: string[] }>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});

  const { data: rates, isLoading, error, refetch } = useQuery({
    queryKey: ['rates'],
    queryFn: fetchAllRates,
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  // Update lastUpdated when we get new data
  useEffect(() => {
    if (rates) {
      setLastUpdated(new Date());
      // Fetch 1 year of history for each rate
      const today = new Date();
      const lastYear = new Date();
      lastYear.setFullYear(today.getFullYear() - 1);
      const endDate = today.toISOString().slice(0, 10);
      const startDate = lastYear.toISOString().slice(0, 10);
      rates.forEach((rate) => {
        if (!historyData[rate.series_id] && !loadingHistory[rate.series_id]) {
          setLoadingHistory((prev) => ({ ...prev, [rate.series_id]: true }));
          fetchRateHistory(rate.series_id, startDate, endDate).then((history) => {
            // Sort by date ascending
            const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            // Ensure last value matches current rate
            let values = sorted.map((h) => h.value);
            let dates = sorted.map((h) => h.date);
            if (values.length > 0 && values[values.length - 1] !== rate.value) {
              values[values.length - 1] = rate.value;
            }
            setHistoryData((prev) => ({
              ...prev,
              [rate.series_id]: { values, dates },
            }));
            setLoadingHistory((prev) => ({ ...prev, [rate.series_id]: false }));
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  1YR Rate Lines
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
                  <td className="px-6 py-4 text-center">
                    {loadingHistory[rate.series_id] ? (
                      <span className="w-28 h-6 bg-slate-100 rounded animate-pulse inline-block" />
                    ) : historyData[rate.series_id] ? (
                      (() => {
                        const { values: monthlyValues, dates: monthlyDates } = downsampleToMonthly(
                          historyData[rate.series_id].values,
                          historyData[rate.series_id].dates
                        );
                        return (
                          <Sparkline
                            data={historyData[rate.series_id].values}
                            dates={historyData[rate.series_id].dates}
                            monthlyData={monthlyValues}
                            monthlyDates={monthlyDates}
                            width={100}
                            height={32}
                          />
                        );
                      })()
                    ) : null}
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

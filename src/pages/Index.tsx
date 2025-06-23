
import RatesWidget from '@/components/RatesWidget';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Financial Market Rates
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real-time benchmark interest rates including Prime Rate, Treasury yields, and SOFR
          </p>
        </div>
        
        <RatesWidget />
        
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              About This Widget
            </h3>
            <div className="text-left space-y-2 text-sm text-slate-600">
              <p>
                • Data sourced from Federal Reserve Economic Data (FRED)
              </p>
              <p>
                • Rates update automatically every hour
              </p>
              <p>
                • Displays latest available data for each benchmark rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

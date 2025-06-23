import React from "react";
import RatesWidget from "../components/RatesWidget";
import SimpleHeader from "../components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <SimpleHeader />
      <div className="py-8 px-4">
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
        </div>
      </div>
    </div>
  );
};

export default Index;

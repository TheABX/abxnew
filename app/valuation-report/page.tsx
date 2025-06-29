'use client'

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

function RevenuePieChart({ revenue, profit, addBacks }: { revenue: number, profit: number, addBacks: number }) {
  const data = [
    { name: 'Revenue', value: revenue || 0 },
    { name: 'Profit', value: profit || 0 },
    { name: 'Add-Backs', value: addBacks || 0 }
  ];
  return (
    <PieChart width={400} height={300}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        outerRadius={100}
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
}

export default function ValuationReportPage() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('valuationResult');
    if (stored) {
      setReport(JSON.parse(stored));
    }
  }, []);

  // Placeholder chart (replace with real chart library if needed)
  const Chart = ({ value, label }: { value: number, label: string }) => (
    <div className="mb-2">
      <div className="flex items-center mb-1">
        <span className="text-sm text-gray-700 mr-2 w-32">{label}</span>
        <div className="flex-1 bg-gray-200 rounded h-4">
          <div className="bg-blue-500 h-4 rounded" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className="ml-2 text-sm font-semibold text-blue-700">{value}%</span>
      </div>
    </div>
  );

  // Collapsible state for full letter
  const [showFullLetter, setShowFullLetter] = useState(false);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-2">No Valuation Data</h2>
          <p className="text-gray-600">Please submit your business details first.</p>
          <a href="/valuation" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all">Back to Valuation Tool</a>
        </div>
      </div>
    );
  }

  // Example: extract metrics (customize as needed)
  const { valuation, calculatedValue, method, metrics, drivers, risks, recommendations, aiSections } = report;
  // metrics may include: profitMargin, revenue, netProfit, addBacks, etc.
  const profitMargin = metrics?.profitMargin;
  const revenue = metrics?.revenue;
  const netProfit = metrics?.netProfit;
  const addBacks = metrics?.addBacks;
  const multiple = metrics?.multiple;

  // Extract industry benchmark multiple from aiSections.benchmarks (try to parse a number, fallback to 2.5)
  let industryBenchmark = 2.5;
  if (aiSections?.benchmarks) {
    const match = aiSections.benchmarks.match(/(\d+(\.\d+)?)[xX]/);
    if (match) {
      industryBenchmark = parseFloat(match[1]);
    }
  }
  // Use business multiple from metrics, fallback to 0
  const businessMultiple = multiple || 0;
  const benchmarkData = [
    { name: 'Your Business', Multiple: businessMultiple },
    { name: 'Industry Avg', Multiple: industryBenchmark }
  ];

  // Custom colors for the bar chart
  const BENCHMARK_COLORS = ['#2563eb', '#f59e42'];

  // Calculate a simple saleability score (1-10)
  function getSaleabilityScore() {
    let score = 5;
    // Profit margin
    if (profitMargin > 20) score += 2;
    else if (profitMargin > 10) score += 1;
    else if (profitMargin < 7) score -= 1;
    // Recurring revenue (for trade/generic)
    if (metrics?.recurring || metrics?.recurringRevenue === 'Yes') score += 1;
    // Owner involvement
    if (metrics?.ownerInvolvement === 'Low') score += 1;
    else if (metrics?.ownerInvolvement === 'High') score -= 1;
    // Drivers/Strengths
    if (drivers && drivers.length > 1) score += 1;
    // Risks
    if (risks && risks.length > 1) score -= 1;
    // Recommendations (if many, maybe more to fix)
    if (recommendations && recommendations.length > 2) score -= 1;
    // Clamp between 1 and 10
    return Math.max(1, Math.min(10, Math.round(score)));
  }
  const saleabilityScore = getSaleabilityScore();

  // Color for progress bar (red to yellow to green)
  function getScoreColor(score: number) {
    if (score <= 3) return 'bg-red-500';
    if (score <= 6) return 'bg-yellow-400';
    return 'bg-green-500';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Your Business Valuation Report</h1>
        {/* Valuation Summary Card */}
        <div className="mb-8 p-6 rounded-xl bg-blue-50 border border-blue-200">
          <h2 className="text-2xl font-semibold text-blue-900 mb-2">Valuation Summary</h2>
          <p className="text-lg text-blue-800 mb-2">Estimated Valuation: <span className="font-bold">{calculatedValue ? `$${calculatedValue.toLocaleString()}` : 'N/A'}</span></p>
          <p className="text-blue-700 mb-2">Method Used: <span className="font-medium">{method || 'N/A'}</span></p>
          <p className="text-blue-700 mb-2">{aiSections?.valuationConfirmation || 'No summary available.'}</p>
          <p className="text-blue-700">AI Analysis: <span className="font-medium">{valuation || 'N/A'}</span></p>
        </div>
        {/* Saleability Score Card */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 border border-green-200 shadow flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Business Saleability Score</h2>
          <div className="flex items-center w-full max-w-md mb-2">
            <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden relative">
              <div className={`h-6 rounded-full transition-all duration-500 ${getScoreColor(saleabilityScore)}`} style={{ width: `${(saleabilityScore/10)*100}%` }}></div>
              <div className="absolute inset-0 flex justify-between px-2 text-xs text-gray-500 font-semibold">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
            <span className="ml-4 text-3xl font-extrabold text-gray-900 drop-shadow-lg" style={{ minWidth: 48 }}>{saleabilityScore}</span>
          </div>
          <p className="text-gray-700 text-center max-w-md">This score estimates how attractive your business is to potential buyers, based on profitability, recurring revenue, owner involvement, and other key factors. A higher score means your business is more likely to sell quickly and at a strong price.</p>
        </div>
        {/* Valuation Methods Card */}
        <div className="mb-8 p-6 rounded-xl bg-white border border-gray-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Valuation Methods</h3>
          <p className="text-gray-700 mb-2">Other ways to value your business, each with its own focus and strengths.</p>
          <div className="prose prose-sm max-w-none text-blue-900 whitespace-pre-line">{aiSections?.valuationMethods || 'No additional methods provided.'}</div>
        </div>
        {/* Key Factors Card */}
        <div className="mb-8 p-6 rounded-xl bg-white border border-gray-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Key Value Drivers</h3>
          <p className="text-gray-700 mb-2">These are the main drivers that impact your business's value.</p>
          <div className="prose prose-sm max-w-none text-blue-900 whitespace-pre-line">{aiSections?.keyFactors || 'No key factors provided.'}</div>
        </div>
        {/* Risks & Opportunities Card */}
        <div className="mb-8 p-6 rounded-xl bg-white border border-gray-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Risks & Opportunities</h3>
          <p className="text-gray-700 mb-2">Risks may lower your valuation, while opportunities can help you grow.</p>
          <div className="prose prose-sm max-w-none text-blue-900 whitespace-pre-line">{aiSections?.risksAndOpportunities || 'No risks or opportunities provided.'}</div>
        </div>
        {/* Recommendations Card */}
        <div className="mb-8 p-6 rounded-xl bg-white border border-gray-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Recommendations</h3>
          <p className="text-gray-700 mb-2">Steps you can take to increase your business's value.</p>
          <div className="prose prose-sm max-w-none text-blue-900 whitespace-pre-line">{aiSections?.recommendations || 'No recommendations provided.'}</div>
        </div>
        {/* Benchmarks Card */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 shadow-lg">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Market Context & Industry Benchmarks</h3>
          <p className="text-gray-700 mb-4">How does your business's valuation multiple compare to the industry average?</p>
          {/* Custom Legend */}
          <div className="flex items-center gap-6 mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full" style={{ background: BENCHMARK_COLORS[0] }}></span>
              <span className="text-sm text-blue-900 font-medium">Your Business</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full" style={{ background: BENCHMARK_COLORS[1] }}></span>
              <span className="text-sm text-orange-700 font-medium">Industry Avg</span>
            </div>
          </div>
          {/* Bar chart comparing multiples */}
          <div className="w-full flex justify-center mb-4">
            <ResponsiveContainer width="100%" height={220} minWidth={320}>
              <BarChart data={benchmarkData} barCategoryGap={40} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 16, fontWeight: 600, fill: '#1e293b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, Math.max(businessMultiple, industryBenchmark, 3.5)]} tick={{ fontSize: 14, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => value.toFixed(2) + 'x'} cursor={{ fill: '#e0e7ff', opacity: 0.2 }} />
                <Bar dataKey="Multiple" radius={[10, 10, 0, 0]}>
                  {benchmarkData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={BENCHMARK_COLORS[idx]} />
                  ))}
                  <LabelList dataKey="Multiple" position="top" formatter={(v: number) => v.toFixed(2) + 'x'} style={{ fontWeight: 700, fontSize: 18, fill: '#1e293b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="prose prose-sm max-w-none text-blue-900 whitespace-pre-line mt-2">{aiSections?.benchmarks || 'No benchmarks provided.'}</div>
        </div>
        {/* Profitability Section (existing) */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profitability</h3>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
            <div className="mb-4 md:mb-0">
              <RevenuePieChart revenue={revenue || 240000} profit={netProfit || 36000} addBacks={addBacks || 10000} />
            </div>
            <div className="flex-1">
              <Chart value={profitMargin || 0} label="Profit Margin" />
              <Chart value={revenue ? Math.min(revenue / 10000, 100) : 0} label="Revenue (scaled)" />
              <Chart value={netProfit ? Math.min(netProfit / 10000, 100) : 0} label="Net Profit (scaled)" />
              <Chart value={multiple || 0} label="Valuation Multiple" />
            </div>
          </div>
        </div>
        {/* Strengths & Risks (existing, keep for now) */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Strengths & Risks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="list-disc pl-6 text-green-800">
                {(drivers && drivers.length > 0 ? drivers : ['Strong financials', 'Growing market']).map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-700 mb-1">Risks</h4>
              <ul className="list-disc pl-6 text-red-800">
                {(risks && risks.length > 0 ? risks : ['Customer concentration', 'Market volatility']).map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </div>
        {/* Recommendations Section (existing, keep for now) */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Recommendations</h3>
          <ul className="list-disc pl-6 text-blue-800">
            {(recommendations && recommendations.length > 0 ? recommendations : ['No specific recommendations at this time.']).map((rec: string, i: number) => <li key={i}>{rec}</li>)}
          </ul>
        </div>
        {/* Collapsible Full Letter */}
        <div className="mb-8">
          <button
            className="text-blue-700 underline mb-2"
            onClick={() => setShowFullLetter((prev) => !prev)}
          >
            {showFullLetter ? 'Hide Full AI Analysis' : 'Show Full AI Analysis'}
          </button>
          {showFullLetter && (
            <div className="prose prose-sm max-w-none bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2 text-blue-900 whitespace-pre-line">
              {aiSections?.fullLetter || 'No full analysis available.'}
            </div>
          )}
        </div>
        <div className="text-center mt-8">
          <a href="/valuation" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all">Back to Valuation Tool</a>
        </div>
      </div>
    </div>
  );
} 
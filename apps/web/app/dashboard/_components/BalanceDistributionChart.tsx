// components/BalanceDistributionChart.tsx

import { BalanceDistribution } from "../../types/result";

interface BalanceDistributionChartProps {
  data: BalanceDistribution[];
}

export default function BalanceDistributionChart({
  data,
}: BalanceDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Balance Distribution
        </h2>
        <p className="text-gray-400">No balance data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Balance Distribution
      </h2>

      <div className="space-y-4">
        {data.map((bucket, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">
                {bucket.range}
              </span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">
                  {bucket.count} wallet{bucket.count !== 1 ? "s" : ""} (
                  {bucket.percentage.toFixed(1)}%)
                </span>
                <span className="text-blue-400 font-medium">
                  {bucket.totalBalance.toFixed(4)} ETH
                </span>
              </div>
            </div>

            <div className="relative h-10 bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 flex items-center px-3"
                style={{
                  width: `${maxCount > 0 ? (bucket.count / maxCount) * 100 : 0}%`,
                }}
              >
                {bucket.count > 0 && (
                  <span className="text-xs font-bold text-white">
                    {bucket.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-750 rounded-lg border border-gray-600">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Distribution Insights
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Most Common Range:</span>
            <p className="text-white font-medium">
              {data.reduce((max, d) => (d.count > max.count ? d : max)).range}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Highest Balance Range:</span>
            <p className="text-white font-medium">
              {
                data.reduce((max, d) =>
                  d.totalBalance > max.totalBalance ? d : max
                ).range
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

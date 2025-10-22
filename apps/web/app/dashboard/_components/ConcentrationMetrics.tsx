// components/ConcentrationMetrics.tsx

import { ConcentrationMetrics, BalanceStatistics } from "../../types/result";

interface ConcentrationMetricsProps {
  concentration: ConcentrationMetrics;
  stats: BalanceStatistics;
}

export default function ConcentrationMetricsCard({
  concentration,
  stats,
}: ConcentrationMetricsProps) {
  const getGiniColor = (gini: number) => {
    if (gini >= 0.7) return "text-red-400";
    if (gini >= 0.5) return "text-orange-400";
    if (gini >= 0.35) return "text-yellow-400";
    if (gini >= 0.2) return "text-blue-400";
    return "text-green-400";
  };

  const getConcentrationColor = (level: string) => {
    switch (level) {
      case "Very High":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Moderate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Very Low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Token Concentration Analysis
      </h2>

      {/* Gini Coefficient */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">
            Gini Coefficient
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getConcentrationColor(concentration.concentrationLevel)}`}
          >
            {concentration.concentrationLevel}
          </span>
        </div>

        <div className="flex items-end gap-4 mb-2">
          <span
            className={`text-5xl font-bold ${getGiniColor(concentration.giniCoefficient)}`}
          >
            {concentration.giniCoefficient.toFixed(3)}
          </span>
          <span className="text-gray-500 text-sm mb-2">/ 1.000</span>
        </div>

        {/* Visual representation */}
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all ${
              concentration.giniCoefficient >= 0.7
                ? "bg-red-500"
                : concentration.giniCoefficient >= 0.5
                  ? "bg-orange-500"
                  : concentration.giniCoefficient >= 0.35
                    ? "bg-yellow-500"
                    : concentration.giniCoefficient >= 0.2
                      ? "bg-blue-500"
                      : "bg-green-500"
            }`}
            style={{ width: `${concentration.giniCoefficient * 100}%` }}
          />
        </div>

        <p className="text-xs text-gray-500">
          0 = Perfect equality | 1 = Perfect inequality
        </p>
      </div>

      {/* Top Holder Concentration */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Top 10% Hold</div>
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {concentration.top10Percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">of total supply</div>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Top 20% Hold</div>
          <div className="text-3xl font-bold text-pink-400 mb-1">
            {concentration.top20Percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">of total supply</div>
        </div>
      </div>

      {/* Herfindahl Index */}
      <div className="bg-gray-750 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-400">
            Herfindahl-Hirschman Index (HHI)
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {concentration.herfindahlIndex.toFixed(0)}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {concentration.herfindahlIndex < 1500
            ? "Competitive market"
            : concentration.herfindahlIndex < 2500
              ? "Moderate concentration"
              : "High concentration"}
        </div>
      </div>

      {/* Balance Statistics */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Balance Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total:</span>
            <span className="text-white font-medium">
              {stats.totalBalance.toFixed(4)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Average:</span>
            <span className="text-white font-medium">
              {stats.averageBalance.toFixed(6)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Median:</span>
            <span className="text-white font-medium">
              {stats.medianBalance.toFixed(6)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Std Dev:</span>
            <span className="text-white font-medium">
              {stats.standardDeviation.toFixed(6)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Max:</span>
            <span className="text-green-400 font-medium">
              {stats.maxBalance.toFixed(6)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Min:</span>
            <span className="text-red-400 font-medium">
              {stats.minBalance.toFixed(6)} ETH
            </span>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
        <strong>Understanding Gini Coefficient:</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>0.0 - 0.2: Very Low inequality (well distributed)</li>
          <li>0.2 - 0.35: Low inequality</li>
          <li>0.35 - 0.5: Moderate inequality</li>
          <li>0.5 - 0.7: High inequality (concentrated)</li>
          <li>0.7 - 1.0: Very High inequality (highly concentrated)</li>
        </ul>
      </div>
    </div>
  );
}

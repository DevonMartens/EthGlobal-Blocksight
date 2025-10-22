// components/GasAnalysis.tsx

import { GasAnalysis } from "../../types/result";

interface GasAnalysisProps {
  data: GasAnalysis;
}

export default function GasAnalysisCard({ data }: GasAnalysisProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Gas Spending Analysis
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Total Gas Spent</div>
          <div className="text-3xl font-bold text-orange-400 mb-1">
            {data.totalGasSpent.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500">ETH</div>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Avg Gas per TX</div>
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {data.averageGasPerTransaction.toFixed(6)}
          </div>
          <div className="text-xs text-gray-500">ETH</div>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Estimated Cost</div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            ${data.estimatedCostUSD.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">USD (approx)</div>
        </div>
      </div>

      {data.highestGasTransaction && (
        <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Highest Gas Transaction
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Gas Spent:</span>
              <span className="text-sm font-bold text-orange-400">
                {data.highestGasTransaction.gasSpent} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Transaction:</span>

              <a
                href={`https://etherscan.io/tx/${data.highestGasTransaction.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-blue-400 hover:text-blue-300"
              >
                {data.highestGasTransaction.hash.slice(0, 10)}...
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">From:</span>
              <span className="text-sm font-mono text-gray-300">
                {data.highestGasTransaction.from.slice(0, 6)}...
                {data.highestGasTransaction.from.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">To:</span>
              <span className="text-sm font-mono text-gray-300">
                {data.highestGasTransaction.to.slice(0, 6)}...
                {data.highestGasTransaction.to.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
        <strong>Note:</strong> Gas estimates are approximations based on
        transaction data. USD values use an estimated ETH price of $2,500.
      </div>
    </div>
  );
}

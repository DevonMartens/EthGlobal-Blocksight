// components/TransactionPatterns.tsx

import { TransactionPatterns } from "../../types/result";

interface TransactionPatternsProps {
  data: TransactionPatterns;
}

export default function TransactionPatternsCard({
  data,
}: TransactionPatternsProps) {
  // Percentages should be based on VOLUME, not counts
  const totalIOVolume = data.incomingVolume + data.outgoingVolume;
  const incomingPercentage =
    totalIOVolume > 0
      ? (data.incomingVolume / totalIOVolume) * 100
      : 50;

  const totalInternalExternalVolume = data.internalVolume + data.externalVolume;
  const internalPercentage =
    totalInternalExternalVolume > 0
      ? (data.internalVolume / totalInternalExternalVolume) * 100
      : 50;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Transaction Patterns
      </h2>

      <div className="space-y-6">
        {/* Incoming vs Outgoing */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-400">
              Incoming vs Outgoing
            </h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-400">Incoming</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-400">Outgoing</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-gray-750 p-4 rounded">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {data.totalIncoming}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Incoming Transactions
              </div>
              <div className="text-sm text-gray-300">
                {data.incomingVolume} ETH
              </div>
              <div className="text-xs text-gray-500">
                Avg: {data.averageIncomingSize} ETH
              </div>
            </div>

            <div className="bg-gray-750 p-4 rounded">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {data.totalOutgoing}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Outgoing Transactions
              </div>
              <div className="text-sm text-gray-300">
                {data.outgoingVolume} ETH
              </div>
              <div className="text-xs text-gray-500">
                Avg: {data.averageOutgoingSize} ETH
              </div>
            </div>
          </div>

          {/* Visual Bar */}
          <div className="h-8 flex rounded-lg overflow-hidden">
            <div
              className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${incomingPercentage}%` }}
            >
              {incomingPercentage.toFixed(0)}%
            </div>
            <div
              className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${100 - incomingPercentage}%` }}
            >
              {(100 - incomingPercentage).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Internal vs External */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-400">
              Internal vs External
            </h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-400">Internal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-400">External</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-gray-750 p-4 rounded">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {data.internalTransactions}
              </div>
              <div className="text-xs text-gray-400">
                Internal (within tracked wallets)
              </div>
            </div>

            <div className="bg-gray-750 p-4 rounded">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {data.externalTransactions}
              </div>
              <div className="text-xs text-gray-400">
                External (outside wallets)
              </div>
            </div>
          </div>

          {/* Visual Bar */}
          <div className="h-8 flex rounded-lg overflow-hidden">
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${internalPercentage}%` }}
            >
              {internalPercentage > 10 && `${internalPercentage.toFixed(0)}%`}
            </div>
            <div
              className="bg-purple-500 flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${100 - internalPercentage}%` }}
            >
              {100 - internalPercentage > 10 &&
                `${(100 - internalPercentage).toFixed(0)}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

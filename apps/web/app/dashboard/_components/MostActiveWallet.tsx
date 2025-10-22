// components/MostActiveWallets.tsx

import { ActiveWallet } from "../../types/result";

interface MostActiveWalletsProps {
  wallets: ActiveWallet[];
}

export default function MostActiveWallets({ wallets }: MostActiveWalletsProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Most Active Wallets</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">
                Rank
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">
                Wallet
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">
                Activity
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">
                Transactions
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">
                Volume
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">
                Avg Size
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">
                In/Out
              </th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((wallet, index) => (
              <tr
                key={wallet.address}
                className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
              >
                <td className="py-3 px-2">
                  <span className="font-bold text-gray-400">#{index + 1}</span>
                </td>
                <td className="py-3 px-2">
                  <span className="font-mono text-sm text-blue-400">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {wallet.activityIndex.toFixed(3)}
                    </span>
                    <ActivityIndicator value={wallet.activityIndex} />
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-white font-medium">
                    {wallet.transactionCount}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-green-400 font-medium">
                    {wallet.totalVolume} ETH
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-gray-300">
                    {wallet.averageTransactionSize} ETH
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-400">
                      ↓{wallet.incomingCount}
                    </span>
                    <span className="text-red-400">
                      ↑{wallet.outgoingCount}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityIndicator({ value }: { value: number }) {
  const getColor = () => {
    if (value >= 0.7) return "bg-green-500";
    if (value >= 0.5) return "bg-blue-500";
    if (value >= 0.3) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${getColor()} transition-all`}
        style={{ width: `${value * 100}%` }}
      ></div>
    </div>
  );
}

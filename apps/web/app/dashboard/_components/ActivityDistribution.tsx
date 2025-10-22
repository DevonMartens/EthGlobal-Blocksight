// components/ActivityDistribution.tsx

import { WalletWithActivity } from "../../types/result";

interface ActivityDistributionProps {
  wallets: WalletWithActivity[];
}

export default function ActivityDistribution({
  wallets,
}: ActivityDistributionProps) {
  // Create distribution buckets
  const buckets = [
    { label: "0.0-0.2", min: 0, max: 0.2, count: 0, color: "bg-red-500" },
    { label: "0.2-0.4", min: 0.2, max: 0.4, count: 0, color: "bg-orange-500" },
    { label: "0.4-0.6", min: 0.4, max: 0.6, count: 0, color: "bg-yellow-500" },
    { label: "0.6-0.8", min: 0.6, max: 0.8, count: 0, color: "bg-green-500" },
    { label: "0.8-1.0", min: 0.8, max: 1.0, count: 0, color: "bg-blue-500" },
  ];

  wallets.forEach((wallet) => {
    const bucket =
      buckets.find(
        (b) => wallet.activityIndex >= b.min && wallet.activityIndex < b.max
      ) || buckets[buckets.length - 1];
    if (bucket) {
      bucket.count++;
    }
  });

  const maxCount = Math.max(...buckets.map((b) => b.count));

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Activity Index Distribution
      </h2>
      <div className="space-y-4">
        {buckets.map((bucket, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 font-medium">
                {bucket.label}
              </span>
              <span className="text-sm text-gray-400">
                {bucket.count} wallet{bucket.count !== 1 ? "s" : ""} (
                {((bucket.count / wallets.length) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
              <div
                className={`h-full ${bucket.color} transition-all duration-500 flex items-center justify-end px-3`}
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
    </div>
  );
}

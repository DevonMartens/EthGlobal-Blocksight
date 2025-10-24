// components/ActivityDistribution.tsx
"use client";

import { WalletWithActivity } from "../../types/result";
import { useState } from "react";

interface ActivityDistributionProps {
  wallets: WalletWithActivity[];
}

interface Bucket {
  label: string;
  min: number;
  max: number;
  count: number;
  color: string;
  walletAddresses: string[];
}

/**
 * Create quantile-based bins (equal-count bins)
 */
function createQuantileBins(wallets: WalletWithActivity[], numBins: number = 3): Bucket[] {
  if (wallets.length === 0) return [];

  // Sort wallets by activity index
  const sortedWallets = [...wallets].sort((a, b) => a.activityIndex - b.activityIndex);
  
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-blue-500"];
  const buckets: Bucket[] = [];
  
  const walletsPerBin = Math.ceil(wallets.length / numBins);
  
  for (let i = 0; i < numBins; i++) {
    const startIdx = i * walletsPerBin;
    const endIdx = Math.min(startIdx + walletsPerBin, sortedWallets.length);
    const binWallets = sortedWallets.slice(startIdx, endIdx);
    
    if (binWallets.length === 0) continue;
    
    const min = binWallets[0]!.activityIndex;
    const max = binWallets[binWallets.length - 1]!.activityIndex;
    
    buckets.push({
      label: `${min.toFixed(2)}-${max.toFixed(2)}`,
      min,
      max,
      count: binWallets.length,
      color: colors[i] || "bg-gray-500",
      walletAddresses: binWallets.map(w => w.address),
    });
  }
  
  return buckets;
}

export default function ActivityDistribution({
  wallets,
}: ActivityDistributionProps) {
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  if (wallets.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Activity Index
        </h2>
        <p className="text-gray-400">No wallet data available</p>
      </div>
    );
  }

  // Single wallet: Just show the activity index
  if (wallets.length === 1) {
    const wallet = wallets[0]!;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Activity Index
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-blue-400">
            {wallet.activityIndex.toFixed(3)}
          </div>
          <div className="text-sm text-gray-400">
            <div>Single wallet analysis</div>
            <div className="mt-1 font-mono text-xs">{wallet.address}</div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple wallets: Show quantile distribution
  const buckets = createQuantileBins(wallets, 5);
  const maxCount = Math.max(...buckets.map((b) => b.count));

  const handleCopyAddresses = () => {
    if (!selectedBucket) return;
    const addressList = selectedBucket.walletAddresses.join("\n");
    navigator.clipboard.writeText(addressList);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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
            <div 
              className="relative h-8 bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => setSelectedBucket(bucket)}
              title="Click to view wallet addresses"
            >
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

      {/* Modal for showing wallet addresses */}
      {selectedBucket && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedBucket(null)}
        >
          <div 
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Wallets in range {selectedBucket.label}
              </h3>
              <button
                onClick={() => setSelectedBucket(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <button
                onClick={handleCopyAddresses}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copySuccess ? (
                  <>
                    <span>✓</span>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy All Addresses</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedBucket.walletAddresses.map((address, idx) => (
                <div 
                  key={idx}
                  className="bg-gray-700 p-3 rounded font-mono text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  {address}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// components/SpamNFTAnalysis.tsx

import { SpamAnalysis } from "../../types/nft";

interface SpamNFTAnalysisProps {
  data: SpamAnalysis;
}

export default function SpamNFTAnalysis({ data }: SpamNFTAnalysisProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🚫</span>
        <h2 className="text-xl font-bold text-white">Spam NFT Detection</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
          <div className="text-3xl font-bold text-red-400 mb-1">
            {data.totalSpam}
          </div>
          <div className="text-xs text-gray-400">Spam NFTs</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
          <div className="text-3xl font-bold text-green-400 mb-1">
            {data.totalLegitimate}
          </div>
          <div className="text-xs text-gray-400">Legitimate NFTs</div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
          <div className="text-3xl font-bold text-orange-400 mb-1">
            {data.walletsAffectedBySpam}
          </div>
          <div className="text-xs text-gray-400">Wallets Affected</div>
        </div>
      </div>

      {/* Spam Percentage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">Spam Rate</h3>
          <span className="text-2xl font-bold text-red-400">
            {data.spamPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-8 flex rounded-lg overflow-hidden">
          <div
            className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
            style={{ width: `${100 - data.spamPercentage}%` }}
          >
            {100 - data.spamPercentage > 15 && "Legitimate"}
          </div>
          <div
            className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
            style={{ width: `${data.spamPercentage}%` }}
          >
            {data.spamPercentage > 15 && "Spam"}
          </div>
        </div>
      </div>

      {/* Top Spam Collections */}
      {data.topSpamCollections.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Top Spam Collections
          </h3>
          <div className="space-y-2">
            {data.topSpamCollections.map((collection, index) => (
              <div
                key={index}
                className="bg-gray-750 p-3 rounded-lg border border-red-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium text-sm truncate flex-1">
                    {collection.name}
                  </span>
                  <span className="text-red-400 font-bold ml-2">
                    {collection.count}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Affecting {collection.affectedWallets} wallet
                  {collection.affectedWallets !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Message */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="text-sm font-medium text-yellow-400 mb-1">
              Spam Detection
            </h4>
            <p className="text-xs text-gray-300">
              These NFTs were automatically flagged as spam based on metadata
              and community reports. They may be phishing attempts or
              unsolicited airdrops.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

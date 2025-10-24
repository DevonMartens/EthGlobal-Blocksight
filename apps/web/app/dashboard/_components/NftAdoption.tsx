// components/NFTAdoptionCard.tsx

import { NFTAdoption } from "../../types/nft";

interface NFTAdoptionCardProps {
  data: NFTAdoption;
}

export default function NFTAdoptionCard({ data }: NFTAdoptionCardProps) {
  const adoptionPercentage = data.adoptionRate;
  const spamPercentage =
    data.totalNFTs > 0
      ? ((data.totalNFTs - data.totalLegitimateNFTs) / data.totalNFTs) * 100
      : 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        📊 NFT Adoption Metrics
      </h2>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {data.walletsWithNFTs}
          </div>
          <div className="text-xs text-gray-400">Wallets with NFTs</div>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-3xl font-bold text-gray-400 mb-1">
            {data.walletsWithoutNFTs}
          </div>
          <div className="text-xs text-gray-400">Without NFTs</div>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {data.adoptionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Adoption Rate</div>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-3xl font-bold text-green-400 mb-1">
            {data.averageLegitimateNFTsPerWallet.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">Avg NFTs/Wallet</div>
        </div>
      </div>

      {/* Adoption Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">
            NFT Ownership Distribution
          </h3>
        </div>
        <div className="h-12 flex rounded-lg overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold"
            style={{ width: `${adoptionPercentage}%` }}
          >
            {adoptionPercentage > 10 && `${adoptionPercentage.toFixed(0)}%`}
          </div>
          <div
            className="bg-gray-700 flex items-center justify-center text-gray-400 font-medium"
            style={{ width: `${100 - adoptionPercentage}%` }}
          >
            {100 - adoptionPercentage > 10 &&
              `${(100 - adoptionPercentage).toFixed(0)}%`}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-purple-400">With NFTs</span>
          <span className="text-gray-400">Without NFTs</span>
        </div>
      </div>

      {/* Total NFTs Breakdown */}
      <div className="bg-gray-750 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Total NFT Collection
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {data.totalLegitimateNFTs}
            </div>
            <div className="text-xs text-gray-500">Legitimate NFTs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {data.totalNFTs - data.totalLegitimateNFTs}
            </div>
            <div className="text-xs text-gray-500">Spam NFTs</div>
          </div>
        </div>

        {/* Spam vs Legitimate Bar */}
        <div className="h-3 flex rounded-full overflow-hidden">
          <div
            className="bg-green-500"
            style={{ width: `${100 - spamPercentage}%` }}
          />
          <div className="bg-red-500" style={{ width: `${spamPercentage}%` }} />
        </div>
      </div>
    </div>
  );
}

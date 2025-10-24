import { NFTDiversityMetrics } from "../../types/nft";

interface NFTDiversityMetricsProps {
  data: NFTDiversityMetrics;
}

export default function NFTDiversityMetricsCard({
  data,
}: NFTDiversityMetricsProps) {
  const getDiversityLevel = (concentration: number) => {
    if (concentration <= 0.3)
      return {
        level: "Very Diverse",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500/30",
      };
    if (concentration <= 0.5)
      return {
        level: "Diverse",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500/30",
      };
    if (concentration <= 0.7)
      return {
        level: "Moderate",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30",
      };
    return {
      level: "Concentrated",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/30",
    };
  };

  const diversity = getDiversityLevel(data.collectionConcentration);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        🌈 NFT Diversity Metrics
      </h2>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {data.uniqueCollections}
          </div>
          <div className="text-xs text-gray-400">Unique Collections</div>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {data.averageCollectionsPerWallet.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">Avg Collections/Wallet</div>
        </div>
      </div>

      {/* Diversity Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">
            Collection Diversity
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${diversity.bgColor} ${diversity.color} ${diversity.borderColor}`}
          >
            {diversity.level}
          </span>
        </div>

        <div className="bg-gray-750 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Concentration Index</span>
            <span className={`text-2xl font-bold ${diversity.color}`}>
              {data.collectionConcentration.toFixed(3)}
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                data.collectionConcentration <= 0.3
                  ? "bg-green-500"
                  : data.collectionConcentration <= 0.5
                    ? "bg-blue-500"
                    : data.collectionConcentration <= 0.7
                      ? "bg-yellow-500"
                      : "bg-orange-500"
              }`}
              style={{
                width: `${Math.min(data.collectionConcentration * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Lower values indicate more diverse portfolios
          </p>
        </div>
      </div>

      {/* Most Diverse Wallet */}
      {data.mostDiverseWallet && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏆</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-purple-400 mb-2">
                Most Diverse Wallet
              </h4>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-blue-400">
                  {data.mostDiverseWallet.address.slice(0, 10)}...
                  {data.mostDiverseWallet.address.slice(-8)}
                </span>
                <span className="text-white font-bold">
                  {data.mostDiverseWallet.collectionCount} collections
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

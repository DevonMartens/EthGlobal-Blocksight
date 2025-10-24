// components/TopNFTCollections.tsx

import { TopNFTCollection } from "../../types/nft";

interface TopNFTCollectionsProps {
  collections: TopNFTCollection[];
}

export default function TopNFTCollections({
  collections,
}: TopNFTCollectionsProps) {
  if (collections.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Top NFT Collections
        </h2>
        <p className="text-gray-400">No legitimate NFT collections found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        🎨 Top NFT Collections
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {collections.map((collection, index) => (
          <div
            key={collection.contractAddress}
            className="bg-gray-750 border border-gray-600 rounded-lg p-4 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                #{index + 1}
              </div>

              {/* Collection Image */}
              <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
                {collection.imageUrl ? (
                  <img
                    src={collection.imageUrl}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-nft.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                    🖼️
                  </div>
                )}
              </div>

              {/* Collection Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-bold text-lg truncate">
                      {collection.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {collection.symbol} • {collection.tokenType}
                    </p>
                  </div>
                  {collection.floorPrice > 0 && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-green-400 font-bold">
                        {collection.floorPrice} ETH
                      </div>
                      <div className="text-xs text-gray-500">Floor Price</div>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {collection.totalOwned}
                    </div>
                    <div className="text-xs text-gray-500">Total Owned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {collection.uniqueHolders}
                    </div>
                    <div className="text-xs text-gray-500">Unique Holders</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-400">
                      {collection.holderPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Adoption Rate</div>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{
                      width: `${Math.min(collection.holderPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* OpenSea Link */}
            {collection.collectionSlug && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <a
                  href={`https://opensea.io/collection/${collection.collectionSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                >
                  View on OpenSea →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

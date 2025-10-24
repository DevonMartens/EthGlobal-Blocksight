import { RecentNFTAcquisition } from "../../types/nft";

interface RecentNFTAcquisitionsProps {
  acquisitions: RecentNFTAcquisition[];
}

export default function RecentNFTAcquisitions({
  acquisitions,
}: RecentNFTAcquisitionsProps) {
  if (acquisitions.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Recent NFT Acquisitions
        </h2>
        <p className="text-gray-400">No recent acquisition data available</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        🆕 Recent NFT Acquisitions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {acquisitions.slice(0, 12).map((acquisition, index) => (
          <div
            key={`${acquisition.walletAddress}-${acquisition.tokenId}-${index}`}
            className="bg-gray-750 border border-gray-600 rounded-lg p-3 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* NFT Image */}
              <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
                {acquisition.imageUrl ? (
                  <img
                    src={acquisition.imageUrl}
                    alt={acquisition.nftName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-nft.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
                    🎨
                  </div>
                )}
              </div>

              {/* NFT Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm truncate mb-1">
                  {acquisition.nftName}
                </h3>
                <p className="text-gray-400 text-xs truncate mb-1">
                  {acquisition.collectionName}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    {formatDate(acquisition.acquiredAt)}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-blue-400 font-mono">
                    {acquisition.walletAddress.slice(0, 6)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {acquisitions.length > 12 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing 12 of {acquisitions.length} recent acquisitions
        </div>
      )}
    </div>
  );
}

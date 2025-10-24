export type NFTAnalytics = {
  topCollections: TopNFTCollection[];
  adoption: NFTAdoption;
  spamAnalysis: SpamAnalysis;
  recentAcquisitions: RecentNFTAcquisition[];
  diversityMetrics: NFTDiversityMetrics;
};

export type TopNFTCollection = {
  contractAddress: string;
  name: string;
  symbol: string;
  tokenType: "ERC721" | "ERC1155";
  totalOwned: number;
  uniqueHolders: number;
  holderPercentage: number;
  floorPrice: number;
  imageUrl: string;
  collectionSlug: string;
  isSpam: boolean;
};

export type NFTAdoption = {
  walletsWithNFTs: number;
  walletsWithoutNFTs: number;
  adoptionRate: number;
  totalNFTs: number;
  totalLegitimateNFTs: number;
  averageNFTsPerWallet: number;
  averageLegitimateNFTsPerWallet: number;
};

export type SpamAnalysis = {
  totalSpam: number;
  totalLegitimate: number;
  spamPercentage: number;
  walletsAffectedBySpam: number;
  topSpamCollections: {
    name: string;
    count: number;
    affectedWallets: number;
  }[];
};

export type RecentNFTAcquisition = {
  walletAddress: string;
  nftName: string;
  collectionName: string;
  imageUrl: string;
  acquiredAt: string;
  blockNumber: number | null;
  tokenId: string;
  tokenType: "ERC721" | "ERC1155";
};

export type NFTDiversityMetrics = {
  uniqueCollections: number;
  averageCollectionsPerWallet: number;
  mostDiverseWallet: {
    address: string;
    collectionCount: number;
  } | null;
  collectionConcentration: number; // 0-1
};

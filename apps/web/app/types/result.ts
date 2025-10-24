export type Transfer = {
  blockNum: string;
  uniqueId: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  erc721TokenId: string | null;
  erc1155Metadata: any | null; // or define a more specific type if you know the structure
  tokenId: string | null;
  asset: string;
  category: string;
  rawContract: {
    value: string;
    address: string | null;
    decimal: string;
  };
  metadata: {
    blockTimestamp: string;
  };
};

type OwnedNFT = {
  contract: {
    address: string;
    name: string;
    symbol: string;
    totalSupply: string;
    tokenType: "ERC721" | "ERC1155";
    contractDeployer: string;
    deployedBlockNumber: number;
    openSeaMetadata: {
      floorPrice: number;
      collectionName: string;
      collectionSlug: string;
      safelistRequestStatus: string;
      imageUrl: string;
      description: string;
      externalUrl: string | null;
      twitterUsername: string | null;
      discordUrl: string | null;
      bannerImageUrl: string | null;
      lastIngestedAt: string;
    };
    isSpam: boolean;
    spamClassifications: string[];
  };
  tokenId: string;
  tokenType: "ERC721" | "ERC1155";
  name: string;
  description: string;
  tokenUri: string;
  image: {
    cachedUrl: string;
    thumbnailUrl: string;
    pngUrl: string;
    contentType: string;
    size: number;
    originalUrl: string;
  };
  animation: {
    cachedUrl: string | null;
    contentType: string | null;
    size: number | null;
    originalUrl: string | null;
  };
  raw: {
    tokenUri: string;
    metadata: {
      name: string;
      description: string;
      image: string;
    };
    error: string | null;
  };
  collection: {
    name: string;
    slug: string;
    externalUrl: string | null;
    bannerImageUrl: string | null;
  };
  mint: {
    mintAddress: string | null;
    blockNumber: number | null;
    timestamp: string | null;
    transactionHash: string | null;
  };
  owners: any | null;
  timeLastUpdated: string;
  balance: string;
  acquiredAt: {
    blockTimestamp: string | null;
    blockNumber: number | null;
  };
};

type NFT = {
  ownedNfts: OwnedNFT[];
  totalCount: number;
};

export type Token = {
  address: string;
  network: string;
  tokenAddress: string | null;
  tokenBalance: string;
};

type TokenBalance = {
  data: {
    tokens: Token[];
    pageKey: null | any;
  };
};

export type Result = {
  address: string;
  data: {
    nfts: NFT;
    transfers: Transfer[];
    tokenBalances: TokenBalance;
  };
};

export type OverviewStats = {
  totalWallets: number;
  totalTransactionVolume: number;
  totalTransactions: number;
  averageWalletBalance: number;
  activeWallets: number;
  inactiveWallets: number;
  averageActivityIndex: number;
};

export type WalletWithActivity = {
  address: string;
  activityIndex: number;
  transactionCount: number;
  totalVolume: number;
  balance: number;
  lastActivityDate: Date | null;
};

export type TransactionInsights = {
  timeline: TimelineDataPoint[];
  mostActiveWallets: ActiveWallet[];
  patterns: TransactionPatterns;
  gasAnalysis: GasAnalysis;
};

export type TimelineDataPoint = {
  date: string;
  volume: number;
  count: number;
  displayDate: string; // For chart display
};

export type ActiveWallet = {
  address: string;
  transactionCount: number;
  totalVolume: number;
  incomingCount: number;
  outgoingCount: number;
  averageTransactionSize: number;
  activityIndex: number;
};

export type TransactionPatterns = {
  totalIncoming: number;
  totalOutgoing: number;
  incomingVolume: number;
  outgoingVolume: number;
  averageIncomingSize: number;
  averageOutgoingSize: number;
  internalTransactions: number;
  externalTransactions: number;
  internalVolume: number;
  externalVolume: number;
};

export type GasAnalysis = {
  totalGasSpent: number;
  averageGasPerTransaction: number;
  estimatedCostUSD: number; // Estimated based on average ETH price
  highestGasTransaction: {
    hash: string;
    gasSpent: number;
    from: string;
    to: string;
  } | null;
};

export type TokenDistributionAnalysis = {
  distribution: BalanceDistribution[];
  whales: WhaleWallet[];
  concentration: ConcentrationMetrics;
  balanceStats: BalanceStatistics;
};

export type BalanceDistribution = {
  range: string;
  minBalance: number;
  maxBalance: number;
  count: number;
  percentage: number;
  totalBalance: number;
};

export type WhaleWallet = {
  address: string;
  balance: number;
  percentageOfTotal: number;
  rank: number;
  activityIndex: number;
  transactionCount: number;
};

export type ConcentrationMetrics = {
  giniCoefficient: number;
  top10Percentage: number;
  top20Percentage: number;
  herfindahlIndex: number;
  concentrationLevel: "Very High" | "High" | "Moderate" | "Low" | "Very Low";
};

export type BalanceStatistics = {
  totalBalance: number;
  averageBalance: number;
  medianBalance: number;
  maxBalance: number;
  minBalance: number;
  standardDeviation: number;
};

// utils/nftAnalysis.ts

import { Result } from "../types/result";

import {
  NFTAnalytics,
  TopNFTCollection,
  NFTAdoption,
  SpamAnalysis,
  RecentNFTAcquisition,
  NFTDiversityMetrics,
} from "../types/nft";

/**
 * Get top NFT collections by ownership
 */
function getTopNFTCollections(
  results: Result[],
  limit: number = 10
): TopNFTCollection[] {
  const collectionMap = new Map<
    string,
    {
      contractAddress: string;
      name: string;
      symbol: string;
      tokenType: "ERC721" | "ERC1155";
      totalOwned: number;
      holders: Set<string>;
      floorPrice: number;
      imageUrl: string;
      collectionSlug: string;
      isSpam: boolean;
    }
  >();

  results.forEach((result) => {
    result.data.nfts.ownedNfts.forEach((nftData) => {
      const key = nftData.contract.address.toLowerCase();

      if (!collectionMap.has(key)) {
        collectionMap.set(key, {
          contractAddress: nftData.contract.address,
          name: nftData.contract.name || "Unknown Collection",
          symbol: nftData.contract.symbol || "",
          tokenType: nftData.contract.tokenType,
          totalOwned: 0,
          holders: new Set(),
          floorPrice: nftData.contract.openSeaMetadata?.floorPrice || 0,
          imageUrl:
            nftData.contract.openSeaMetadata?.imageUrl ||
            nftData.image?.thumbnailUrl ||
            "",
          collectionSlug:
            nftData.contract.openSeaMetadata?.collectionSlug || "",
          isSpam: nftData.contract.isSpam,
        });
      }

      const collection = collectionMap.get(key)!;
      collection.totalOwned++;
      collection.holders.add(result.address.toLowerCase());
    });
  });

  const totalWallets = results.length;

  return Array.from(collectionMap.values())
    .filter((collection) => !collection.isSpam)
    .map((collection) => ({
      contractAddress: collection.contractAddress,
      name: collection.name,
      symbol: collection.symbol,
      tokenType: collection.tokenType,
      totalOwned: collection.totalOwned,
      uniqueHolders: collection.holders.size,
      holderPercentage: (collection.holders.size / totalWallets) * 100,
      floorPrice: collection.floorPrice,
      imageUrl: collection.imageUrl,
      collectionSlug: collection.collectionSlug,
      isSpam: collection.isSpam,
    }))
    .sort((a, b) => b.totalOwned - a.totalOwned)
    .slice(0, limit);
}

/**
 * Calculate NFT adoption metrics
 */
function calculateNFTAdoption(results: Result[]): NFTAdoption {
  let walletsWithNFTs = 0;
  let totalNFTs = 0;
  let totalLegitimateNFTs = 0;

  results.forEach((result) => {
    let walletHasNFTs = false;

    result.data.nfts.ownedNfts.forEach((nft) => {
      totalNFTs++;
      if (!nft.contract.isSpam) {
        totalLegitimateNFTs++;
        walletHasNFTs = true;
      }
    });

    if (walletHasNFTs) {
      walletsWithNFTs++;
    }
  });

  const totalWallets = results.length;
  const walletsWithoutNFTs = totalWallets - walletsWithNFTs;

  return {
    walletsWithNFTs,
    walletsWithoutNFTs,
    adoptionRate: (walletsWithNFTs / totalWallets) * 100,
    totalNFTs,
    totalLegitimateNFTs,
    averageNFTsPerWallet: totalNFTs / totalWallets,
    averageLegitimateNFTsPerWallet: totalLegitimateNFTs / totalWallets,
  };
}

/**
 * Analyze spam NFTs
 */
function analyzeSpamNFTs(results: Result[]): SpamAnalysis {
  let totalSpam = 0;
  let totalLegitimate = 0;
  const walletsAffected = new Set<string>();
  const spamCollectionMap = new Map<
    string,
    {
      name: string;
      count: number;
      affectedWallets: Set<string>;
    }
  >();

  results.forEach((result) => {
    result.data.nfts.ownedNfts.forEach((nft) => {
      if (nft.contract.isSpam) {
        totalSpam++;
        walletsAffected.add(result.address.toLowerCase());

        const key = nft.contract.address.toLowerCase();
        if (!spamCollectionMap.has(key)) {
          spamCollectionMap.set(key, {
            name: nft.contract.name || "Unknown Spam Collection",
            count: 0,
            affectedWallets: new Set(),
          });
        }

        const spamCollection = spamCollectionMap.get(key)!;
        spamCollection.count++;
        spamCollection.affectedWallets.add(result.address.toLowerCase());
      } else {
        totalLegitimate++;
      }
    });
  });

  const topSpamCollections = Array.from(spamCollectionMap.values())
    .map((collection) => ({
      name: collection.name,
      count: collection.count,
      affectedWallets: collection.affectedWallets.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalNFTs = totalSpam + totalLegitimate;

  return {
    totalSpam,
    totalLegitimate,
    spamPercentage: totalNFTs > 0 ? (totalSpam / totalNFTs) * 100 : 0,
    walletsAffectedBySpam: walletsAffected.size,
    topSpamCollections,
  };
}

/**
 * Get recent NFT acquisitions
 */
function getRecentNFTAcquisitions(
  results: Result[],
  limit: number = 20
): RecentNFTAcquisition[] {
  const acquisitions: RecentNFTAcquisition[] = [];

  results.forEach((result) => {
    result.data.nfts.ownedNfts.forEach((nft) => {
      // Skip spam NFTs
      if (nft.contract.isSpam) return;

      // Only include NFTs with acquisition data
      if (nft.acquiredAt?.blockTimestamp) {
        acquisitions.push({
          walletAddress: result.address,
          nftName: nft.name || `${nft.collection.name} #${nft.tokenId}`,
          collectionName: nft.collection.name || nft.contract.name,
          imageUrl: nft.image?.thumbnailUrl || nft.image?.cachedUrl || "",
          acquiredAt: nft.acquiredAt.blockTimestamp,
          blockNumber: nft.acquiredAt.blockNumber,
          tokenId: nft.tokenId,
          tokenType: nft.tokenType,
        });
      }
    });
  });

  // Sort by acquisition date (most recent first)
  return acquisitions
    .sort(
      (a, b) =>
        new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
    )
    .slice(0, limit);
}

/**
 * Calculate NFT diversity metrics
 */
function calculateNFTDiversity(results: Result[]): NFTDiversityMetrics {
  const allCollections = new Set<string>();
  const walletCollections = new Map<string, Set<string>>();

  results.forEach((result) => {
    const collections = new Set<string>();

    result.data.nfts.ownedNfts.forEach((nft) => {
      if (!nft.contract.isSpam) {
        const collectionKey = nft.contract.address.toLowerCase();
        allCollections.add(collectionKey);
        collections.add(collectionKey);
      }
    });

    if (collections.size > 0) {
      walletCollections.set(result.address, collections);
    }
  });

  const uniqueCollections = allCollections.size;

  // Calculate average collections per wallet (only wallets with NFTs)
  const averageCollectionsPerWallet =
    walletCollections.size > 0
      ? Array.from(walletCollections.values()).reduce(
          (sum, cols) => sum + cols.size,
          0
        ) / walletCollections.size
      : 0;

  // Find most diverse wallet
  let mostDiverseWallet: NFTDiversityMetrics["mostDiverseWallet"] = null;
  let maxCollections = 0;

  walletCollections.forEach((collections, address) => {
    if (collections.size > maxCollections) {
      maxCollections = collections.size;
      mostDiverseWallet = {
        address,
        collectionCount: collections.size,
      };
    }
  });

  // Calculate collection concentration (similar to Gini)
  // Lower value = more diverse, higher value = concentrated in few collections
  const collectionCounts = Array.from(walletCollections.values()).map(
    (cols) => cols.size
  );
  const collectionConcentration =
    collectionCounts.length > 1
      ? calculateSimpleConcentration(collectionCounts)
      : 0;

  return {
    uniqueCollections,
    averageCollectionsPerWallet:
      Math.round(averageCollectionsPerWallet * 100) / 100,
    mostDiverseWallet,
    collectionConcentration: Math.round(collectionConcentration * 1000) / 1000,
  };
}

/**
 * Simple concentration calculation (coefficient of variation)
 */
function calculateSimpleConcentration(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (normalized by mean)
  return mean > 0 ? stdDev / mean : 0;
}

/**
 * Get complete NFT analytics
 */
export function getNFTAnalytics(results: Result[]): NFTAnalytics {
  return {
    topCollections: getTopNFTCollections(results, 10),
    adoption: calculateNFTAdoption(results),
    spamAnalysis: analyzeSpamNFTs(results),
    recentAcquisitions: getRecentNFTAcquisitions(results, 20),
    diversityMetrics: calculateNFTDiversity(results),
  };
}

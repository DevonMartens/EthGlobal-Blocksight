// utils/aggregation.ts

import { Result, OverviewStats, WalletWithActivity } from "../types/result";

/**
 * Parse hex balance to ETH
 */
export function hexToEth(hexBalance: string): number {
  try {
    const weiBalance = BigInt(hexBalance);
    return Number(weiBalance) / 1e18;
  } catch {
    return 0;
  }
}

/**
 * Calculate percentile rank of a value within an array
 * Returns 0-1 where 1 = highest
 */
function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  if (allValues.length === 1) return 0.5;
  
  const sorted = [...allValues].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  return below / allValues.length;
}

/**
 * Calculate time-decayed score for transactions
 * Uses exponential decay with 30-day half-life
 */
function calculateTimeDecayedScore(
  transfers: any[],
  now: Date,
  extractValue: (transfer: any) => number = () => 1
): number {
  const halfLifeDays = 30;
  const decayConstant = Math.log(2) / halfLifeDays;

  // Skipping diagnostics
  let skippedNoMetadata = 0;
  let skippedNoBlockTimestamp = 0;
  let skippedInvalidTimestamp = 0;

  let sum = 0;
  const totalTransfers = transfers.length;
  for (const transfer of transfers) {
    if (!transfer || !transfer.metadata) {
      skippedNoMetadata++;
      continue;
    }
    if (!transfer.metadata.blockTimestamp) {
      skippedNoBlockTimestamp++;
      continue;
    }

    const txTime = new Date(transfer.metadata.blockTimestamp).getTime();
    if (Number.isNaN(txTime)) {
      skippedInvalidTimestamp++;
      continue;
    }

    const daysSince = (now.getTime() - txTime) / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-decayConstant * daysSince);
    sum += extractValue(transfer) * weight;
  }

  // Log grouped skip reasons for testing (only when there are skips)
  if (skippedNoMetadata || skippedNoBlockTimestamp || skippedInvalidTimestamp) {
    const skippedTotal = skippedNoMetadata + skippedNoBlockTimestamp + skippedInvalidTimestamp;
    console.log("[ActivityIndex] Skipped transfers in calculateTimeDecayedScore", {
      totalTransfers,
      processed: totalTransfers - skippedTotal,
      skippedNoMetadata,
      skippedNoBlockTimestamp,
      skippedInvalidTimestamp,
      skippedPercentage: totalTransfers > 0 ? Math.round((skippedTotal / totalTransfers) * 1000) / 10 : 0,
    });
  }

  return sum;
}

/**
 * Calculate activity index (0-1) for a wallet based on multiple factors
 * Uses percentile-based scaling and exponential time decay
 * 0 = completely inactive
 * 1 = very active
 */
export function calculateActivityIndex(
  result: Result,
  allResults: Result[]
): number {
  const transfers = result.data.transfers;

  if (!transfers || transfers.length === 0) {
    return 0;
  }

  const now = new Date();

  // Current wallet's metrics
  const totalTransactions = transfers.length;
  const totalVolume = transfers.reduce((sum, t) => sum + (t.value || 0), 0);
  const decayedFrequency = calculateTimeDecayedScore(transfers, now);
  const decayedVolume = calculateTimeDecayedScore(transfers, now, (t) => t.value || 0);

  // Single wallet: use absolute scoring with reasonable thresholds
  if (allResults.length === 1) {
    // Factor 1: Time-decayed frequency - Weight: 40%
    // Normalize: 10+ weighted transactions = 1.0
    const frequencyScore = Math.min(decayedFrequency / 10, 1) * 0.4;

    // Factor 2: Time-decayed volume - Weight: 30%
    // Normalize: 5+ ETH weighted volume = 1.0
    const volumeScore = Math.min(decayedVolume / 5, 1) * 0.3;

    // Factor 3: Total transaction count - Weight: 15%
    // Normalize: 50+ transactions = 1.0
    const countScore = Math.min(totalTransactions / 50, 1) * 0.15;

    // Factor 4: Total volume - Weight: 10%
    // Normalize: 10+ ETH total = 1.0
    const totalVolumeScore = Math.min(totalVolume / 10, 1) * 0.1;

    // Factor 5: Smooth recency - Weight: 5%
    let recencyScore = 0;
    if (transfers.length > 0) {
      let mostRecentTime = 0;
      transfers.forEach(t => {
        if (t.metadata && t.metadata.blockTimestamp) {
          const txTime = new Date(t.metadata.blockTimestamp).getTime();
          if (txTime > mostRecentTime) {
            mostRecentTime = txTime;
          }
        }
      });
      if (mostRecentTime > 0) {
        const daysSinceLastTx = (now.getTime() - mostRecentTime) / (1000 * 60 * 60 * 24);
        const decayConstant = Math.log(2) / 90;
        recencyScore = Math.exp(-decayConstant * daysSinceLastTx) * 0.05;
      }
    }

    const totalScore = frequencyScore + volumeScore + countScore + totalVolumeScore + recencyScore;
    return Math.round(totalScore * 1000) / 1000;
  }

  // Multiple wallets: use percentile-based scoring
  const allTransferCounts = allResults.map(r => r.data.transfers.length);
  const allVolumes = allResults.map(r => 
    r.data.transfers.reduce((sum, t) => sum + (t.value || 0), 0)
  );
  
  const allDecayedFrequencies = allResults.map(r => 
    calculateTimeDecayedScore(r.data.transfers, now)
  );
  
  const allDecayedVolumes = allResults.map(r => 
    calculateTimeDecayedScore(r.data.transfers, now, (t) => t.value || 0)
  );

  // Factor 1: Time-decayed transaction frequency - Weight: 40%
  const frequencyPercentile = calculatePercentile(decayedFrequency, allDecayedFrequencies);
  const frequencyScore = frequencyPercentile * 0.4;

  // Factor 2: Time-decayed transaction volume - Weight: 30%
  const volumePercentile = calculatePercentile(decayedVolume, allDecayedVolumes);
  const volumeScore = volumePercentile * 0.3;

  // Factor 3: Total transaction count (lifetime) - Weight: 15%
  const countPercentile = calculatePercentile(totalTransactions, allTransferCounts);
  const countScore = countPercentile * 0.15;

  // Factor 4: Total volume (lifetime) - Weight: 10%
  const totalVolumePercentile = calculatePercentile(totalVolume, allVolumes);
  const totalVolumeScore = totalVolumePercentile * 0.1;

  // Factor 5: Smooth recency (days since last tx with exponential decay) - Weight: 5%
  let recencyScore = 0;
  if (transfers.length > 0) {
    // Find most recent transaction with valid metadata
    let mostRecentTime = 0;
    
    transfers.forEach(t => {
      if (t.metadata && t.metadata.blockTimestamp) {
        const txTime = new Date(t.metadata.blockTimestamp).getTime();
        if (txTime > mostRecentTime) {
          mostRecentTime = txTime;
        }
      }
    });
    
    if (mostRecentTime > 0) {
      const daysSinceLastTx = (now.getTime() - mostRecentTime) / (1000 * 60 * 60 * 24);
      // Exponential decay with 90-day half-life
      const decayConstant = Math.log(2) / 90;
      recencyScore = Math.exp(-decayConstant * daysSinceLastTx) * 0.05;
    }
  }

  const totalScore =
    frequencyScore + volumeScore + countScore + totalVolumeScore + recencyScore;

  // Round to 3 decimal places
  return Math.round(totalScore * 1000) / 1000;
}

/**
 * Get wallet balance in ETH
 */
export function getWalletBalance(result: Result): number {
  const tokens = result.data.tokenBalances.data.tokens;

  // Find ETH balance (tokenAddress is null for native ETH)
  const ethToken = tokens.find((token) => token.tokenAddress === null);

  if (ethToken) {
    return hexToEth(ethToken.tokenBalance);
  }

  return 0;
}

/**
 * Get last activity date for a wallet
 */
export function getLastActivityDate(result: Result): Date | null {
  const transfers = result.data.transfers;

  if (!transfers || transfers.length === 0) {
    return null;
  }

  // Skipping diagnostics
  let skippedNoMetadata = 0;
  let skippedNoBlockTimestamp = 0;
  let skippedInvalidTimestamp = 0;

  const validTimes: number[] = [];
  const totalTransfers = transfers.length;
  for (const t of transfers) {
    if (!t || !t.metadata) {
      skippedNoMetadata++;
      continue;
    }
    if (!t.metadata.blockTimestamp) {
      skippedNoBlockTimestamp++;
      continue;
    }
    const time = new Date(t.metadata.blockTimestamp).getTime();
    if (Number.isNaN(time)) {
      skippedInvalidTimestamp++;
      continue;
    }
    validTimes.push(time);
  }

  if (skippedNoMetadata || skippedNoBlockTimestamp || skippedInvalidTimestamp) {
    const skippedTotal = skippedNoMetadata + skippedNoBlockTimestamp + skippedInvalidTimestamp;
    console.log("[ActivityIndex] Skipped transfers in getLastActivityDate", {
      totalTransfers,
      processed: totalTransfers - skippedTotal,
      skippedNoMetadata,
      skippedNoBlockTimestamp,
      skippedInvalidTimestamp,
      skippedPercentage: totalTransfers > 0 ? Math.round((skippedTotal / totalTransfers) * 1000) / 10 : 0,
    });
  }

  if (validTimes.length === 0) {
    return null;
  }

  const mostRecentTime = Math.max(...validTimes);
  return new Date(mostRecentTime);
}

/**
 * Aggregate all wallet data into overview statistics
 */
export function aggregateOverview(results: Result[]): OverviewStats {
  const totalWallets = results.length;

  // Calculate total transaction volume and count
  let totalTransactionVolume = 0;
  let totalTransactions = 0;

  results.forEach((result) => {
    const transfers = result.data.transfers;
    totalTransactions += transfers.length;
    totalTransactionVolume += transfers.reduce(
      (sum, t) => sum + (t.value || 0),
      0
    );
  });

  // Calculate average wallet balance
  const totalBalance = results.reduce((sum, result) => {
    return sum + getWalletBalance(result);
  }, 0);
  const averageWalletBalance = totalBalance / totalWallets;

  // Calculate activity indices
  const activityIndices = results.map((result) =>
    calculateActivityIndex(result, results)
  );
  const averageActivityIndex =
    activityIndices.reduce((sum, index) => sum + index, 0) / totalWallets;

  // Count active vs inactive wallets (threshold: 0.3)
  const activeWallets = activityIndices.filter((index) => index >= 0.3).length;
  const inactiveWallets = totalWallets - activeWallets;

  return {
    totalWallets,
    totalTransactionVolume: Math.round(totalTransactionVolume * 1000) / 1000,
    totalTransactions,
    averageWalletBalance: Math.round(averageWalletBalance * 1000) / 1000,
    activeWallets,
    inactiveWallets,
    averageActivityIndex: Math.round(averageActivityIndex * 1000) / 1000,
  };
}

/**
 * Get wallets with their activity data
 */
export function getWalletsWithActivity(
  results: Result[]
): WalletWithActivity[] {
  return results
    .map((result) => {
      const activityIndex = calculateActivityIndex(result, results);
      const transactionCount = result.data.transfers.length;
      const totalVolume = result.data.transfers.reduce(
        (sum, t) => sum + (t.value || 0),
        0
      );
      const balance = getWalletBalance(result);
      const lastActivityDate = getLastActivityDate(result);

      return {
        address: result.address,
        activityIndex,
        transactionCount,
        totalVolume: Math.round(totalVolume * 1000) / 1000,
        balance: Math.round(balance * 1000000) / 1000000,
        lastActivityDate,
      };
    })
    .sort((a, b) => b.activityIndex - a.activityIndex);
}

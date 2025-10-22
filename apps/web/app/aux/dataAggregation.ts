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
 * Calculate activity index (0-1) for a wallet based on multiple factors
 * 0 = completely inactive
 * 1 = very active
 */
export function calculateActivityIndex(result: Result): number {
  const transfers = result.data.transfers;

  if (!transfers || transfers.length === 0) {
    return 0;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Factor 1: Recent activity (30 days) - Weight: 35%
  const recentTransactions = transfers.filter(
    (t) => new Date(t.metadata.blockTimestamp) > thirtyDaysAgo
  ).length;
  const recentScore = Math.min(recentTransactions / 10, 1) * 0.35;

  // Factor 2: Medium-term activity (90 days) - Weight: 25%
  const ninetyDayTransactions = transfers.filter(
    (t) => new Date(t.metadata.blockTimestamp) > ninetyDaysAgo
  ).length;
  const mediumTermScore = Math.min(ninetyDayTransactions / 30, 1) * 0.25;

  // Factor 3: Transaction volume - Weight: 20%
  const totalVolume = transfers.reduce((sum, t) => sum + (t.value || 0), 0);
  const volumeScore = Math.min(totalVolume / 10, 1) * 0.2;

  // Factor 4: Transaction frequency (total) - Weight: 15%
  const totalTransactions = transfers.length;
  const frequencyScore = Math.min(totalTransactions / 100, 1) * 0.15;

  // Factor 5: Recency of last transaction - Weight: 5%
  const sortedTransfers = [...transfers].sort(
    (a, b) =>
      new Date(b.metadata.blockTimestamp).getTime() -
      new Date(a.metadata.blockTimestamp).getTime()
  );

  let recencyScore = 0;
  if (sortedTransfers.length > 0) {
    if (sortedTransfers[0]) {
      const lastTxDate = new Date(sortedTransfers[0].metadata.blockTimestamp);
      const daysSinceLastTx =
        (now.getTime() - lastTxDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastTx <= 7) recencyScore = 1 * 0.05;
      else if (daysSinceLastTx <= 30) recencyScore = 0.7 * 0.05;
      else if (daysSinceLastTx <= 90) recencyScore = 0.4 * 0.05;
      else recencyScore = 0.1 * 0.05;
    }
  }

  const totalScore =
    recentScore + mediumTermScore + volumeScore + frequencyScore + recencyScore;

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

  const sortedTransfers = [...transfers].sort(
    (a, b) =>
      new Date(b.metadata.blockTimestamp).getTime() -
      new Date(a.metadata.blockTimestamp).getTime()
  );

  if (sortedTransfers.length === 0) {
    return null;
  }

  return new Date(sortedTransfers[0]!.metadata.blockTimestamp);
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
    calculateActivityIndex(result)
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
      const activityIndex = calculateActivityIndex(result);
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

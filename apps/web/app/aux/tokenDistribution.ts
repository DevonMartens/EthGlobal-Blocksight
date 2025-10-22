// utils/tokenDistribution.ts

import {
  Result,
  TokenDistributionAnalysis,
  BalanceDistribution,
  WhaleWallet,
  ConcentrationMetrics,
  BalanceStatistics,
} from "../types/result";
import { calculateActivityIndex } from "./dataAggregation";
import { hexToEth } from "./dataAggregation";

/**
 * Get wallet balance in ETH
 */
function getWalletBalance(result: Result): number {
  const tokens = result.data.tokenBalances.data.tokens;
  const ethToken = tokens.find((token) => token.tokenAddress === null);
  return ethToken ? hexToEth(ethToken.tokenBalance) : 0;
}

/**
 * Calculate Gini Coefficient for token distribution
 * Returns a value between 0 (perfect equality) and 1 (perfect inequality)
 */
function calculateGiniCoefficient(balances: number[]): number {
  if (balances.length === 0) return 0;

  // Sort balances in ascending order
  const sortedBalances = [...balances].sort((a, b) => a - b);
  const n = sortedBalances.length;

  let sumOfDifferences = 0;
  let sumOfBalances = 0;

  sortedBalances.forEach((balance, i) => {
    sumOfBalances += balance;
    sumOfDifferences += (i + 1) * balance;
  });

  if (sumOfBalances === 0) return 0;

  const gini = (2 * sumOfDifferences) / (n * sumOfBalances) - (n + 1) / n;

  return Math.max(0, Math.min(1, gini)); // Clamp between 0 and 1
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI)
 * Measures market concentration - higher values indicate more concentration
 */
function calculateHerfindahlIndex(balances: number[]): number {
  const totalBalance = balances.reduce((sum, b) => sum + b, 0);

  if (totalBalance === 0) return 0;

  const hhi = balances.reduce((sum, balance) => {
    const marketShare = balance / totalBalance;
    return sum + marketShare * marketShare;
  }, 0);

  return hhi * 10000; // Multiply by 10000 for standard HHI scale
}

/**
 * Get concentration level description based on Gini coefficient
 */
function getConcentrationLevel(
  gini: number
): ConcentrationMetrics["concentrationLevel"] {
  if (gini >= 0.7) return "Very High";
  if (gini >= 0.5) return "High";
  if (gini >= 0.35) return "Moderate";
  if (gini >= 0.2) return "Low";
  return "Very Low";
}

/**
 * Calculate balance statistics
 */
function calculateBalanceStatistics(balances: number[]): BalanceStatistics {
  if (balances.length === 0) {
    return {
      totalBalance: 0,
      averageBalance: 0,
      medianBalance: 0,
      maxBalance: 0,
      minBalance: 0,
      standardDeviation: 0,
    };
  }

  const sortedBalances = [...balances].sort((a, b) => a - b);
  const totalBalance = balances.reduce((sum, b) => sum + b, 0);
  const averageBalance = totalBalance / balances.length;

  // Calculate median
  const mid = Math.floor(sortedBalances.length / 2);
  const medianBalance =
    sortedBalances.length % 2 === 0
      ? (sortedBalances[mid - 1] + sortedBalances[mid]) / 2
      : sortedBalances[mid];

  // Calculate standard deviation
  const squaredDifferences = balances.map((b) =>
    Math.pow(b - averageBalance, 2)
  );
  const variance =
    squaredDifferences.reduce((sum, sd) => sum + sd, 0) / balances.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    totalBalance: Math.round(totalBalance * 1000000) / 1000000,
    averageBalance: Math.round(averageBalance * 1000000) / 1000000,
    medianBalance: Math.round(medianBalance * 1000000) / 1000000,
    maxBalance: Math.round(Math.max(...balances) * 1000000) / 1000000,
    minBalance: Math.round(Math.min(...balances) * 1000000) / 1000000,
    standardDeviation: Math.round(standardDeviation * 1000000) / 1000000,
  };
}

/**
 * Create balance distribution buckets
 */
function createBalanceDistribution(balances: number[]): BalanceDistribution[] {
  if (balances.length === 0) return [];

  const maxBalance = Math.max(...balances);
  const totalBalance = balances.reduce((sum, b) => sum + b, 0);

  // Define ranges dynamically based on max balance
  let ranges: { range: string; min: number; max: number }[];

  if (maxBalance < 0.1) {
    ranges = [
      { range: "0 - 0.01 ETH", min: 0, max: 0.01 },
      { range: "0.01 - 0.05 ETH", min: 0.01, max: 0.05 },
      { range: "0.05 - 0.1 ETH", min: 0.05, max: 0.1 },
      { range: "0.1+ ETH", min: 0.1, max: Infinity },
    ];
  } else if (maxBalance < 1) {
    ranges = [
      { range: "0 - 0.1 ETH", min: 0, max: 0.1 },
      { range: "0.1 - 0.5 ETH", min: 0.1, max: 0.5 },
      { range: "0.5 - 1 ETH", min: 0.5, max: 1 },
      { range: "1+ ETH", min: 1, max: Infinity },
    ];
  } else if (maxBalance < 10) {
    ranges = [
      { range: "0 - 0.5 ETH", min: 0, max: 0.5 },
      { range: "0.5 - 2 ETH", min: 0.5, max: 2 },
      { range: "2 - 5 ETH", min: 2, max: 5 },
      { range: "5 - 10 ETH", min: 5, max: 10 },
      { range: "10+ ETH", min: 10, max: Infinity },
    ];
  } else {
    ranges = [
      { range: "0 - 1 ETH", min: 0, max: 1 },
      { range: "1 - 10 ETH", min: 1, max: 10 },
      { range: "10 - 50 ETH", min: 10, max: 50 },
      { range: "50 - 100 ETH", min: 50, max: 100 },
      { range: "100+ ETH", min: 100, max: Infinity },
    ];
  }

  return ranges.map(({ range, min, max }) => {
    const walletsInRange = balances.filter((b) => b >= min && b < max);
    const balanceInRange = walletsInRange.reduce((sum, b) => sum + b, 0);

    return {
      range,
      minBalance: min,
      maxBalance: max === Infinity ? maxBalance : max,
      count: walletsInRange.length,
      percentage: (walletsInRange.length / balances.length) * 100,
      totalBalance: Math.round(balanceInRange * 1000000) / 1000000,
    };
  });
}

/**
 * Identify whale wallets (top holders)
 */
function identifyWhales(results: Result[], limit: number = 10): WhaleWallet[] {
  const totalBalance = results.reduce(
    (sum, result) => sum + getWalletBalance(result),
    0
  );

  const whales = results.map((result) => {
    const balance = getWalletBalance(result);
    const activityIndex = calculateActivityIndex(result);
    const transactionCount = result.data.transfers.length;

    return {
      address: result.address,
      balance: Math.round(balance * 1000000) / 1000000,
      percentageOfTotal: totalBalance > 0 ? (balance / totalBalance) * 100 : 0,
      rank: 0, // Will be set after sorting
      activityIndex,
      transactionCount,
    };
  });

  // Sort by balance descending
  whales.sort((a, b) => b.balance - a.balance);

  // Assign ranks
  whales.forEach((whale, index) => {
    whale.rank = index + 1;
  });

  return whales.slice(0, limit);
}

/**
 * Calculate concentration metrics
 */
function calculateConcentration(balances: number[]): ConcentrationMetrics {
  if (balances.length === 0) {
    return {
      giniCoefficient: 0,
      top10Percentage: 0,
      top20Percentage: 0,
      herfindahlIndex: 0,
      concentrationLevel: "Very Low",
    };
  }

  const sortedBalances = [...balances].sort((a, b) => b - a);
  const totalBalance = balances.reduce((sum, b) => sum + b, 0);

  // Calculate top 10% concentration
  const top10Count = Math.max(1, Math.ceil(balances.length * 0.1));
  const top10Balance = sortedBalances
    .slice(0, top10Count)
    .reduce((sum, b) => sum + b, 0);
  const top10Percentage =
    totalBalance > 0 ? (top10Balance / totalBalance) * 100 : 0;

  // Calculate top 20% concentration
  const top20Count = Math.max(1, Math.ceil(balances.length * 0.2));
  const top20Balance = sortedBalances
    .slice(0, top20Count)
    .reduce((sum, b) => sum + b, 0);
  const top20Percentage =
    totalBalance > 0 ? (top20Balance / totalBalance) * 100 : 0;

  const giniCoefficient = calculateGiniCoefficient(balances);
  const herfindahlIndex = calculateHerfindahlIndex(balances);
  const concentrationLevel = getConcentrationLevel(giniCoefficient);

  return {
    giniCoefficient: Math.round(giniCoefficient * 1000) / 1000,
    top10Percentage: Math.round(top10Percentage * 100) / 100,
    top20Percentage: Math.round(top20Percentage * 100) / 100,
    herfindahlIndex: Math.round(herfindahlIndex * 100) / 100,
    concentrationLevel,
  };
}

/**
 * Get complete token distribution analysis
 */
export function getTokenDistributionAnalysis(
  results: Result[]
): TokenDistributionAnalysis {
  const balances = results.map((result) => getWalletBalance(result));

  return {
    distribution: createBalanceDistribution(balances),
    whales: identifyWhales(results, 10),
    concentration: calculateConcentration(balances),
    balanceStats: calculateBalanceStatistics(balances),
  };
}

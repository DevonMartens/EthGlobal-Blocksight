// utils/transactionAnalysis.ts

import {
  Result,
  Transfer,
  TransactionInsights,
  TimelineDataPoint,
  ActiveWallet,
  TransactionPatterns,
  GasAnalysis,
} from "../types/result";
import { calculateActivityIndex } from "./dataAggregation";

/**
 * Calculate gas spent for a transaction
 * Gas spent = (hex value of rawContract.value) - (actual value transferred)
 * This is an approximation
 */
function estimateGasSpent(transfer: Transfer): number {
  try {
    const rawValue = parseInt(transfer.rawContract.value, 16) / 1e18;
    const actualValue = transfer.value || 0;

    // For outgoing transactions, gas is the difference
    // This is a rough estimate
    return Math.max(0, rawValue - actualValue);
  } catch {
    return 0;
  }
}

/**
 * Build transaction timeline grouped by day/week/month
 */
export function buildTransactionTimeline(
  results: Result[],
  groupBy: "day" | "week" | "month" = "day"
): TimelineDataPoint[] {
  const timelineMap = new Map<string, { volume: number; count: number }>();

  // Diagnostics for skipped transfers
  let totalTransfers = 0;
  let skippedNoMetadata = 0;
  let skippedNoBlockTimestamp = 0;
  let skippedInvalidTimestamp = 0;

  results.forEach((result) => {
    result.data.transfers.forEach((transfer) => {
      totalTransfers++;

      // Validate metadata
      if (!transfer || !transfer.metadata) {
        skippedNoMetadata++;
        return;
      }
      if (!transfer.metadata.blockTimestamp) {
        skippedNoBlockTimestamp++;
        return;
      }
      const ts = new Date(transfer.metadata.blockTimestamp).getTime();
      if (Number.isNaN(ts)) {
        skippedInvalidTimestamp++;
        return;
      }

      const date = new Date(ts);
      let key: string;

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0]!; // YYYY-MM-DD
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0]!;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!timelineMap.has(key)) {
        timelineMap.set(key, { volume: 0, count: 0 });
      }

      const data = timelineMap.get(key)!;
      data.volume += transfer.value || 0;
      data.count += 1;
    });
  });

  if (totalTransfers > 0 && (skippedNoMetadata || skippedNoBlockTimestamp || skippedInvalidTimestamp)) {
    console.log("[Timeline] Skipped transfers in buildTransactionTimeline", {
      totalTransfers,
      processed: totalTransfers - (skippedNoMetadata + skippedNoBlockTimestamp + skippedInvalidTimestamp),
      skippedNoMetadata,
      skippedNoBlockTimestamp,
      skippedInvalidTimestamp,
      skippedPercentage: Math.round(((skippedNoMetadata + skippedNoBlockTimestamp + skippedInvalidTimestamp) / totalTransfers) * 1000) / 10,
    });
  }

  // Convert to array and sort by date
  const timeline = Array.from(timelineMap.entries())
    .map(([date, data]) => ({
      date,
      volume: Math.round(data.volume * 1000) / 1000,
      count: data.count,
      displayDate: formatDisplayDate(date, groupBy),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return timeline;
}

function formatDisplayDate(
  date: string,
  groupBy: "day" | "week" | "month"
): string {
  const d = new Date(date);

  if (groupBy === "day") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else if (groupBy === "week") {
    return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } else {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
}

/**
 * Get most active wallets by transaction count
 */
export function getMostActiveWallets(
  results: Result[],
  limit: number = 10
): ActiveWallet[] {
  const wallets = results.map((result) => {
    const transfers = result.data.transfers;
    const address = result.address.toLowerCase();

    const incoming = transfers.filter((t) => {
      const toAddr = (t && t.to ? t.to : "").toLowerCase();
      return toAddr === address;
    });
    const outgoing = transfers.filter((t) => {
      const fromAddr = (t && t.from ? t.from : "").toLowerCase();
      return fromAddr === address;
    });

    const incomingVolume = incoming.reduce((sum, t) => sum + (t.value || 0), 0);
    const outgoingVolume = outgoing.reduce((sum, t) => sum + (t.value || 0), 0);
    const totalVolume = incomingVolume + outgoingVolume;

    const averageTransactionSize =
      transfers.length > 0 ? totalVolume / transfers.length : 0;

    return {
      address: result.address,
      transactionCount: transfers.length,
      totalVolume: Math.round(totalVolume * 1000) / 1000,
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
      averageTransactionSize: Math.round(averageTransactionSize * 1000) / 1000,
      activityIndex: calculateActivityIndex(result, results),
    };
  });

  return wallets
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, limit);
}

/**
 * Analyze transaction patterns (incoming vs outgoing)
 */
export function analyzeTransactionPatterns(
  results: Result[]
): TransactionPatterns {
  let totalIncoming = 0;
  let totalOutgoing = 0;
  let incomingVolume = 0;
  let outgoingVolume = 0;
  let internalTransactions = 0;
  let externalTransactions = 0;
  let internalVolume = 0;
  let externalVolume = 0;

  const walletAddresses = new Set(results.map((r) => r.address.toLowerCase()));

  results.forEach((result) => {
    const address = result.address.toLowerCase();

    result.data.transfers.forEach((transfer) => {
      const safeTo = (transfer && transfer.to ? transfer.to : "").toLowerCase();
      const safeFrom = (transfer && transfer.from ? transfer.from : "").toLowerCase();
      const isIncoming = safeTo === address;
      const isOutgoing = safeFrom === address;

      if (isIncoming) {
        totalIncoming++;
        incomingVolume += transfer.value || 0;
      }

      if (isOutgoing) {
        totalOutgoing++;
        outgoingVolume += transfer.value || 0;
      }

      // Check if transaction is internal (between tracked wallets)
      const fromTracked = walletAddresses.has(safeFrom);
      const toTracked = walletAddresses.has(safeTo);

      if (fromTracked && toTracked) {
        internalTransactions++;
        internalVolume += transfer.value || 0;
      } else {
        externalTransactions++;
        externalVolume += transfer.value || 0;
      }
    });
  });

  return {
    totalIncoming,
    totalOutgoing,
    incomingVolume: Math.round(incomingVolume * 1000) / 1000,
    outgoingVolume: Math.round(outgoingVolume * 1000) / 1000,
    averageIncomingSize:
      totalIncoming > 0
        ? Math.round((incomingVolume / totalIncoming) * 1000) / 1000
        : 0,
    averageOutgoingSize:
      totalOutgoing > 0
        ? Math.round((outgoingVolume / totalOutgoing) * 1000) / 1000
        : 0,
    internalTransactions,
    externalTransactions,
    internalVolume: Math.round(internalVolume * 1000) / 1000,
    externalVolume: Math.round(externalVolume * 1000) / 1000,
  };
}

/**
 * Analyze gas spending across all transactions
 */
export function analyzeGasSpending(
  results: Result[],
  ethPriceUSD: number = 2500
): GasAnalysis {
  let totalGasSpent = 0;
  let transactionCount = 0;
  let highestGasTransaction: GasAnalysis["highestGasTransaction"] = null;

  results.forEach((result) => {
    result.data.transfers.forEach((transfer) => {
      const gasSpent = estimateGasSpent(transfer);
      totalGasSpent += gasSpent;
      transactionCount++;

      if (!highestGasTransaction || gasSpent > highestGasTransaction.gasSpent) {
        highestGasTransaction = {
          hash: transfer.hash,
          gasSpent: Math.round(gasSpent * 1000000) / 1000000,
          from: transfer.from,
          to: transfer.to,
        };
      }
    });
  });

  const averageGasPerTransaction =
    transactionCount > 0 ? totalGasSpent / transactionCount : 0;

  return {
    totalGasSpent: Math.round(totalGasSpent * 1000) / 1000,
    averageGasPerTransaction:
      Math.round(averageGasPerTransaction * 1000000) / 1000000,
    estimatedCostUSD: Math.round(totalGasSpent * ethPriceUSD * 100) / 100,
    highestGasTransaction,
  };
}

/**
 * Get all transaction insights
 */
export function getTransactionInsights(
  results: Result[],
  timelineGroupBy: "day" | "week" | "month" = "day"
): TransactionInsights {
  return {
    timeline: buildTransactionTimeline(results, timelineGroupBy),
    mostActiveWallets: getMostActiveWallets(results, 10),
    patterns: analyzeTransactionPatterns(results),
    gasAnalysis: analyzeGasSpending(results),
  };
}

// app/dashboard/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useResults } from "../context/ResultsContext";
import {
  aggregateOverview,
  getWalletsWithActivity,
} from "../aux/dataAggregation";
import { getTransactionInsights } from "../aux/transactionAnalysis";
import {
  OverviewStats,
  WalletWithActivity,
  TransactionInsights,
  TokenDistributionAnalysis,
} from "../types/result";
import OverviewCards from "../dashboard/_components/OverviewCard";
import ActivityDistribution from "../dashboard/_components/ActivityDistribution";
import TransactionTimeline from "../dashboard/_components/TransactionTimeline";
import MostActiveWallets from "../dashboard/_components/MostActiveWallet";
import TransactionPatternsCard from "../dashboard/_components/TransactionPattern";
import GasAnalysisCard from "../dashboard/_components/GasAnalysis";
import { getTokenDistributionAnalysis } from "../aux/tokenDistribution";
import BalanceDistributionChart from "./_components/BalanceDistributionChart";
import ConcentrationMetricsCard from "./_components/ConcentrationMetrics";
import QueryInterface from "./_components/QueryInterface";

// Tab component
interface TabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function Tab({ id, label, isActive, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-sm transition-colors duration-200 rounded-t-lg ${
        isActive
          ? "bg-gray-800 text-white border-b-2 border-blue-500"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

// Dashboard content component (moved from main component)
interface DashboardContentProps {
  addresses: string[];
  network: string;
  overviewStats: OverviewStats | null;
  walletsWithActivity: WalletWithActivity[];
  transactionInsights: TransactionInsights | null;
  timelineGroupBy: "day" | "week" | "month";
  setTimelineGroupBy: (value: "day" | "week" | "month") => void;
  tokenDistribution: TokenDistributionAnalysis | null;
}

function DashboardContent({
  addresses,
  network,
  overviewStats,
  walletsWithActivity,
  transactionInsights,
  timelineGroupBy,
  setTimelineGroupBy,
  tokenDistribution,
}: DashboardContentProps) {
  const isMultipleWallets = addresses.length > 1;

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">📊 Overview</h2>
        <OverviewCards data={overviewStats} />
      </section>

      {/* Activity Distribution - Only for multiple wallets */}
      {isMultipleWallets && (
        <section>
          <ActivityDistribution wallets={walletsWithActivity} />
        </section>
      )}

      {/* Transaction Insights Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          💸 Transaction Insights
        </h2>

        {/* Timeline */}
        <div className="mb-6">
          {transactionInsights && (
            <TransactionTimeline
              data={transactionInsights.timeline}
              groupBy={timelineGroupBy}
              onGroupByChange={setTimelineGroupBy}
            />
          )}
        </div>

        {/* Most Active Wallets */}
        <div className="mb-6">
          {transactionInsights && (
            <MostActiveWallets
              wallets={transactionInsights.mostActiveWallets}
            />
          )}
        </div>

        {/* Transaction Patterns and Gas Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {transactionInsights && (
            <>
              <TransactionPatternsCard data={transactionInsights.patterns} />
              <GasAnalysisCard data={transactionInsights.gasAnalysis} />
            </>
          )}
        </div>
      </section>

      {/* Token Distribution Section - Only for multiple wallets */}
      {isMultipleWallets && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            💰 Token Distribution
          </h2>

          {tokenDistribution && (
            <>
              {/* Balance Distribution */}
              <div className="mb-6">
                <BalanceDistributionChart data={tokenDistribution.distribution} />
              </div>

              {/* Concentration Metrics */}
              <div className="mb-6">
                <ConcentrationMetricsCard
                  concentration={tokenDistribution.concentration}
                  stats={tokenDistribution.balanceStats}
                />
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { results, clearResults } = useResults();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [network, setNetwork] = useState<string>("");
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(
    null
  );
  const [walletsWithActivity, setWalletsWithActivity] = useState<
    WalletWithActivity[]
  >([]);
  const [transactionInsights, setTransactionInsights] =
    useState<TransactionInsights | null>(null);
  const [timelineGroupBy, setTimelineGroupBy] = useState<
    "day" | "week" | "month"
  >("day");
  const [tokenDistribution, setTokenDistribution] =
    useState<TokenDistributionAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai">("dashboard");

  console.log(results);

  useEffect(() => {
    // Check if we have results in context
    if (results.length === 0) {
      // No results available, redirect to home
      router.push("/");
      return;
    }

    // Extract addresses from results
    const addressList = results.map((result) => result.address);
    setAddresses(addressList);
    setNetwork("mainnet");

    // Aggregate data
    const overview = aggregateOverview(results);
    const wallets = getWalletsWithActivity(results);
    const insights = getTransactionInsights(results, timelineGroupBy);
    const distribution = getTokenDistributionAnalysis(results);

    setOverviewStats(overview);
    setWalletsWithActivity(wallets);
    setTransactionInsights(insights);
    setTokenDistribution(distribution);
  }, [results, router, timelineGroupBy]);

  const handleClearResults = () => {
    clearResults();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gray-800 p-8 border border-gray-700 rounded-lg">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              DAO Wallet Analytics Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Analysis results for {addresses.length} wallet
              {addresses.length !== 1 ? "s" : ""} on {network}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg w-fit mx-auto">
            <Tab
              id="dashboard"
              label="Dashboard"
              isActive={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <Tab
              id="ai"
              label="AI"
              isActive={activeTab === "ai"}
              onClick={() => setActiveTab("ai")}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          {activeTab === "dashboard" && (
            <DashboardContent
              addresses={addresses}
              network={network}
              overviewStats={overviewStats}
              walletsWithActivity={walletsWithActivity}
              transactionInsights={transactionInsights}
              timelineGroupBy={timelineGroupBy}
              setTimelineGroupBy={setTimelineGroupBy}
              tokenDistribution={tokenDistribution}
            />
          )}
          {activeTab === "ai" && <QueryInterface />}
        </div>

        {/* Navigation */}
        <div className="text-center mt-8 space-x-4">
          <button
            onClick={handleClearResults}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200 rounded-lg"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push("/data-fetching")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 rounded-lg"
          >
            Fetch More Data
          </button>
        </div>
      </main>
    </div>
  );
}

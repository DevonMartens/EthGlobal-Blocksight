// components/OverviewCards.tsx

import { OverviewStats } from "../../types/result";

interface OverviewCardsProps {
  data: OverviewStats | null;
}

export default function OverviewCards({ data }: OverviewCardsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Wallets Analyzed",
      value: data.totalWallets.toLocaleString(),
      subtitle: `${data.activeWallets} active, ${data.inactiveWallets} inactive`,
      icon: "👛",
      color: "text-blue-400",
    },
    {
      title: "Total Transaction Volume",
      value: `${data.totalTransactionVolume.toFixed(3)} ETH`,
      subtitle: `Across all wallets`,
      icon: "💰",
      color: "text-green-400",
    },
    {
      title: "Total Transactions",
      value: data.totalTransactions.toLocaleString(),
      subtitle: `${(data.totalTransactions / data.totalWallets).toFixed(1)} avg per wallet`,
      icon: "📊",
      color: "text-purple-400",
    },
    {
      title: "Average Wallet Balance",
      value: `${data.averageWalletBalance.toFixed(4)} ETH`,
      subtitle: "Per wallet",
      icon: "⚖️",
      color: "text-yellow-400",
    },
    {
      title: "Active vs Inactive",
      value: `${((data.activeWallets / data.totalWallets) * 100).toFixed(1)}%`,
      subtitle: `${data.activeWallets} wallets with index ≥ 0.3`,
      icon: "🔥",
      color: "text-orange-400",
    },
    {
      title: "Average Activity Index",
      value: data.averageActivityIndex.toFixed(3),
      subtitle: getActivityLabel(data.averageActivityIndex),
      icon: "📈",
      color: "text-pink-400",
      badge: getActivityBadge(data.averageActivityIndex),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{card.icon}</span>
              <h3 className="text-sm font-medium text-gray-400">
                {card.title}
              </h3>
            </div>
            {card.badge && (
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${card.badge.className}`}
              >
                {card.badge.text}
              </span>
            )}
          </div>
          <p className={`text-3xl font-bold ${card.color} mb-1`}>
            {card.value}
          </p>
          <p className="text-sm text-gray-500">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

function getActivityLabel(index: number): string {
  if (index >= 0.7) return "Very Active Community";
  if (index >= 0.5) return "Active Community";
  if (index >= 0.3) return "Moderately Active";
  if (index >= 0.15) return "Low Activity";
  return "Mostly Inactive";
}

function getActivityBadge(
  index: number
): { text: string; className: string } | null {
  if (index >= 0.7) {
    return {
      text: "Excellent",
      className: "bg-green-500/20 text-green-400 border border-green-500/30",
    };
  } else if (index >= 0.5) {
    return {
      text: "Good",
      className: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    };
  } else if (index >= 0.3) {
    return {
      text: "Moderate",
      className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    };
  } else {
    return {
      text: "Low",
      className: "bg-red-500/20 text-red-400 border border-red-500/30",
    };
  }
}

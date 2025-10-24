// components/TransactionTimeline.tsx

import { TimelineDataPoint } from "../../types/result";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface TransactionTimelineProps {
  data: TimelineDataPoint[];
  groupBy: "day" | "week" | "month";
  onGroupByChange: (groupBy: "day" | "week" | "month") => void;
}

export default function TransactionTimeline({
  data,
  groupBy,
  onGroupByChange,
}: TransactionTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Transaction Timeline
        </h2>
        <p className="text-gray-400">No transaction data available</p>
      </div>
    );
  }

  // Show last 30 data points for better visualization
  const displayData = data.slice(-30);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === "volume"
                ? " ETH"
                : entry.dataKey === "count"
                  ? " transactions"
                  : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom axis tick formatter
  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    if (groupBy === "day") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else if (groupBy === "week") {
      return `W${Math.ceil(date.getDate() / 7)}`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short" });
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Transaction Timeline</h2>
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((option) => (
            <button
              key={option}
              onClick={() => onGroupByChange(option)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                groupBy === option
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Combined Chart */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Transaction Volume & Count
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={displayData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisTick}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  stroke="#3B82F6"
                  fontSize={12}
                  tickFormatter={(value) => `${value} ETH`}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  stroke="#8B5CF6"
                  fontSize={12}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="#3B82F6"
                  name="Volume (ETH)"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="Count"
                  dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Separate Volume Chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Transaction Volume Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisTick}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis
                  stroke="#3B82F6"
                  fontSize={12}
                  tickFormatter={(value) => `${value} ETH`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  name="Volume (ETH)"
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: "#3B82F6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Count Chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Transaction Count Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisTick}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#8B5CF6" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#8B5CF6"
                  name="Count"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

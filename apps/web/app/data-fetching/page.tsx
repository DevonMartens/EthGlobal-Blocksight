"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FetchProgress {
  address: string;
  status: "pending" | "loading" | "completed" | "error";
  progress: number;
  error?: string;
}

export default function DataFetchingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [network, setNetwork] = useState<"mainnet" | "sepolia">("mainnet");
  const [fetchProgress, setFetchProgress] = useState<FetchProgress[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    // Get addresses and network from URL params
    const addressesParam = searchParams.get("addresses");
    const networkParam = searchParams.get("network") as "mainnet" | "sepolia";

    if (!addressesParam) {
      router.push("/");
      return;
    }

    const addressList = addressesParam.split(",");
    setAddresses(addressList);
    setNetwork(networkParam || "mainnet");

    // Initialize progress tracking
    setFetchProgress(
      addressList.map((addr) => ({
        address: addr,
        status: "pending",
        progress: 0,
      }))
    );

    // Start fetching data
    startFetching(addressList, networkParam || "mainnet");
  }, [searchParams, router]);

  const startFetching = async (addressList: string[], network: string) => {
    const results: any[] = [];

    for (let i = 0; i < addressList.length; i++) {
      const address = addressList[i];

      // Update status to loading
      setFetchProgress((prev) =>
        prev.map((item, index) =>
          index === i ? { ...item, status: "loading", progress: 0 } : item
        )
      );

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFetchProgress((prev) =>
            prev.map((item, index) =>
              index === i && item.status === "loading"
                ? {
                    ...item,
                    progress: Math.min(item.progress + Math.random() * 20, 90),
                  }
                : item
            )
          );
        }, 200);

        // Make API call
        const queryParams = new URLSearchParams({
          include_nft: "true",
          max_transfers: "300",
          direction: "both",
        });

        const response = await fetch(
          `/api/v1/wallet/${address}/full?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${address}`);
        }

        const data = await response.json();
        results.push({ address, data });

        clearInterval(progressInterval);

        // Update status to completed
        setFetchProgress((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, status: "completed", progress: 100 } : item
          )
        );
      } catch (error) {
        // Update status to error
        setFetchProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? {
                  ...item,
                  status: "error",
                  progress: 0,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : item
          )
        );
      }
    }

    setResults(results);
    setIsComplete(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <div className="w-4 h-4 rounded-full bg-gray-500"></div>;
      case "loading":
        return (
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
        );
      case "completed":
        return (
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-2 h-2 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <svg
              className="w-2 h-2 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting...";
      case "loading":
        return "Fetching data...";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  const completedCount = fetchProgress.filter(
    (item) => item.status === "completed"
  ).length;
  const errorCount = fetchProgress.filter(
    (item) => item.status === "error"
  ).length;
  const totalProgress =
    fetchProgress.length > 0
      ? fetchProgress.reduce((sum, item) => sum + item.progress, 0) /
        fetchProgress.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gray-800 p-8 border border-gray-700">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Fetching Data
            </h1>
            <p className="text-gray-300 text-lg">
              Analyzing {addresses.length} wallet
              {addresses.length !== 1 ? "s" : ""} on {network}
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-gray-800 p-6 border border-gray-700 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Overall Progress</h2>
            <span className="text-sm text-gray-400">
              {completedCount}/{addresses.length} completed
              {errorCount > 0 && ` (${errorCount} errors)`}
            </span>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>

          <div className="text-sm text-gray-400">
            {Math.round(totalProgress)}% complete
          </div>
        </div>

        {/* Individual Address Progress */}
        <div className="space-y-4 mb-8">
          {fetchProgress.map((item, index) => (
            <div key={index} className="bg-gray-800 p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <span className="font-mono text-sm text-gray-300">
                    {item.address}
                  </span>
                </div>
                <span
                  className={`text-sm ${
                    item.status === "completed"
                      ? "text-green-400"
                      : item.status === "error"
                        ? "text-red-400"
                        : item.status === "loading"
                          ? "text-blue-400"
                          : "text-gray-400"
                  }`}
                >
                  {getStatusText(item.status)}
                </span>
              </div>

              {item.status === "loading" && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              )}

              {item.status === "error" && item.error && (
                <div className="text-red-400 text-sm mt-2">
                  Error: {item.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
          >
            Back to Home
          </button>

          {isComplete && (
            <button
              onClick={() => {
                // TODO: Navigate to results page or show results
                console.log("Results:", results);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200"
            >
              View Results
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

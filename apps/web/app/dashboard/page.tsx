"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useResults } from "../context/ResultsContext";

export default function DashboardPage() {
  const router = useRouter();
  const { results, clearResults } = useResults();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [network, setNetwork] = useState<string>("");

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
    setNetwork("mainnet"); // You might want to store this in context too
  }, [results, router]);

  const handleClearResults = () => {
    clearResults();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gray-800 p-8 border border-gray-700">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Analysis results for {addresses.length} wallet
              {addresses.length !== 1 ? "s" : ""} on {network}
            </p>
          </div>
        </div>

        {/* Results Display */}
        <div className="space-y-6">
          {results.map((result, index) => (
            <div key={index} className="bg-gray-800 p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">
                {result.address}
              </h3>

              {/* Display the actual data here */}
              <div className="bg-gray-700 p-4 rounded">
                <pre className="text-sm text-gray-300 overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="text-center mt-8 space-x-4">
          <button
            onClick={handleClearResults}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push("/data-fetching")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
          >
            Fetch More Data
          </button>
        </div>
      </main>
    </div>
  );
}

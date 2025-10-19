"use client";

import { useState, useRef } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [addresses, setAddresses] = useState<string>("");
  const [network, setNetwork] = useState<"mainnet" | "sepolia">("mainnet");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAddresses = (addressList: string[]): string[] => {
    const errors: string[] = [];

    addressList.forEach((address, index) => {
      const trimmedAddress = address.trim();
      if (!trimmedAddress) return;

      if (!ethers.isAddress(trimmedAddress)) {
        errors.push(
          `Invalid address at position ${index + 1}: ${trimmedAddress}`
        );
      }
    });

    return errors;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setAddresses(value);

    if (value.trim()) {
      const addressList = value.split(/[,\s\n]+/).filter((addr) => addr.trim());
      const errors = validateAddresses(addressList);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      const addressList = lines.flatMap((line) =>
        line.split(/[,\s]+/).filter((addr) => addr.trim())
      );

      setAddresses(addressList.join("\n"));
      const errors = validateAddresses(addressList);
      setValidationErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleStartFetching = () => {
    if (validationErrors.length > 0) {
      alert("Please fix validation errors before proceeding");
      return;
    }

    const addressList = addresses
      .split(/[,\s\n]+/)
      .filter((addr) => addr.trim());
    if (addressList.length === 0) {
      alert("Please enter at least one Ethereum address");
      return;
    }

    // Navigate to data fetching page (to be implemented)
    console.log(
      "Starting fetch for addresses:",
      addressList,
      "on network:",
      network
    );
    // TODO: Navigate to /data-fetching route
  };

  const isValid = validationErrors.length === 0 && addresses.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gray-800 p-8 border border-gray-700">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Blocksight
            </h1>
            <p className="text-gray-300 text-lg">
              Analyze Ethereum addresses across networks
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Address Input Section */}
          <div className="bg-gray-800 p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Ethereum Addresses
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Enter addresses (separated by space, comma, or new line)
                </label>
                <textarea
                  value={addresses}
                  onChange={handleTextChange}
                  placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6&#10;0x8ba1f109551bD432803012645Hac136c22C23&#10;0x1234567890123456789012345678901234567890"
                  className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Or upload a CSV file
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white text-sm transition-colors duration-200"
                >
                  Upload CSV
                </button>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30">
                <h4 className="text-red-400 font-medium mb-2">
                  Validation Errors:
                </h4>
                <ul className="text-red-300 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Network Selection */}
          <div className="bg-gray-800 p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Network Selection
            </h2>
            <select
              value={network}
              onChange={(e) =>
                setNetwork(e.target.value as "mainnet" | "sepolia")
              }
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="mainnet">Mainnet</option>
              <option value="sepolia">Sepolia</option>
            </select>
          </div>

          {/* Start Fetching Button */}
          <div className="text-center">
            <button
              onClick={handleStartFetching}
              disabled={!isValid}
              className={`px-8 py-4 font-semibold text-lg transition-all duration-200 ${
                isValid
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Start Fetching
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

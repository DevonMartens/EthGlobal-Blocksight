"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-gray-800 p-10 border border-gray-700 rounded-lg">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Blocksight
            </h1>
            <p className="text-gray-300 text-xl">
              Your Gateway to Blockchain Intelligence
            </p>
          </div>
        </div>

        {/* Two Path Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Chat with Chain Card */}
          <Link href="/chat" className="group">
            <div className="bg-gray-800 border-2 border-gray-700 hover:border-blue-500 p-8 rounded-lg transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:scale-105 h-full flex flex-col">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  Chat with Chain
                </h2>
                <p className="text-gray-400 text-lg mb-4">
                  Ask natural language questions about any blockchain data
                </p>
              </div>
              
              <div className="mt-auto">
                <div className="space-y-2 mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Powered by Blockscout</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Real-time chain data</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">AI-powered responses</span>
                  </div>
                </div>
                
                <div className="flex items-center text-blue-400 font-semibold group-hover:text-blue-300">
                  Start Chatting
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Deep Dive Analytics Card */}
          <Link href="/analytics" className="group">
            <div className="bg-gray-800 border-2 border-gray-700 hover:border-purple-500 p-8 rounded-lg transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 transform hover:scale-105 h-full flex flex-col">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                  Deep Dive Analytics
                </h2>
                <p className="text-gray-400 text-lg mb-4">
                  Comprehensive wallet analytics with advanced insights
                </p>
              </div>
              
              <div className="mt-auto">
                <div className="space-y-2 mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Powered by Alchemy</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Multi-wallet analysis</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Transaction & NFT insights</span>
                  </div>
                </div>
                
                <div className="flex items-center text-purple-400 font-semibold group-hover:text-purple-300">
                  Start Analysis
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 text-center">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Why Blocksight?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-blue-400 font-semibold mb-2">🚀 Fast & Efficient</div>
                <p className="text-gray-400 text-sm">Get instant insights from blockchain data with optimized queries</p>
              </div>
              <div>
                <div className="text-purple-400 font-semibold mb-2">🔒 Secure & Private</div>
                <p className="text-gray-400 text-sm">Your data stays safe with read-only blockchain access</p>
              </div>
              <div>
                <div className="text-pink-400 font-semibold mb-2">📊 Comprehensive</div>
                <p className="text-gray-400 text-sm">From simple queries to deep analytics, we've got you covered</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

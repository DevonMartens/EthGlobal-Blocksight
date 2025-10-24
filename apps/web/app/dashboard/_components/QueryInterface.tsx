import React, { useState } from "react";
import { config } from "../../aux/config";

interface QueryRequest {
  question: string;
}

interface QueryResponse {
  success: boolean;
  question: string;
  sql_query: string | null;
  result: any[] | null;
  answer: string | null;
  error: string | null;
}

function QueryInterface() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestBody: QueryRequest = {
        question: query.trim(),
      };

      const response = await fetch(config.API_ENDPOINTS.QUERY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QueryResponse = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResponse(null);
    setError(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Natural Language Query Interface
        </h3>
        <p className="text-gray-400 text-sm">
          Ask questions about the blockchain data using natural language. The AI
          will convert your question to SQL and execute it against the database.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="query"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Your Question
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., List all verified client companies, Show me the top 10 wallets by balance, What are the most active addresses?"
            className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            disabled={isLoading}
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Execute Query"
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400">Error</h3>
              <div className="mt-2 text-sm text-red-300">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-md p-4">
            <h4 className="text-lg font-medium text-white mb-3">
              Query Response
            </h4>

            {/* Natural Language Answer */}
            {response.answer && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">
                  Answer:
                </h5>
                <p className="text-gray-100 bg-gray-800 p-3 rounded border-l-4 border-blue-500">
                  {response.answer}
                </p>
              </div>
            )}

            {/* SQL Query */}
            {response.sql_query && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">
                  Generated SQL:
                </h5>
                <pre className="text-sm text-gray-100 bg-gray-900 p-3 rounded overflow-x-auto border">
                  <code>{response.sql_query}</code>
                </pre>
              </div>
            )}

            {/* Raw Results */}
            {response.result && response.result.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-300 mb-2">
                  Raw Results ({response.result.length} rows):
                </h5>
                <div className="bg-gray-900 rounded overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        {Object.keys(response.result[0]).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                      {response.result.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 whitespace-nowrap text-sm text-gray-100"
                            >
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {response.result.length > 10 && (
                    <div className="px-3 py-2 text-xs text-gray-400 bg-gray-800">
                      ... and {response.result.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Results */}
            {response.success &&
              response.result &&
              response.result.length === 0 && (
                <div className="text-gray-400 text-sm">
                  No results found for this query.
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QueryInterface;

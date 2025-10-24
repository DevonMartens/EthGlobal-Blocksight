const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const config = {
  API_BASE_URL,
  API_ENDPOINTS: {
    WALLET_FULL: (address: string, params: string) =>
      `${API_BASE_URL}/api/v1/wallet/${address}/full?${params}`,
    QUERY: `${API_BASE_URL}/api/v1/query`,
  },
};

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface DashboardData {
  address: string;
  data: any;
}

interface ResultsContextType {
  results: DashboardData[];
  setResults: (results: DashboardData[]) => void;
  clearResults: () => void;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<DashboardData[]>([]);

  const clearResults = () => setResults([]);

  return (
    <ResultsContext.Provider value={{ results, setResults, clearResults }}>
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  const context = useContext(ResultsContext);
  if (context === undefined) {
    throw new Error("useResults must be used within a ResultsProvider");
  }
  return context;
}

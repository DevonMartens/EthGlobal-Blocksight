export type QueryResult = {
  answer: string;
  question: string;
  result: Array<{
    company_name: string;
    id: number;
    verified: boolean;
  }>;
  sql_query: string;
  success: boolean;
};

export interface Deal {
  dealID: string;
  buyer: string;
  seller: string;
  cumulativeQuantity: number;
  currency: string;
  lastPrice: number;
  lastQuantity: number;
  leavesQuantity: number;
  strategy: string;
  symbol: string;
  transactionTime: string;
}

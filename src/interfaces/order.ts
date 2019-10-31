export enum Sides {
  Buy = 'BUY', Sell = 'SELL',
}

export interface Order {
  tenor: string;
  user: string;
  side: Sides;
  strategy: string;
  symbol: string;
  size?: string;
  price?: string;
  dob?: {price: string, size: string}[];
  quantity?: number;
}

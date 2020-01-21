export enum UserTypes {
  Broker = 'BROKER',
  Bank = 'BANK',
  MarketMaker = 'MARKET_MAKER',
}

export enum CurrencyGroups {
  Invalid = '',
  G10 = 'G10',
  Asia = 'Asia'
}

export interface User {
  email: string;
  firm: string;
  isbroker: boolean;
}

export interface UserProfile {
  userType: UserTypes;
  mpid: string;
  fontSize: string;
  font: string;
  execSound: string;
  timezone: string;
  colorScheme: string;
  ccyGroup: CurrencyGroups;
  oco: boolean;
}

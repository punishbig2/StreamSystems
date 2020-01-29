export enum UserTypes {
  Broker = 'BROKER',
  Bank = 'BANK',
  MarketMaker = 'MARKET_MAKER',
  Unset = '',
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

export enum UserProfileStatus {
  Loading, Error, Initial
}

export enum UserProfileModalTypes {
  Form, Success, Error,
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
  lastOCOUpdateTimestamp: number | null;
}

export interface UserProfileState {
  status: UserProfileStatus;
  currentModalType: UserProfileModalTypes;
  profile: UserProfile,
  initialProfile: UserProfile,
}

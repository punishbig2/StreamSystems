export enum OCOModes {
  Disabled, FullEx, PartialEx,
}

export enum UserTypes {
  Broker = 'BROKER',
  Bank = 'BANK',
  MarketMaker = 'MARKET_MAKER',
  Unset = '',
}

export enum CurrencyGroups {
  Invalid = '',
  Latam = 'LATAM'
}

export interface ExecSound {
  data: ArrayBuffer | string;
  name: string;
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
  Form, Success, Error, Saving
}

export interface UserPreferences {
  userType: UserTypes;
  mpid: string;
  fontSize: string;
  font: string;
  execSound: string;
  darkPoolExecSound: string;
  timezone: string;
  colorScheme: string;
  ccyGroup: CurrencyGroups;
  oco: OCOModes;
  theme: string;

  [key: string]: any;
}

export interface UserProfileState {
  status: UserProfileStatus;
  currentModalType: UserProfileModalTypes;
  initialPreferences: UserPreferences,
  preferences: UserPreferences,
}


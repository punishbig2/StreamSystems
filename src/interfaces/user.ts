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

export interface ExecSound {
  path: string;
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
  Form, Success, Error,
}

export interface UserWorkspace {
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
  execSoundList: ExecSound[];

  [key: string]: any;
}

export interface UserProfileState {
  status: UserProfileStatus;
  currentModalType: UserProfileModalTypes;
  profile: UserWorkspace,
  initialProfile: UserWorkspace,
}

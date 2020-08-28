export enum OCOModes {
  Disabled,
  FullEx,
  PartialEx,
}

export enum UserTypes {
  Broker = "BROKER",
  Bank = "BANK",
  MarketMaker = "MARKET_MAKER",
  Unset = "",
}

export enum CurrencyGroups {
  Default = "",
  Latam = "LATAM",
}

export interface ExecSound {
  data: ArrayBuffer | string;
  name: string;
}

export interface User {
  ismiddleoffice: boolean;
  email: string;
  firm: string;
  isbroker: boolean;
  regions?: string[];
}

export enum UserProfileStatus {
  Loading,
  Error,
  Initial,
}

export enum UserProfileModalTypes {
  Form,
  Success,
  Error,
  Saving,
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
  theme: "dark" | "light";

  [key: string]: any;
}

export interface UserProfileState {
  status: UserProfileStatus;
  currentModalType: UserProfileModalTypes;
  initialPreferences: UserPreferences;
  preferences: UserPreferences;
}

export const isCurrencyGroup = (value: any): value is CurrencyGroups => {
  switch (value) {
    case CurrencyGroups.Latam:
    case CurrencyGroups.Default:
      return true;
    default:
      return false;
  }
};

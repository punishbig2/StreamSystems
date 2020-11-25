import { Role } from "types/role";

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
  readonly data: ArrayBuffer | string;
  readonly name: string;
}

export interface User {
  readonly email: string;
  readonly firm: string;
  readonly regions: ReadonlyArray<string>;
  readonly roles: ReadonlyArray<Role>;
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
  readonly userType: UserTypes;
  readonly mpid: string;
  readonly fontSize: string;
  readonly font: string;
  readonly execSound: string;
  readonly darkPoolExecSound: string;
  readonly timezone: string;
  readonly colorScheme: string;
  readonly ccyGroup: CurrencyGroups;
  readonly oco: OCOModes;
  readonly theme: "dark" | "light";

  [key: string]: any;
}

export interface UserProfileState {
  readonly status: UserProfileStatus;
  readonly currentModalType: UserProfileModalTypes;
  readonly initialPreferences: UserPreferences;
  readonly preferences: UserPreferences;
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

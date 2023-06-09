export enum OCOModes {
  Disabled = 'Disabled',
  FullEx = 'FullEx',
  PartialEx = 'PartialEx',
}

export enum UserTypes {
  Broker = 'BROKER',
  Bank = 'BANK',
  Unset = '',
}

export enum CurrencyGroups {
  Default = '',
  Latam = 'LATAM',
}

export interface ExecSound {
  readonly data: ArrayBuffer | string;
  readonly name: string;
}

export interface OtherUser {
  readonly email: string;
  readonly firm: string;
}

export interface UserInfo {
  [0]: {
    readonly email: string;
    readonly firm: string;
    readonly firstname: string;
    readonly lastname: string;
  };
}

export interface User {
  readonly email: string;
  readonly firm: string;
  readonly regions: readonly string[];
  readonly roles: readonly string[];
  readonly firstname: string;
  readonly lastname: string;
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

export interface WindowManagerPreferences {
  readonly allowHorizontalOverflow: boolean;
  readonly reArrangeDockedWindows: boolean;
}

export interface UserPreferences {
  readonly userType: UserTypes;
  readonly mpid: string;
  readonly fontSize: string;
  readonly fontFamily: string;
  readonly execSound: string;
  readonly darkPoolExecSound: string;
  readonly timezone: string;
  readonly ccyGroup: CurrencyGroups;
  readonly oco: OCOModes;
  readonly theme: 'dark' | 'light';
  readonly execSoundList: readonly string[];
  readonly windowManager: WindowManagerPreferences;
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

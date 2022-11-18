import config from 'config';

export enum Role {
  Admin = 'FXOAdmin',
  Trader = 'FXOTrader',
  MiddleOffice = 'FXOMiddleOffice',
  Broker = 'FXOBroker',
}

export interface OktaUser {
  readonly email: string;
  readonly roles: readonly string[];
}

export const hasRole = (list: readonly string[], role: Role): boolean => {
  switch (config.Environment) {
    case 'PROD':
      return !!list.find(
        (each: string): boolean => each === ['PRD', role].join('_') || each === role
      );
    case 'DEV':
    case 'UAT':
    default:
      return !!list.find((each: string): boolean => each === role);
  }
};

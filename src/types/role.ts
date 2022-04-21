export enum Role {
  Admin = "PRD_FXOAdmin",
  Trader = "PRD_FXOTrader",
  MiddleOffice = "PRD_FXOMiddleOffice",
  Broker = "PRD_FXOBroker",
}

export interface OktaUser {
  readonly email: string;
  readonly roles: ReadonlyArray<string>;
}

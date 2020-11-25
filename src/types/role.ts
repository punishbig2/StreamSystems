export enum Role {
  Admin = "FXOAdmin",
  Trader = "FXOTrader",
  MiddleOffice = "FXOMiddleOffice",
  Broker = "FXOBroker",
}

export interface OktaUser {
  readonly email: string;
  readonly roles: ReadonlyArray<Role>;
}

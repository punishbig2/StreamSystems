const { env } = process;

export const Role = {
  Admin: env.REACT_APP_GROUP_PREFIX + "FXOAdmin",
  Trader: env.REACT_APP_GROUP_PREFIX + "FXOTrader",
  MiddleOffice: env.REACT_APP_GROUP_PREFIX + "FXOMiddleOffice",
  Broker: env.REACT_APP_GROUP_PREFIX + "FXOBroker",
};

console.log(Role);

export interface OktaUser {
  readonly email: string;
  readonly roles: ReadonlyArray<string>;
}

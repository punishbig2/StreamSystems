import { API, Task } from "API";
import { action, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import { BrokerageCommissionResponse } from "types/brokerageCommissionResponse";
import { User } from "types/user";
import signalRClient from "signalR/signalRClient";

export interface CommissionRate {
  readonly region: string;
  readonly value: number;
  readonly hasDiscount: boolean;
}

export const convertToCommissionRatesArray = (response: any) => {
  if (response === null) return [];
  const regions = Object.keys(response).filter((key) => !key.endsWith("-FLAG"));

  return regions
    .filter((region) => region !== "firm" && region !== "msgtype")
    .map((region) => {
      return {
        region: region,
        hasDiscount: response[`${region}-FLAG`] !== "false",
        value: Number(response[region]),
      };
    });
};

export class BrokerageStore {
  @observable.ref commissionRates: ReadonlyArray<CommissionRate> = [];
  private stream = signalRClient;

  constructor() {
    const user: User = workareaStore.user;
    const task: Task<BrokerageCommissionResponse> = API.getBrokerageCommission(
      user.firm
    );
    const promise: Promise<BrokerageCommissionResponse> = task.execute();

    promise.then(convertToCommissionRatesArray).then(this.onCommissionRates);
  }

  public installListener(): () => void {
    let disconnect = () => {};

    this.stream.connect((): void => {
      disconnect = this.stream.addCommissionRatesListener(
        workareaStore.user.firm,
        this.onCommissionRates
      );
    });

    return disconnect;
  }

  @action.bound
  private onCommissionRates(rates: ReadonlyArray<CommissionRate>): void {
    this.commissionRates = rates;
  }
}

export const BrokerageStoreContext = React.createContext<BrokerageStore | null>(
  null
);

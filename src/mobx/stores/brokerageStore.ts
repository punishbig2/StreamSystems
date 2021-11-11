import { API, Task } from "API";
import { action, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import signalRManager from "signalR/signalRManager";
import { BrokerageCommissionResponse } from "types/brokerageCommissionResponse";
import { User } from "types/user";

export interface CommissionRate {
  readonly region: string;
  readonly value: number;
  readonly hasDiscount: boolean;
}

export const convertToCommissionRatesArray = (
  response: BrokerageCommissionResponse | null
): ReadonlyArray<CommissionRate> => {
  if (response === null) return [];
  const regions: string[] = Object.keys(response).filter(
    (key: string): boolean => !key.endsWith("-FLAG")
  );
  const rates = regions
    .filter((region: string) => region !== "firm" && region !== "msgtype")
    .map(
      (region: string): CommissionRate => {
        return {
          region: region,
          hasDiscount: response[`${region}-FLAG`] !== "false",
          value: Number(response[region]),
        };
      }
    );

  return rates;
};

export class BrokerageStore {
  @observable.ref commissionRates: ReadonlyArray<CommissionRate> = [];

  constructor() {
    const user: User = workareaStore.user;
    const task: Task<BrokerageCommissionResponse> = API.getBrokerageCommission(
      user.firm
    );
    const promise: Promise<BrokerageCommissionResponse> = task.execute();
    promise.then(convertToCommissionRatesArray).then(this.setCommissionRates);
  }

  public installListener(): () => void {
    const user: User = workareaStore.user;
    return signalRManager.addCommissionRatesListener(
      user.firm,
      this.setCommissionRates
    );
  }

  @action.bound
  private setCommissionRates(rates: ReadonlyArray<CommissionRate>): void {
    this.commissionRates = rates;
  }
}

export const BrokerageStoreContext = React.createContext<BrokerageStore | null>(
  null
);

import { action, observable } from "mobx";
import React from "react";
import { BrokerageCommissionResponse } from "types/brokerageCommissionResponse";
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

  public setRates(rates: BrokerageCommissionResponse): void {
    this.commissionRates = convertToCommissionRatesArray(rates);
  }

  public installListener(firm: string): () => void {
    return signalRClient.addCommissionRatesListener(
      firm,
      this.onCommissionRates
    );
  }

  @action.bound
  private onCommissionRates(rates: ReadonlyArray<CommissionRate>): void {
    this.commissionRates = rates;
  }
}

export const BrokerageStoreContext = React.createContext<BrokerageStore | null>(
  null
);

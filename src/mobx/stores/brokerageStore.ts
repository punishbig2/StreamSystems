import { action, makeObservable, observable } from 'mobx';
import React from 'react';
import signalRClient from 'signalR/signalRClient';
import { NONE } from 'stateDefs/workspaceState';
import { BrokerageCommissionResponse } from 'types/brokerageCommissionResponse';

export interface CommissionRate {
  readonly region: string;
  readonly value: number;
  readonly hasDiscount: boolean;
}

export const convertToCommissionRatesArray = (response: any): readonly CommissionRate[] => {
  if (response === null) return [];
  const regions = Object.keys(response).filter((key) => !key.endsWith('-FLAG'));

  return regions
    .filter((region) => region !== 'firm' && region !== 'msgtype')
    .map((region) => {
      return {
        region: region,
        hasDiscount: response[`${region}-FLAG`] !== 'false',
        value: Number(response[region]),
      };
    });
};

export class BrokerageStore {
  public commissionRates: readonly CommissionRate[] = [];

  constructor() {
    makeObservable(this, {
      commissionRates: observable.ref,
      onCommissionRates: action.bound,
      setRates: action.bound,
    });
  }

  public setRates(rates: BrokerageCommissionResponse): void {
    this.commissionRates = convertToCommissionRatesArray(rates);
  }

  public installListener(firm: string): VoidFunction {
    if (firm === NONE) {
      return (): void => {
        return;
      };
    }

    return signalRClient.addCommissionRatesListener(firm, this.onCommissionRates);
  }

  public onCommissionRates(rates: readonly CommissionRate[]): void {
    this.commissionRates = rates;
  }
}

export const BrokerageStoreContext = React.createContext<BrokerageStore | null>(null);

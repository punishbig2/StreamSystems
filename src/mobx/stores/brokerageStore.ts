import { API, Task } from "API";
import { action, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import signalRManager from "signalR/signalRManager";
import { BrokerageCommissionResponse } from "types/brokerageCommissionResponse";
import { User } from "types/user";

export interface CommissionRate {
  region: string;
  value: number;
}

export const convertToCommissionRatesArray = (
  response: BrokerageCommissionResponse | null
): ReadonlyArray<CommissionRate> => {
  if (response === null) return [];
  const regions: string[] = Object.keys(response);
  return regions
    .filter((region: string) => region !== "firm" && region !== "msgtype")
    .map(
      (region: string): CommissionRate => {
        return {
          region: region,
          value: Number(response[region]),
        };
      }
    );
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

  @action.bound
  private setCommissionRates(rates: ReadonlyArray<CommissionRate>): void {
    this.commissionRates = rates;
  }

  public installListener(): () => void {
    const user: User = workareaStore.user;
    return signalRManager.addCommissionRatesListener(
      user.firm,
      this.setCommissionRates
    );
  }
}

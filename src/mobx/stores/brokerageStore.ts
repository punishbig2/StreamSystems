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

export class BrokerageStore {
  @observable.ref commissionRates: ReadonlyArray<CommissionRate> = [];

  constructor() {
    const user: User = workareaStore.user;
    const task: Task<BrokerageCommissionResponse> = API.getBrokerageCommission(
      user.firm
    );
    const promise: Promise<BrokerageCommissionResponse> = task.execute();
    promise.then((response: BrokerageCommissionResponse): void => {
      if (response === null) return;
      const regions: string[] = Object.keys(response);
      this.setCommissionRates(
        regions
          .filter((region: string) => region !== "firm" && region !== "msgtype")
          .map(
            (region: string): CommissionRate => {
              return {
                region: region,
                value: response[region],
              };
            }
          )
      );
    });
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

import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable, action, observe } from "mobx";
import { API } from "API";
import { parseTime } from "timeUtils";
import workareaStore from "mobx/stores/workareaStore";

export class DealsStore {
  @observable.ref deals: Deal[] = [];

  constructor() {
    observe(workareaStore, "symbols", (symbols: any) => {
      if (!symbols) return;
      API.getDeals().then((deals: Deal[]) => {
        this.deals = deals.sort(
          (d1: Deal, d2: Deal) =>
            parseTime(d2.transactionTime, "Z").getTime() -
            parseTime(d1.transactionTime, "Z").getTime()
        );
      });
    });
  }

  @action.bound
  public addDeal(deal: Deal) {
    console.log(deal);
    this.deals = [deal, ...this.deals];
  }
}

export default new DealsStore();

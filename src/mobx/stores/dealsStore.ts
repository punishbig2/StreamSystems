import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable, action } from "mobx";
import { API } from "API";
import { parseTime } from "timeUtils";

export class DealsStore {
  @observable.ref deals: Deal[] = [];

  constructor() {
    API.getDeals().then((deals: Deal[]) => {
      this.deals = deals.sort(
        (d1: Deal, d2: Deal) =>
          parseTime(d2.transactionTime, "Z").getTime() -
          parseTime(d1.transactionTime, "Z").getTime()
      );
    });
  }

  @action.bound
  public addDeal(deal: Deal) {
    console.log(deal);
    this.deals = [deal, ...this.deals];
  }
}

export default new DealsStore();

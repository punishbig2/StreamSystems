import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable, action } from "mobx";
import { API } from "API";

export class DealsStore {
  @observable.ref deals: Deal[] = [];

  constructor() {
    API.getDeals().then((deals: any) => {
      this.deals = deals.sort((d1: Deal, d2: Deal) => Number(d2.transactionTime) - Number(d1.transactionTime));
    });
  }

  @action.bound
  public addDeal(deal: Deal) {
    this.deals = [deal, ...this.deals];
  }
}

export default new DealsStore();

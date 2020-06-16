import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable } from "mobx";
import { API } from "API";

export class DealsStore {
  @observable deals: Deal[] = [];

  constructor() {
    API.getDeals().then((deals: any) => {
      this.deals = deals;
    });
  }
}

export default new DealsStore();

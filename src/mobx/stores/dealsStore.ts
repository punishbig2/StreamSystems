import { API } from "API";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { action, observable, observe } from "mobx";
import moStore from "mobx/stores/moStore";
import workareaStore from "mobx/stores/workareaStore";
import { parseTime } from "timeUtils";

export class DealsStore {
  @observable.ref deals: Deal[] = [];
  @observable selectedDeal: string | null = null;

  constructor() {
    observe(workareaStore, "symbols", (symbols: any) => {
      if (!symbols) return;
      API.getDeals().then((deals: Deal[]) => {
        this.deals = deals.sort(
          (d1: Deal, d2: Deal) =>
            parseTime(d2.transactionTime, "UTC").getTime() -
            parseTime(d1.transactionTime, "UTC").getTime()
        );
      });
    });
  }

  @action.bound
  public addDeal(deal: Deal) {
    this.deals = [deal, ...this.deals];
    if (deal.dealID === this.selectedDeal) {
      this.selectedDeal = null;
      moStore.setDeal(deal, null);
    }
  }

  @action.bound
  public removeDeal(id: string) {
    const { deals } = this;
    const index: number = deals.findIndex((deal: Deal) => deal.dealID === id);
    if (index === -1) return;
    this.deals = [...deals.slice(0, index), ...deals.slice(index + 1)];
  }

  @action.bound
  public setSelectedDeal = (id: string) => {
    const found: Deal | undefined = this.deals.find(
      (deal: Deal) => deal.dealID === id
    );
    if (found !== undefined) {
      moStore.setDeal(found, null);
    } else {
      this.selectedDeal = id;
    }
  };
}

export default new DealsStore();

import { API } from "API";
import { Deal } from "components/MiddleOffice/types/deal";
import { action, observable } from "mobx";
import moStore from "mobx/stores/moStore";

export class DealsStore {
  @observable.ref deals: Deal[] = [];
  @observable selectedDeal: string | null = null;

  public async loadDeals(): Promise<void> {
    const deals: Deal[] = await API.getDeals();
    this.deals = deals.sort(
      ({ tradeDate: d1 }: Deal, { tradeDate: d2 }: Deal): number =>
        d2.getTime() - d1.getTime()
    );
  }

  public findDeal(id: string): Deal | undefined {
    const { deals } = this;
    return deals.find((deal: Deal): boolean => deal.dealID === id);
  }

  @action.bound
  public addDeal(deal: Deal) {
    const { deals } = this;
    const index: number = deals.findIndex(
      (each: Deal): boolean => each.dealID === deal.dealID
    );
    if (index === -1) {
      this.deals = [deal, ...deals];
    } else {
      const currentDealID: string | null = moStore.selectedDealID;
      this.deals = [...deals.slice(0, index), deal, ...deals.slice(index + 1)];
      // It was modified, so replay consequences
      if (currentDealID !== null && currentDealID === deal.dealID) {
        moStore.setDeal(deal, null);
      }
    }
    if (deal.dealID === this.selectedDeal) {
      this.selectedDeal = null;
      // It was set before it was here, so do it now
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

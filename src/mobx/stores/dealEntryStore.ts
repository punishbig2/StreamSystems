import { observable, action, computed } from "mobx";
import { DealEntry, emptyDealEntry } from "structures/dealEntry";
import deepEqual from "deep-equal";
import moStore from "mobx/stores/moStore";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { createDealEntry } from "utils/dealUtils";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";

export enum EntryType {
  Empty,
  ExistingDeal,
  New,
  Clone,
}

export class DealEntryStore {
  @observable entryType: EntryType = EntryType.Empty;
  @observable entry: DealEntry = emptyDealEntry;
  private originalEntry: DealEntry = emptyDealEntry;

  @computed
  public get isModified(): boolean {
    return !deepEqual(this.entry, this.originalEntry);
  }

  @computed
  public get isReadyForSubmission(): boolean {
    const { entry } = this;
    if (!this.isModified) return false;
    if (entry.currencyPair === "") return false;
    if (entry.strategy === "") return false;
    if (entry.buyer === "") return false;
    if (entry.seller === "") return false;
    if (entry.model === "") return false;
    if (entry.vol === null) return false;
    return entry.notional !== null;
  }

  @action.bound
  public setDeal(deal: Deal | null): void {
    if (deal === null) {
      this.entry = { ...emptyDealEntry };
      this.originalEntry = { ...this.entry };
      this.entryType = EntryType.Empty;
    } else {
      this.entry = createDealEntry(deal);
      this.originalEntry = { ...this.entry };
      this.entryType = EntryType.ExistingDeal;
    }
  }

  @action.bound
  public reset(): void {
    this.entryType = EntryType.Empty;
    this.entry = { ...emptyDealEntry };
    this.originalEntry = { ...this.entry };
  }

  @action.bound
  public cloneDeal(): void {
    if (moStore.deal === null) return;
    this.entry = { ...createDealEntry(moStore.deal) };
    this.originalEntry = { ...this.entry };
    this.entryType = EntryType.Clone;
    moStore.setDeal(null);
  }

  @action.bound
  public addNewDeal(): void {
    this.entry = { ...emptyDealEntry };
    this.originalEntry = { ...this.entry };
    this.entryType = EntryType.New;
    moStore.setDeal(null);
  }

  @action.bound
  public updateEntry(name: keyof DealEntry, value: any): void {
    if (name === "strategy") {
      const { deal } = moStore;
      const strategy: MOStrategy = moStore.getStrategyById(value);
      const legsCount: number = moStore.getOutLegsCount(value);
      const price: number | null = !!deal ? deal.lastPrice : null;
      this.entry = {
        ...this.entry,
        [name]: value,
        legs: legsCount,
        strike: strategy.strike,
        spread: strategy.spreadvsvol === "spread" ? price : undefined,
        vol: strategy.spreadvsvol === "vol" ? price : undefined,
      };
    } else {
      this.entry = { ...this.entry, [name]: value };
    }
  }
}

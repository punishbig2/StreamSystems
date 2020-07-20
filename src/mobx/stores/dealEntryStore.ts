import { API } from "API";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { action, computed, observable } from "mobx";
import dealsStore from "mobx/stores/dealsStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { DealEntry, emptyDealEntry, EntryType } from "structures/dealEntry";
import { createDealEntry } from "utils/dealUtils";

export class DealEntryStore {
  @observable entryType: EntryType = EntryType.Empty;
  @observable entry: DealEntry = { ...emptyDealEntry };
  private originalEntry: DealEntry = { ...emptyDealEntry };

  @computed
  public get isModified(): boolean {
    return moStore.isEditMode; // !deepEqual(this.entry, this.originalEntry);
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
    if (entry.tenor === "") return false;
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
    moStore.setEditMode(true);
  }

  @action.bound
  public addNewDeal(): void {
    this.entry = { ...emptyDealEntry };
    this.originalEntry = { ...this.entry };
    this.entryType = EntryType.New;
    moStore.setDeal(null);
    moStore.setEditMode(true);
  }

  @action.bound
  public cancelAddOrClone(): void {
    if (moStore.deal !== null) {
      moStore.setDeal({ ...moStore.deal });
    } else {
      moStore.setLegs([], null);
      this.reset();
    }
    moStore.setEditMode(false);
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
        spread: strategy.spreadvsvol === "spread" ? price : undefined,
        strike: strategy.strike,
        vol: strategy.spreadvsvol === "vol" ? price : undefined,
      };
    } else {
      this.entry = { ...this.entry, [name]: value };
    }
  }

  private setCurrentDeal = (id: string) => {
    dealsStore.setSelectedDeal(id);
  };

  private buildRequest() {
    const {
      buyer,
      strike,
      seller,
      strategy,
      currencyPair,
      model,
      notional,
      tenor,
      vol,
      spread,
      expiryDate,
    } = this.entry;
    if (notional === null || notional === undefined)
      throw new Error("notional must be set");
    const moStrategy: MOStrategy = moStore.strategies[strategy];
    if (moStrategy === undefined)
      throw new Error("invalid strategy, how did you pick it?");
    const price: number | null | undefined =
      moStrategy.spreadvsvol === "vol" ? vol : spread;
    return {
      buyer: buyer,
      seller: seller,
      strike: strike,
      strategy: strategy,
      symbol: currencyPair,
      model: model,
      price: !!price ? price.toString() : null,
      size: Math.round(notional / 1e6).toString(),
      tenor: tenor,
      expiryDate: expiryDate,
    };
  }

  @action.bound
  public submit() {
    const { dealId } = this.entry;
    moStore.setStatus(MOStatus.Submitting);
    API.sendTradeCaptureReport(dealId)
      .then(() => {
        moStore.setSuccessMessage({
          title: "Submission Successful",
          text: "The submission was successful, close this window now",
        });
      })
      .catch(() => {
        moStore.setError({
          status: "Unknown error",
          error: "Unexpected Error",
          message: "Something didn't go as expected, please contact support",
          code: 800,
        });
      })
      .finally(() => {
        moStore.setStatus(MOStatus.Normal);
      });
  }

  @action.bound
  public saveCurrentEntry() {
    const { entry } = this;
    const request = {
      ...this.buildRequest(),
      linkid: entry.dealId,
    };
    moStore.setStatus(MOStatus.UpdatingDeal);
    // Call the backend
    API.updateDeal(request)
      .then(() => {
        moStore.setSuccessMessage({
          title: "Saved Successfully",
          text: "The deal was correctly saved, please close this window now",
        });
      })
      .catch(() => {
        moStore.setError({
          status: "Unknown Error",
          code: 801,
          message: "There was a problem saving the deal",
          error: "Unknown Error",
        });
      });
  }

  @action.bound
  public createOrClone() {
    switch (this.entryType) {
      case EntryType.Empty:
      case EntryType.ExistingDeal:
        throw new Error("this function should not be called in current state");
      case EntryType.New:
        moStore.setStatus(MOStatus.CreatingDeal);
        API.createDeal(this.buildRequest())
          .then((id: string) => {
            this.setCurrentDeal(id);
            moStore.setSuccessMessage({
              title: "Saved Successfully",
              text:
                "The deal was correctly created with id `" +
                id +
                "', please close this window now",
            });
          })
          .catch((reason: any) => {
            moStore.setError({
              status: reason,
              code: 801,
              message: "There was a problem saving the deal",
              error: "Unknown Error",
            });
          });
        break;
      case EntryType.Clone:
        moStore.setStatus(MOStatus.CreatingDeal);
        API.cloneDeal(this.buildRequest())
          .then((id: string) => {
            this.setCurrentDeal(id);
            moStore.setSuccessMessage({
              title: "Saved Successfully",
              text:
                "The deal was correctly created with id `" +
                id +
                "', please close this window now",
            });
          })
          .catch((reason: any) => {
            moStore.setError({
              status: reason,
              code: 801,
              message: "There was a problem saving the deal",
              error: "Unknown Error",
            });
          });
        break;
    }
  }
}

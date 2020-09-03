import { API } from "API";
import { submitToSEF } from "components/MiddleOffice/DealEntryForm/hooks/submitToSEF";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { action, computed, observable } from "mobx";
import dealsStore from "mobx/stores/dealsStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { DealEntry, emptyDealEntry, EntryType } from "structures/dealEntry";
import { MiddleOfficeError } from "types/middleOfficeError";
import { createDealEntry } from "utils/dealUtils";

const savingDealError = (reason: any): MiddleOfficeError => {
  const message: string =
    typeof reason === "string"
      ? reason
      : typeof reason.getMessage === "function"
      ? reason.getMessage()
      : "Server error";
  return {
    status: "801",
    code: 801,
    content: message === "" ? "Server error" : message,
    error: "Cannot create or save the deal",
  };
};

export class DealEntryStore {
  @observable entryType: EntryType = EntryType.Empty;
  @observable entry: DealEntry = { ...emptyDealEntry };
  private originalEntry: DealEntry = { ...emptyDealEntry };

  @computed
  public get isModified(): boolean {
    return moStore.isEditMode;
  }

  public getModifiedFields(): string[] {
    const { entry } = this;
    const fields: string[] = [];
    for (const key of Object.keys(entry) as (keyof DealEntry)[]) {
      if (this.originalEntry[key] !== entry[key]) {
        fields.push(key);
      }
    }
    return fields;
  }

  @computed
  public get isReadyForSubmission(): boolean {
    const { entry } = this;
    if (!this.isModified) return false;
    if (entry.ccypair === "") return false;
    if (entry.strategy === "") return false;
    if (entry.buyer === "") return false;
    if (entry.seller === "") return false;
    if (entry.model === "") return false;
    if (entry.tenor1 === "") return false;
    if (entry.premstyle === "") return false;
    if (entry.deltastyle === "") return false;
    return entry.not1 !== null;
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
    this.entry = createDealEntry(moStore.deal);
    console.log(this.entry);
    this.originalEntry = { ...this.entry };
    this.entryType = EntryType.Clone;
    moStore.setEditMode(true);
  }

  @action.bound
  public addNewDeal(): void {
    this.entry = { ...emptyDealEntry, type: EntryType.New };
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
      const strategy: MOStrategy = moStore.getStrategyById(value);
      const legsCount: number = moStore.getOutLegsCount(value);
      this.entry = {
        ...this.entry,
        [name]: value,
        legs: legsCount,
        dealstrike: strategy.strike,
      };
    } else {
      if (this.entry[name] === value) return;
      this.entry = { ...this.entry, [name]: value };
    }
  }

  private setCurrentDeal = (id: string) => {
    dealsStore.setSelectedDeal(id);
  };

  private buildRequest() {
    const { entry } = this;
    if (entry.not1 === null || entry.not1 === undefined)
      throw new Error("notional must be set");
    const moStrategy: MOStrategy = moStore.strategies[entry.strategy];
    if (moStrategy === undefined)
      throw new Error("invalid strategy, how did you pick it?");
    const rates = ((summaryLeg: SummaryLeg | null) => {
      if (summaryLeg === null) return {};
      return {
        fwdrate1: summaryLeg.fwdrate1,
        fwdpts1: summaryLeg.fwdpts1,
        fwdrate2: summaryLeg.fwdrate2,
        fwdpts2: summaryLeg.fwdpts2,
      };
    })(moStore.summaryLeg);
    return {
      buyer: entry.buyer,
      seller: entry.seller,
      strike: entry.dealstrike,
      strategy: entry.strategy,
      symbol: entry.ccypair,
      model: entry.model,
      vol: entry.vol,
      spread: entry.spread,
      size: Math.round(entry.not1 / 1e6).toString(),
      notional1: entry.not2,
      tenor1: entry.tenor1,
      tenor2: entry.tenor2,
      expiry1: entry.tenor1expiry,
      expiry2: entry.tenor2expiry,
      deltaStyle: entry.deltastyle,
      premiumStyle: entry.premstyle,
      ...rates,
    };
  }

  @action.bound
  public submit() {
    submitToSEF(this.entry);
  }

  @action.bound
  public saveCurrentEntry() {
    const { entry } = this;
    const modifiedFields: string[] = this.getModifiedFields();
    const request = {
      ...this.buildRequest(),
      linkid: entry.dealId,
      product_fields_changed: modifiedFields,
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
      .catch((error: any) => {
        console.log(error);
        moStore.setError(savingDealError(error));
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
            console.log(reason);
            moStore.setError(savingDealError(reason));
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
            moStore.setError(savingDealError(reason));
          });
        break;
    }
  }
}

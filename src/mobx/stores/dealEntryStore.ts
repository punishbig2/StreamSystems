import { API } from "API";
import { submitToSEF } from "components/MiddleOffice/DealEntryForm/hooks/submitToSEF";
import { Deal } from "components/MiddleOffice/types/deal";
import {
  InvalidStrategy,
  MOStrategy,
} from "components/MiddleOffice/types/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { action, computed, observable } from "mobx";
import dealsStore from "mobx/stores/dealsStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { DealEntry, emptyDealEntry, EntryType } from "structures/dealEntry";
import { MOErrorMessage } from "types/middleOfficeError";
import { InvalidSymbol } from "types/symbol";
import { coalesce } from "utils";
import { createDealEntry } from "utils/dealUtils";
import { resolveStrategyDispute } from "utils/resolveStrategyDispute";

const savingDealError = (reason: any): MOErrorMessage => {
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
  @observable busyField: keyof DealEntry | null = null;
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
    if (entry.symbol === InvalidSymbol) return false;
    if (entry.strategy === InvalidStrategy) return false;
    if (entry.buyer === "") return false;
    if (entry.seller === "") return false;
    if (entry.model === "") return false;
    if (entry.tenor1 === null) return false;
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
    this.entry = { ...this.entry, type: EntryType.Clone };
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
    setTimeout(() => {
      moStore.setEditMode(true);
    }, 0);
  }

  @action.bound
  public cancelAddOrClone(): void {
    moStore.setLegs([], null);
    this.reset();
    moStore.setEditMode(false);
  }

  @action.bound
  private setEntry(entry: DealEntry) {
    this.entry = entry;
  }

  private async buildNewEntry(partial: Partial<DealEntry>): Promise<DealEntry> {
    const { entry } = this;
    const strategy: MOStrategy | undefined = resolveStrategyDispute(
      partial,
      entry
    );
    const not1: number | null =
      partial.not1 !== undefined ? partial.not1 : entry.not1;
    if (strategy !== undefined) {
      const legsCount: number = moStore.getOutLegsCount(strategy.productid);
      if (strategy.strike) {
        console.warn("hey, this strategy has a strike: " + strategy.strike);
      }
      return {
        ...entry,
        ...partial,
        legs: legsCount,
        size: not1 !== null ? Math.round(not1 / 1e6) : 0,
      };
    } else {
      return { ...this.entry, ...partial };
    }
  }

  @action.bound
  public async updateEntry(partial: Partial<DealEntry>): Promise<void> {
    const newEntry = await this.buildNewEntry(partial);
    // If the tenor changed get the dates, otherwise
    // we already have them

    await moStore.updateLegs(newEntry);
    // Now that we're done
    this.setEntry(newEntry);
  }

  private setCurrentDeal = (id: string) => {
    dealsStore.setSelectedDeal(id);
  };

  private buildRequest(): DealEntry {
    const { entry } = this;
    if (entry.not1 === null || entry.not1 === undefined)
      throw new Error("notional must be set");
    const rates = ((summaryLeg: SummaryLeg | null) => {
      if (summaryLeg === null) return {};
      return {
        fwdrate1: coalesce(summaryLeg.fwdrate1, undefined),
        fwdpts1: coalesce(summaryLeg.fwdpts1, undefined),
        fwdrate2: coalesce(summaryLeg.fwdrate2, undefined),
        fwdpts2: coalesce(summaryLeg.fwdpts2, undefined),
      };
    })(moStore.summaryLeg);
    return {
      ...entry,
      ...rates,
    };
  }

  @action.bound
  public submit() {
    submitToSEF(this.entry);
  }

  @action.bound
  public saveCurrentEntry() {
    const modifiedFields: string[] = this.getModifiedFields();
    const request = {
      ...this.buildRequest(),
    };
    moStore.setStatus(MOStatus.UpdatingDeal);
    // Call the backend
    API.updateDeal(request, modifiedFields)
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
        API.createDeal(this.buildRequest(), [])
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
        API.cloneDeal(this.buildRequest(), [])
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

  @action.bound
  public setWorking(busyField: keyof DealEntry | null) {
    this.busyField = busyField;
  }
}

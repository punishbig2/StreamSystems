import { API, BankEntitiesQueryResponse, HTTPError } from "API";
import { Cut } from "components/MiddleOffice/types/cut";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/types/legOptionsDef";
import {
  EditableFlag,
  InvalidStrategy,
  MOStrategy,
  StrategyMap,
} from "components/MiddleOffice/types/moStrategy";
import { ValuationModel } from "components/MiddleOffice/types/pricer";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { toast, ToastType } from "components/toast";
import config from "config";
import deepEqual from "deep-equal";
import { action, computed, observable } from "mobx";

import workareaStore from "mobx/stores/workareaStore";
import { DealEntry, emptyDealEntry, EntryType } from "structures/dealEntry";
import { BankEntity } from "types/bankEntity";
import { MOErrorMessage } from "types/middleOfficeError";
import { InvalidSymbol, Symbol } from "types/symbol";
import { coalesce } from "utils/commonUtils";
import { createDealEntry } from "utils/dealUtils";
import { initializeLegFromEntry } from "utils/legFromEntryInitializer";
import { resolveStrategyDispute } from "utils/resolveStrategyDispute";
import { isTenor } from "../../components/FormField/helpers";
import { EditableFilter, Level } from "../../forms/fieldDef";
import { CalendarVolDatesResponse } from "../../types/calendarFXPair";
import { DealStatus } from "../../types/dealStatus";
import { FixTenorResult } from "../../types/fixTenorResult";
import { InvalidTenor, Tenor } from "../../types/tenor";
import { forceParseDate, toUTC } from "../../utils/timeUtils";

const SOFT_PRICING_ERROR: string =
  "Timed out while waiting for the pricing result, please refresh the screen. " +
  "If the deal is not priced yet, try again as this is a problem that should not happen and never be repeated. " +
  "If otherwise the problem persists, please contact support.";
const SOFT_SEF_ERROR: string =
  "Timed out while waiting for the submission result, please refresh the screen. " +
  "If the deal is not submitted yet, try again as this is a problem that should not happen and never be repeated. " +
  "If otherwise the problem persists, please contact support.";

export enum MoStatus {
  Normal,
  Submitting,
  Pricing,
  LoadingDeal,
  CreatingDeal,
  UpdatingDeal,
}

interface LegDefinitions {
  [strategy: string]: {
    in: LegOptionsDefIn[];
    out: LegOptionsDefOut[];
  };
}

export interface InternalValuationModel {
  ValuationModelID: number;
  OptionModel: string;
  OptionModelDesc: string;
  OptionModelParameters: string;
}

export const messages: {
  [key in MoStatus]: string;
} = {
  [MoStatus.Normal]: "",
  [MoStatus.Pricing]: "Pricing in progress",
  [MoStatus.Submitting]: "Submitting",
  [MoStatus.CreatingDeal]: "Creating Deal",
  [MoStatus.UpdatingDeal]: "Updating Deal",
  [MoStatus.LoadingDeal]: "Loading Deal",
};

export interface MoGenericMessage {
  title: string;
  text: string;
}

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

export class MoStore {
  @observable legs: Leg[] = [];
  @observable summaryLeg: SummaryLeg | null = null;
  @observable isInitialized: boolean = false;
  @observable progress: number = 0;
  @observable error: MOErrorMessage | null = null;
  @observable isEditMode: boolean = false;
  @observable status: MoStatus = MoStatus.Normal;
  @observable successMessage: MoGenericMessage | null = null;
  @observable entryType: EntryType = EntryType.Empty;
  @observable isWorking: boolean = false;
  @observable.ref entry: DealEntry = { ...emptyDealEntry };
  @observable.ref deals: Deal[] = [];
  @observable selectedDealID: string | null = null;
  @observable isLoadingLegs: boolean = false;
  @observable isModified: boolean = false;

  private originalEntry: DealEntry = { ...emptyDealEntry };
  private operationsCount = 10;

  public entities: BankEntitiesQueryResponse = {};
  public entitiesMap: { [p: string]: BankEntity } = {};
  public strategies: { [id: string]: MOStrategy } = {};
  public styles: ReadonlyArray<string> = [];
  public models: ReadonlyArray<InternalValuationModel> = [];
  public legDefinitions: LegDefinitions = {};
  public cuts: ReadonlyArray<Cut> = [];
  public deltaStyles: ReadonlyArray<string> = [];
  public premiumStyles: ReadonlyArray<string> = [];

  @computed
  public get tenors(): ReadonlyArray<string> {
    return workareaStore.tenors;
  }

  @computed get isDealEditable(): boolean {
    const { entry } = this;
    switch (entry.status) {
      case DealStatus.Pending:
      case DealStatus.Priced:
      case DealStatus.SEFUnconfirmed:
        return true;
      case DealStatus.STP:
      case DealStatus.SEFConfirmed:
      default:
        return false;
    }
  }

  public async loadReferenceData(): Promise<void> {
    if (!this.isInitialized) {
      this.setCuts(await API.getCuts());
      this.setStrategies(await API.getProductsEx());
      this.setStyles(await API.getOptexStyle());
      this.setModels(await API.getValuModel());
      this.setBankEntities(await API.getBankEntities());
      this.setDeltaStyles(await API.getDeltaStyles());
      this.setPremiumStyles(await API.getPremiumStyles());
      await this.loadDeals();
      // Load leg definitions
      const inDefs: {
        [strategy: string]: LegOptionsDefIn[];
      } = this.legOptionsReducer<LegOptionsDefIn>(
        await API.getOptionLegsDefIn()
      );
      const outDefs: {
        [strategy: string]: LegOptionsDefOut[];
      } = this.legOptionsReducer<LegOptionsDefOut>(
        await API.getOptionLegsDefOut()
      );
      const keys: string[] = Array.from(
        new Set<string>([...Object.keys(inDefs), ...Object.keys(outDefs)])
      );
      this.legDefinitions = keys.reduce(
        (
          item: {
            [strategy: string]: {
              in: LegOptionsDefIn[];
              out: LegOptionsDefOut[];
            };
          },
          key: string
        ): {
          [strategy: string]: {
            in: LegOptionsDefIn[];
            out: LegOptionsDefOut[];
          };
        } => {
          return {
            ...item,
            [key]: {
              in: inDefs[key],
              out: outDefs[key],
            },
          };
        },
        {}
      );
      setTimeout(() => {
        this.setProgress(100);
        this.setInitialized();
      }, 0);
    }
  }

  @action.bound
  private setProgress(value: number): void {
    this.progress = Math.min(Math.max(value, 0), 100);
  }

  @action.bound
  private setInitialized(): void {
    this.isInitialized = true;
  }

  private increaseProgress(): void {
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  @action.bound
  private setCuts(cuts: Cut[]): void {
    this.cuts = cuts;
    this.increaseProgress();
  }

  @action.bound
  private setStrategies(array: MOStrategy[]): void {
    this.strategies = array.reduce(
      (strategies: StrategyMap, next: MOStrategy): StrategyMap => {
        return { ...strategies, [next.productid]: next };
      },
      {}
    );
    this.increaseProgress();
  }

  @action.bound
  private setStyles(styles: string[]): void {
    this.styles = styles;
    this.increaseProgress();
  }

  @action.bound
  private setDeltaStyles(styles: ReadonlyArray<string>): void {
    this.deltaStyles = styles;
    this.increaseProgress();
  }

  @action.bound
  private setPremiumStyles(styles: ReadonlyArray<string>): void {
    this.premiumStyles = styles;
    this.increaseProgress();
  }

  @action.bound
  private setBankEntities(entities: BankEntitiesQueryResponse): void {
    this.entities = entities;
    this.entitiesMap = Object.values(entities)
      .reduce(
        (accum: BankEntity[], next: BankEntity[]): BankEntity[] => [
          ...accum,
          ...next,
        ],
        []
      )
      .reduce(
        (
          map: { [p: string]: BankEntity },
          entity: BankEntity
        ): {
          [p: string]: BankEntity;
        } => ({ ...map, [entity.code]: entity }),
        {}
      );
    this.increaseProgress();
  }

  @action.bound
  private setModels(models: InternalValuationModel[]): void {
    this.models = models;
    this.increaseProgress();
  }

  private legOptionsReducer<T extends LegOptionsDefIn | LegOptionsDefOut>(
    array: any[]
  ): { [id: string]: T[] } {
    return array.reduce((groups: { [strategy: string]: T[] }, option: T) => {
      const key: string = option.productid;
      if (groups[key] === undefined) {
        groups[key] = [option];
      } else {
        groups[key].push(option);
      }
      return groups;
    }, {});
  }

  @computed
  public get banks(): ReadonlyArray<string> {
    return workareaStore.banks;
  }

  @computed
  get symbols(): ReadonlyArray<Symbol> {
    const { symbols, user } = workareaStore;
    return symbols.filter((symbol: Symbol): boolean => {
      const { regions } = user;
      if (regions === undefined) return false;
      return regions.includes(symbol.ccyGroup);
    });
  }

  @action.bound
  public setSummaryLeg(summaryLeg: SummaryLeg | null): void {
    this.summaryLeg = summaryLeg;
  }

  @action.bound
  private async loadDeals(): Promise<void> {
    // Update deals list
    const deals: Deal[] = await API.getDeals();
    this.deals = deals.sort(
      ({ tradeDate: d1 }: Deal, { tradeDate: d2 }: Deal): number =>
        d2.getTime() - d1.getTime()
    );
    this.increaseProgress();
  }

  @action.bound
  public setLegs(
    legs: ReadonlyArray<Leg>,
    summaryLeg: SummaryLeg | null,
    reset = false
  ): void {
    this.summaryLeg = summaryLeg;
    this.legs = legs.slice();
    this.isLoadingLegs = false;
    if (reset) {
      this.status = MoStatus.Normal;
    }
  }

  public getStrategyById(id: string): MOStrategy {
    if (this.strategies[id] !== undefined) return this.strategies[id];
    return InvalidStrategy;
  }

  public getValuationModelById(id: number): ValuationModel {
    const { models } = this;
    const model: InternalValuationModel | undefined = models.find(
      (model: InternalValuationModel): boolean => {
        return model.ValuationModelID === id;
      }
    );
    if (model === undefined) throw new Error("cannot find the valuation model");
    return {
      OptionModelType: model.OptionModel,
      OptionModelParamaters: !!model.OptionModelParameters
        ? model.OptionModelParameters
        : "",
    };
  }

  public getOutLegsCount(strategy: string): number {
    const definition:
      | { in: LegOptionsDefIn[]; out: LegOptionsDefOut[] }
      | undefined = this.legDefinitions[strategy];
    if (definition !== undefined) {
      const { out }: { out: LegOptionsDefOut[] } = definition;
      if (!out) return 0;
      return out.length;
    } else {
      return 0;
    }
  }

  @action.bound
  public setError(error: MOErrorMessage | null): void {
    this.error = error;
    this.status = MoStatus.Normal;
  }

  @action.bound
  public async updateLegs(entry: DealEntry): Promise<void> {
    const { legs } = this;
    const { symbol } = entry;
    this.legs = await Promise.all(
      legs.map(
        async (leg: Leg, index: number): Promise<Leg> => {
          const newFields: Partial<Leg> = await initializeLegFromEntry(
            entry,
            leg,
            symbol,
            index
          );
          return { ...leg, ...newFields };
        }
      )
    );
  }

  public updateLeg(index: number, key: keyof Leg, value: any): void {
    const { legs } = this;
    this.legs = [
      ...legs.slice(0, index),
      {
        ...legs[index],
        [key]: value,
      },
      ...legs.slice(index + 1),
    ];
  }

  public findSymbolById(currencyPair: string): Symbol {
    // Search all system symbols
    const { symbols } = workareaStore;
    const found: Symbol | undefined = symbols.find(
      (symbol: Symbol) => symbol.symbolID === currencyPair
    );
    if (found !== undefined) {
      return found;
    } else {
      return InvalidSymbol;
    }
  }

  @action.bound
  public setEditMode(mode: boolean): void {
    this.isEditMode = mode;
  }

  @action.bound
  public setStatus(status: MoStatus): void {
    this.status = status;
  }

  @action.bound
  public setSuccessMessage(message: MoGenericMessage | null): void {
    this.successMessage = message;
    this.status = MoStatus.Normal;
  }

  @action.bound
  public setErrorMessage(error: MOErrorMessage | null): void {
    this.error = error;
  }

  @action.bound
  public setSoftError(message: string) {
    if (
      this.status === MoStatus.Submitting ||
      this.status === MoStatus.Pricing
    ) {
      this.status = MoStatus.Normal;
      // Show a toast message (soft error message)
      toast.show(message, ToastType.Error, -1);
    }
  }

  @action.bound
  public updateSummaryLeg(fieldName: keyof SummaryLeg, value: any): void {
    this.summaryLeg = { ...this.summaryLeg, [fieldName]: value } as SummaryLeg;
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
    if (entry.buyer === entry.seller) return false;
    if (entry.model === "") return false;
    if (entry.tenor1 === null) return false;
    if (entry.premstyle === "") return false;
    if (entry.deltastyle === "") return false;
    return entry.not1 !== null;
  }

  private static async fixTenorDates(
    originalTenor: Tenor | InvalidTenor | undefined | null,
    entry: DealEntry
  ): Promise<FixTenorResult> {
    const { symbol } = entry;
    if (!originalTenor || !isTenor(originalTenor) || originalTenor.name === "")
      return {
        tenor: null,
        horizonDateUTC: "",
        spotDate: "",
        tradeDate: "",
      };
    const dates: CalendarVolDatesResponse = await (async (): Promise<
      CalendarVolDatesResponse
    > => {
      if (originalTenor.name === "SPECIFIC") {
        return API.queryVolDates(
          {
            fxPair: symbol.symbolID,
            addHolidays: true,
            rollExpiryDates: true,
            tradeDate: toUTC(entry.tradeDate, true),
          },
          [toUTC(originalTenor.expiryDate)]
        );
      } else {
        return API.queryVolTenors(
          {
            fxPair: symbol.symbolID,
            addHolidays: true,
            rollExpiryDates: true,
            tradeDate: toUTC(entry.tradeDate, true),
          },
          [originalTenor.name]
        );
      }
    })();
    return {
      tenor: {
        name: originalTenor.name,
        deliveryDate: forceParseDate(dates.DeliveryDates[0]),
        expiryDate: forceParseDate(dates.ExpiryDates[0]),
      },
      horizonDateUTC: dates.HorizonDateUTC,
      spotDate: dates.SpotDate,
      tradeDate: dates.TradeDate,
    };
  }

  private static async resolveDatesIfNeeded(
    entry: DealEntry
  ): Promise<DealEntry> {
    const { tenor1, tenor2 } = entry;
    // Query dates for regular tenors
    const tenor1Dates: FixTenorResult = await MoStore.fixTenorDates(
      tenor1,
      entry
    );
    const tenor2Dates: FixTenorResult = await MoStore.fixTenorDates(
      tenor2,
      entry
    );
    const spotDate: Date = forceParseDate(tenor1Dates.spotDate);
    const tradeDate: Date = forceParseDate(tenor1Dates.tradeDate);
    return {
      ...entry,
      tenor1: !!tenor1Dates.tenor ? tenor1Dates.tenor : tenor1,
      tenor2: tenor2Dates.tenor,
      horizonDateUTC: forceParseDate(tenor1Dates.horizonDateUTC),
      premiumDate: spotDate,
      spotDate: spotDate,
      tradeDate: tradeDate,
    };
  }

  @action.bound
  public setDeal(deal: Deal | null): void {
    const { entry } = this;
    if (
      (this.isEditMode && deal !== null && entry.dealID !== deal.id) ||
      (this.isEditMode && deal === null)
    ) {
      return;
    }
    if (deal === null) {
      this.entry = { ...emptyDealEntry };
      this.entryType = EntryType.Empty;
      this.selectedDealID = null;
    } else {
      this.entryType = EntryType.ExistingDeal;
      this.selectedDealID = deal.id;
      const entry: DealEntry = createDealEntry(deal);
      // If we do need to resolve the dates, let's do so
      MoStore.resolveDatesIfNeeded(entry).then((newEntry: DealEntry): void => {
        // This is mandatory or `this' would not be perfectly
        // specified and defined
        this.setEntry(newEntry);
      });
    }
    // This is because we are going to load the legs as soon
    // as this method returns because we're going to use the
    // change in the `entry' object to reload the legs
    this.originalEntry = { ...this.entry };
    this.legs = [];
    this.summaryLeg = null;
    this.isLoadingLegs = true;
  }

  @action.bound
  public reset(): void {
    if (this.entryType === EntryType.New) {
      this.entryType = EntryType.Empty;
      this.entry = { ...emptyDealEntry };
      this.originalEntry = { ...this.entry };
      this.legs = [];
      this.summaryLeg = null;
    }
    this.isEditMode = false;
  }

  @action.bound
  public cloneDeal(): void {
    this.entry = { ...this.entry, type: EntryType.Clone, dealID: undefined };
    this.originalEntry = { ...this.entry };
    this.entryType = EntryType.Clone;
    this.isEditMode = true;
  }

  @action.bound
  public addNewDeal(): void {
    this.entry = { ...emptyDealEntry, type: EntryType.New };
    this.originalEntry = { ...this.entry };
    this.entryType = EntryType.New;
    this.isEditMode = true;
    this.legs = [];
    this.summaryLeg = null;
  }

  @action.bound
  public cancelAddOrClone(): void {
    this.reset();
  }

  @action.bound
  private setEntry(entry: DealEntry) {
    if (deepEqual(entry, this.entry)) return;
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
      const legsCount: number = this.getOutLegsCount(strategy.productid);
      if (strategy.strike) {
        console.warn("hey, this strategy has a strike: " + strategy.strike);
      }
      return {
        ...entry,
        ...partial,
        legs: legsCount,
        size: not1 !== null ? not1 / 1e6 : 0,
      };
    } else {
      return { ...this.entry, ...partial };
    }
  }

  public async updateEntry(partial: Partial<DealEntry>): Promise<void> {
    const newEntry = await this.buildNewEntry(partial);
    // If the tenor changed get the dates, otherwise
    // we already have them
    await this.updateLegs(newEntry);
    this.isModified = true;
    this.setEntry(newEntry);
  }

  private buildRequest(): DealEntry {
    const { entry } = this;
    if (entry.not1 === null || entry.not1 === undefined)
      throw new Error("notional must be set");
    const { summaryLeg } = this;
    const otherFields = ((
      summaryLeg: SummaryLeg | null
    ): Partial<DealEntry> => {
      if (summaryLeg === null) return {};
      return {
        fwdrate1: coalesce(summaryLeg.fwdrate1, undefined),
        fwdpts1: coalesce(summaryLeg.fwdpts1, undefined),
        fwdrate2: coalesce(summaryLeg.fwdrate2, undefined),
        fwdpts2: coalesce(summaryLeg.fwdpts2, undefined),
        extra_fields: {
          spot: summaryLeg.spot,
        },
      };
    })(summaryLeg);
    return {
      ...entry,
      ...otherFields,
    };
  }

  private static async doSubmit(
    dealID: string,
    status: DealStatus
  ): Promise<any> {
    if (status === DealStatus.Priced) {
      return API.sendTradeCaptureReport(dealID);
    } else if (status === DealStatus.SEFConfirmed) {
      return API.stpSendReport(dealID);
    }
  }

  @action.bound
  public submit() {
    const { dealID, status } = this.entry;
    if (dealID === undefined)
      throw new Error("cannot send a trade capture without a deal id");
    this.setStatus(MoStatus.Submitting);
    MoStore.doSubmit(dealID, status)
      .then((): void => {
        setTimeout((): void => {
          console.log(SOFT_SEF_ERROR);
        }, config.RequestTimeout);
      })
      .catch((error: any): void => {
        this.setError({
          status: "Unknown problem",
          code: 1,
          error: "Unexpected error",
          content: typeof error === "string" ? error : error.content(),
        });
      })
      .finally((): void => {
        this.setStatus(MoStatus.Normal);
      });
  }

  @action.bound
  public saveCurrentEntry() {
    const modifiedFields: string[] = this.getModifiedFields();
    const request = {
      ...this.buildRequest(),
    };
    this.setStatus(MoStatus.UpdatingDeal);
    // Call the backend
    API.updateDeal(request, modifiedFields)
      .then(() => {
        // Note: dealID must be defined here
        this.onDealSaved(request.dealID!);
      })
      .catch((error: any) => {
        this.setError(savingDealError(error));
      });
  }

  @action.bound
  public createOrClone() {
    switch (this.entryType) {
      case EntryType.Empty:
      case EntryType.ExistingDeal:
        throw new Error("this function should not be called in current state");
      case EntryType.New:
        this.setStatus(MoStatus.CreatingDeal);
        API.createDeal(this.buildRequest(), [])
          .then((id: string) => {
            this.onDealSaved(id);
          })
          .catch((reason: any) => {
            this.setError(savingDealError(reason));
          });
        break;
      case EntryType.Clone:
        this.setStatus(MoStatus.CreatingDeal);
        API.cloneDeal(this.buildRequest(), [])
          .then((id: string) => {
            this.onDealSaved(id);
          })
          .catch((reason: any) => {
            this.setError(savingDealError(reason));
          });
        break;
    }
  }

  @action.bound
  private onDealSaved(id: string): void {
    const { deals } = this;
    const deal: Deal | undefined = deals.find(
      (each: Deal): boolean => each.id === id
    );
    this.isEditMode = false;
    if (deal !== undefined) {
      this.entry = createDealEntry(deal);
    }
    this.selectedDealID = id;
    this.successMessage = {
      title: "Saved Successfully",
      text:
        "The deal was correctly created with id `" +
        id +
        "', please close this window now",
    };
    this.entryType = EntryType.ExistingDeal;
    this.status = MoStatus.Normal;
    MoStore.resolveDatesIfNeeded(this.entry).then(
      (newEntry: DealEntry): void => {
        this.setEntry(newEntry);
      }
    );
  }

  @action.bound
  public setWorking(isWorking: boolean) {
    this.isWorking = isWorking;
  }

  public findDeal(id: string): Deal | undefined {
    const { deals } = this;
    return deals.find((deal: Deal): boolean => deal.id === id);
  }

  @action.bound
  public async addDeal(deal: Deal): Promise<void> {
    const { deals } = this;
    const index: number = deals.findIndex(
      (each: Deal): boolean => each.id === deal.id
    );
    const currentDealID: string | null = this.selectedDealID;
    if (index === -1) {
      this.deals = [deal, ...deals];
      if (this.isEditMode && this.selectedDealID !== deal.id) {
        return;
      }
      this.entry = await createDealEntry(deal);
    } else {
      this.deals = [...deals.slice(0, index), deal, ...deals.slice(index + 1)];
      if (this.isEditMode && this.selectedDealID !== deal.id) {
        return;
      }
      // It was modified, so replay consequences
      if (currentDealID !== null && currentDealID === deal.id) {
        const newEntry = await createDealEntry(deal);
        if (!deepEqual(newEntry, this.entry)) {
          this.entry = newEntry;
        }
      }
    }
  }

  @action.bound
  public async removeDeal(id: string): Promise<void> {
    const { deals, entry } = this;
    const index: number = deals.findIndex((deal: Deal) => deal.id === id);
    if (index === -1) return;
    this.deals = [...deals.slice(0, index), ...deals.slice(index + 1)];
    // Update current entry
    if (entry.dealID === id) {
      return this.setDeal(null);
    }
  }

  public price(): void {
    const { entry } = this;
    if (entry.strategy === undefined) throw new Error("invalid deal found");
    if (entry.model === "") throw new Error("node model specified");
    const valuationModel: ValuationModel = this.getValuationModelById(
      entry.model as number
    );
    const { strategy } = entry;
    // Set the status to pricing to show a loading spinner
    this.status = MoStatus.Pricing;
    // Send the request
    API.sendPricingRequest(
      entry,
      this.legs,
      this.summaryLeg,
      valuationModel,
      strategy
    )
      .then(() => {
        setTimeout(() => {
          this.setSoftError(SOFT_PRICING_ERROR);
        }, config.RequestTimeout);
      })
      .catch((error: HTTPError | any) => {
        if (error !== undefined) {
          if (typeof error.getMessage === "function") {
            const message: string = error.getMessage();
            this.setError({
              code: error.getCode(),
              ...JSON.parse(message),
            });
          } else {
            console.warn(error);
          }
        } else {
          console.warn("undefined error, WTF?");
        }
      });
  }

  public static getFieldEditableFlag(
    name: string,
    strategy: MOStrategy
  ): EditableFlag {
    if (strategy.productid === "") return EditableFlag.Editable;
    const { f1 } = strategy.fields;
    const editableCondition: EditableFlag = f1[name];
    if (editableCondition === undefined) return EditableFlag.None;
    return editableCondition;
  }

  public static isEntryEditable(
    allowedTypes: number,
    entry: DealEntry,
    next = (_: DealEntry): boolean => true
  ): boolean {
    if (entry.status === DealStatus.SEFConfirmed) return false;
    if (!next(entry)) return false;
    return (entry.dealType & allowedTypes) !== 0;
  }

  public static createEditableFilter(
    allowedTypes: number,
    status = 0,
    next = (entry: DealEntry): boolean => true
  ): EditableFilter {
    return (
      name: string,
      entry: DealEntry,
      editable: boolean,
      level?: Level
    ): boolean => {
      if (!editable) return false;
      const flag: EditableFlag = MoStore.getFieldEditableFlag(
        name,
        entry.strategy
      );
      switch (flag) {
        case EditableFlag.Editable:
          return true;
        case EditableFlag.Priced:
          return entry.status === DealStatus.Priced;
        case EditableFlag.NotApplicable:
        case EditableFlag.NotEditable:
          return false;
        case EditableFlag.Pending:
          return entry.status === DealStatus.Pending;
        case EditableFlag.None:
          if (level === Level.Leg && name in entry) return false;
          if (name === "strategy" || name === "symbol") {
            // Always editable provided that it's a new deal
            return (
              entry.type === EntryType.New || entry.type === EntryType.Clone
            );
          }
          return false;
      }
      return MoStore.isEntryEditable(allowedTypes, entry, next);
    };
  }
}

export default new MoStore();

import { API, BankEntitiesQueryResponse, HTTPError, Task } from "API";
import { isTenor } from "components/FormField/helpers";
import {
  addFwdRates,
  createDefaultLegsFromDeal,
  handleLegsResponse,
} from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { Cut } from "components/MiddleOffice/types/cut";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/types/legOptionsDef";
import { ValuationModel } from "components/MiddleOffice/types/pricer";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { toast, ToastType } from "components/toast";
import config from "config";
import deepEqual from "deep-equal";
import { EditableFilter } from "forms/fieldDef";
import { action, computed, observable } from "mobx";

import workareaStore from "mobx/stores/workareaStore";
import signalRManager from "signalR/signalRManager";
import { DealEntry, emptyDealEntry, EntryType } from "structures/dealEntry";
import { BankEntity } from "types/bankEntity";
import { CalendarVolDatesResponse } from "types/calendarFXPair";
import { DealStatus } from "types/dealStatus";
import { FixTenorResult } from "types/fixTenorResult";
import { LegAdjustValue } from "types/legAdjustValue";
import { MOErrorMessage } from "types/middleOfficeError";
import { PricingMessage } from "types/pricingMessage";
import {
  EditableFlag,
  InvalidStrategy,
  Product,
  StrategyMap,
} from "types/product";
import { SEFUpdate } from "types/sefUpdate";
import { InvalidSymbol, Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { Workspace } from "types/workspace";
import { WorkspaceType } from "types/workspaceType";
import { createDealEntry } from "utils/dealUtils";
import { isNumber } from "utils/isNumber";
import { legsReducer } from "utils/legsReducer";
import { calculateNetValue, parseDates } from "utils/legsUtils";
import { safeForceParseDate, toUTC } from "utils/timeUtils";

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

export type ModelParameters = {};

export interface InternalValuationModel {
  ValuationModelID: number;
  OptionModel: string;
  OptionModelDesc: string;
  OptionModelParameters: ModelParameters;
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

export class MoStore implements Workspace {
  @observable.ref legs: ReadonlyArray<Leg> = [];
  @observable.ref summaryLeg: SummaryLeg | null = null;
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
  @observable.ref lockedDeals: ReadonlyArray<string> = [];
  @observable strategies: { [key: string]: Product } = {};
  public readonly id: string = "mo";
  @observable name: string = "";
  @observable modified: boolean = false;
  public readonly type: WorkspaceType = WorkspaceType.MiddleOffice;
  public entities: BankEntitiesQueryResponse = {};
  public entitiesMap: { [p: string]: BankEntity } = {};
  public styles: ReadonlyArray<string> = [];
  public models: ReadonlyArray<InternalValuationModel> = [];
  public legDefinitions: LegDefinitions = {};
  public cuts: ReadonlyArray<Cut> = [];
  public deltaStyles: ReadonlyArray<string> = [];
  public premiumStyles: ReadonlyArray<string> = [];
  private originalEntry: DealEntry = { ...emptyDealEntry };
  private originalLegs: ReadonlyArray<Leg> = [];
  private originalSummaryLeg: SummaryLeg | null = null;
  private operationsCount = 10;
  private modifiedFields: string[] = [];

  @observable _legAdjustValues: ReadonlyArray<LegAdjustValue> = [];

  @computed
  public get legAdjustValues(): ReadonlyArray<LegAdjustValue> {
    const { strategy, symbol } = this.entry;
    return this.getFilteredLegAdjustValues(strategy, symbol);
  }

  @computed
  public get defaultLegAdjust(): string {
    const { legAdjustValues } = this;
    if (legAdjustValues.length === 0) return "";
    return legAdjustValues[0].VegaLegAdjustValue;
  }

  @computed
  public get tenors(): ReadonlyArray<string> {
    return workareaStore.tenors;
  }

  @computed
  get isDealEditable(): boolean {
    const { entry, lockedDeals } = this;
    const { dealID } = entry;
    if (dealID === undefined) return false;
    if (lockedDeals.includes(dealID)) return false;
    switch (entry.status) {
      case DealStatus.Pending:
      case DealStatus.Priced:
      case DealStatus.SEFSubmitted:
        return true;
      case DealStatus.STPComplete:
      case DealStatus.SEFComplete:
      default:
        return false;
    }
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

  @computed
  public get isReadyForSubmission(): boolean {
    const { entry } = this;
    if (entry.symbol === InvalidSymbol) return false;
    if (entry.strategy === InvalidStrategy) return false;
    if (entry.buyer === "") return false;
    if (entry.seller === "") return false;
    if (entry.buyer === entry.seller) return false;
    if (entry.model === "") return false;
    if (entry.tenor1 === null) {
      return false;
    } else if (this.isFieldEditable("tenor2") && entry.tenor2 === null) {
      return false;
    }
    if (entry.premstyle === "") return false;
    return entry.deltastyle !== "";
  }

  @computed
  get isModified(): boolean {
    if (!this.isEditMode) return false;
    if (this.entryType === EntryType.New || this.entryType === EntryType.Clone)
      return true;
    return (
      !deepEqual(this.entry, this.originalEntry) ||
      !deepEqual(this.legs, this.originalLegs) ||
      !deepEqual(this.summaryLeg, this.originalSummaryLeg)
    );
  }

  @computed
  public get minimumNotional(): number {
    const { strategy } = this.entry;
    if (strategy.OptionProductType === "Spread") {
      return 0;
    } else {
      return 100000;
    }
  }

  public static fixTenorDates(
    originalTenor: Tenor | InvalidTenor | string | undefined | null,
    entry: DealEntry
  ): Task<FixTenorResult> {
    const { symbol } = entry;
    if (
      !originalTenor ||
      !isTenor(originalTenor) ||
      originalTenor.name === ""
    ) {
      return {
        execute: async (): Promise<FixTenorResult> => {
          return {
            tenor: null,
            horizonDateUTC: "",
            spotDate: "",
            tradeDate: "",
          };
        },
        cancel: (): void => {},
      };
    }
    const task: Task<CalendarVolDatesResponse> = ((): Task<CalendarVolDatesResponse> => {
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
      execute: async (): Promise<FixTenorResult> => {
        const dates: CalendarVolDatesResponse = await task.execute();
        return {
          tenor: {
            name: originalTenor.name,
            ...safeForceParseDate("deliveryDate", dates.DeliveryDates[0]),
            ...safeForceParseDate("expiryDate", dates.ExpiryDates[0]),
          },
          horizonDateUTC: dates.HorizonDateUTC,
          spotDate: dates.SpotDate,
          tradeDate: dates.TradeDate,
        };
      },
      cancel: (): void => {
        task.cancel();
      },
    };
  }

  public static getFieldEditableFlag(
    prefix: string,
    name: string,
    strategy: Product
  ): EditableFlag {
    if (strategy.productid === "") return EditableFlag.Editable;
    const { f1 } = strategy.fields;
    const key: string | undefined = ((
      prefix: string | null,
      name: string
    ): string | undefined => {
      const normalizedName: string = name.toLowerCase();
      if (f1[prefix + normalizedName] !== undefined) {
        return prefix + normalizedName;
      } else {
        return normalizedName;
      }
    })(prefix, name);
    if (key === undefined) return EditableFlag.None;
    const flag: EditableFlag = f1[key];
    if (flag === undefined) return EditableFlag.None;
    return flag;
  }

  public static isEntryEditable(
    allowedTypes: number,
    entry: DealEntry,
    isAllowedToEdit = (_: DealEntry): boolean => true
  ): boolean {
    if (entry.status === DealStatus.SEFComplete) return false;
    if (!isAllowedToEdit(entry)) return false;
    return (entry.dealType & allowedTypes) !== 0;
  }

  public static createEditableFilter(
    allowedTypes: number,
    status = 0,
    isAllowedToEdit: (entry: DealEntry) => boolean = (): boolean => true
  ): EditableFilter {
    return (
      name: string,
      entry: DealEntry,
      editable: boolean,
      prefix: string
    ): boolean => {
      if (!editable) return false;
      const flag: EditableFlag = MoStore.getFieldEditableFlag(
        prefix,
        name,
        entry.strategy
      );
      switch (flag) {
        case EditableFlag.Editable:
          return true;
        case EditableFlag.Priced:
          return true;
        case EditableFlag.NotApplicable:
        case EditableFlag.NotEditable:
          return false;
        case EditableFlag.Pending:
          return true;
        case EditableFlag.None:
          if (name === "strategy" || name === "symbol") {
            // Always editable provided that it's a new deal
            return (
              entry.type === EntryType.New || entry.type === EntryType.Clone
            );
          }
          return false;
      }
      return MoStore.isEntryEditable(allowedTypes, entry, isAllowedToEdit);
    };
  }

  private static async doSubmit(
    dealID: string,
    status: DealStatus
  ): Promise<any> {
    if (status === DealStatus.Priced) {
      return API.sendTradeCaptureReport(dealID);
    } else if (status === DealStatus.SEFComplete) {
      return API.stpSendReport(dealID);
    }
  }

  public getDefaultLegAdjust(strategy: Product, symbol: Symbol): string {
    const values: ReadonlyArray<LegAdjustValue> = this.getFilteredLegAdjustValues(
      strategy,
      symbol
    );
    if (values.length === 0) return "";
    return values[0].VegaLegAdjustValue;
  }

  public async loadReferenceData(): Promise<void> {
    if (!this.isInitialized) {
      this.setCuts(await API.getCuts());
      this.setStyles(await API.getOptexStyle());
      this.setModels(await API.getValuModel());
      this.setBankEntities(await API.getBankEntities());
      this.setDeltaStyles(await API.getDeltaStyles());
      this.setPremiumStyles(await API.getPremiumStyles());
      this.setLegAdjustValues(await API.getLegAdjustValues());
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

  public reloadStrategies(currency: string): void {
    const { products, symbols } = workareaStore;
    const symbol: Symbol | undefined = symbols.find(
      (symbol: Symbol): boolean => symbol.symbolID === currency
    );
    if (symbol === undefined) return;
    this.strategies = products
      .filter((strategy: Product): boolean => {
        const { ccyGroup } = symbol;
        const key: string = ccyGroup.toLowerCase();
        return strategy[key] === true;
      })
      .reduce((strategies: StrategyMap, next: Product): StrategyMap => {
        return { ...strategies, [next.productid]: next };
      }, {});
  }

  @action.bound
  public setSummaryLeg(summaryLeg: SummaryLeg | null): void {
    this.summaryLeg = summaryLeg;
  }

  @action.bound
  public setLegs(
    legs: ReadonlyArray<Leg>,
    summaryLeg: SummaryLeg | null,
    reset = false
  ): void {
    this.summaryLeg = summaryLeg;
    this.originalSummaryLeg = summaryLeg;
    this.legs = legs.slice();
    this.originalLegs = this.legs;
    this.isLoadingLegs = false;
    if (reset) {
      this.status = MoStatus.Normal;
    }
  }

  public getStrategyById(id: string): Product {
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
        : {},
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

  public async updateLeg(
    index: number,
    key: keyof Leg,
    value: any
  ): Promise<void> {
    const { legs, summaryLeg } = this;
    this.legs = [
      ...legs.slice(0, index),
      {
        ...legs[index],
        [key]: value,
      },
      ...legs.slice(index + 1),
    ];
    if (["hedge", "price", "premium"].includes(key) && summaryLeg !== null) {
      const { entry } = this;
      const dealOutput = {
        ...summaryLeg.dealOutput,
        hedge: calculateNetValue(entry.strategy, this.legs, "hedge"),
        premium: calculateNetValue(entry.strategy, this.legs, "premium"),
        price: calculateNetValue(entry.strategy, this.legs, "price"),
      };
      // Update summary net hedge
      this.summaryLeg = {
        ...summaryLeg,
        dealOutput: dealOutput,
      };
    }
    this.addModifiedField(key);
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
    if (fieldName.startsWith("fwd")) {
      this.legs = addFwdRates(this.legs, this.summaryLeg);
    }
    this.addModifiedField(fieldName);
  }

  public getModifiedFields(): string[] {
    return this.modifiedFields;
  }

  @action.bound
  public setDeal(deal: Deal | null): Task<void> {
    const { entry } = this;
    // Reload strategies now
    if (deal !== null) {
      this.reloadStrategies(deal.currency);
    }
    this.entry = { ...emptyDealEntry };
    if (
      (this.isEditMode && deal !== null && entry.dealID !== deal.id) ||
      (this.isEditMode && deal === null)
    ) {
      return {
        execute: async (): Promise<void> => {},
        cancel: (): void => {},
      };
    }
    this.modifiedFields = [];
    if (deal === null) {
      this.entry = { ...emptyDealEntry };
      this.entryType = EntryType.Empty;
      this.selectedDealID = null;
      this.originalEntry = this.entry;
      this.legs = [];
    } else {
      this.entryType = EntryType.ExistingDeal;
      this.selectedDealID = deal.id;
      // If we do need to resolve the dates, let's do so
      const task1: Task<{ legs: ReadonlyArray<Leg> } | null> =
        this.status === MoStatus.CreatingDeal
          ? this.getCurrentLegs()
          : API.getLegs(deal.id);
      const removeListener = signalRManager.addPricingResponseListener(
        (data: PricingMessage): void => {
          const { entry } = this;
          if (entry.dealID === data.dealId) {
            // Reset the extra fields
            entry.extra_fields = {
              fwdpts1: data.legs[0].fwdPts,
              fwdrate1: data.legs[0].fwdRate,
              fwdpts2: data.legs.length > 1 ? data.legs[1].fwdPts : null,
              fwdrate2: data.legs.length > 1 ? data.legs[1].fwdRate : null,
            };
            // It is the deal of interest so update
            // visible legs now
            const [legs, summaryLeg] = handleLegsResponse(
              entry,
              parseDates(data.legs),
              this.cuts
            );
            this.setLegs(legs, summaryLeg);
          }
        }
      );
      const task2: Task<DealEntry> = createDealEntry(deal);
      return {
        execute: async (): Promise<void> => {
          try {
            // Reset the legs now
            this.setLegs([], null);
            // Attempt to load new
            this.isLoadingLegs = this.status !== MoStatus.CreatingDeal;
            // Start loading now
            const response = await task1.execute();
            this.entry = await task2.execute();
            this.originalEntry = this.entry;
            if (response !== null) {
              const [legs, summary] = handleLegsResponse(
                this.entry,
                parseDates(response.legs),
                this.cuts
              );
              this.setLegs(legs, summary);
            } else {
              const [legs, summary] = createDefaultLegsFromDeal(
                this.cuts,
                this.entry
              );
              this.setLegs(legs, summary);
            }
            this.isLoadingLegs = false;
          } catch (error) {
            if (error !== "aborted") {
              throw error;
            }
          }
        },
        cancel: (): void => {
          task2.cancel();
          task1.cancel();
          removeListener();
        },
      };
    }
    // This is because we are going to load the legs as soon
    // as this method returns because we're going to use the
    // change in the `entry' object to reload the legs
    this.legs = [];
    this.summaryLeg = null;
    return {
      execute: async (): Promise<void> => {},
      cancel: (): void => {},
    };
  }

  @action.bound
  public reset(): void {
    if (this.entryType === EntryType.New) {
      this.entryType = EntryType.Empty;
      this.entry = { ...emptyDealEntry };
      this.originalEntry = this.entry;
      this.legs = [];
      this.summaryLeg = null;
      this.modifiedFields = [];
    } else if (this.entryType === EntryType.ExistingDeal) {
      const { originalLegs } = this;
      this.legs = originalLegs.slice();
      this.summaryLeg =
        this.originalSummaryLeg === null
          ? null
          : { ...this.originalSummaryLeg };
      this.entry = this.originalEntry;
    }
    this.isEditMode = false;
  }

  @action.bound
  public cloneDeal(): void {
    this.entry = { ...this.entry, type: EntryType.Clone, dealID: undefined };
    this.entryType = EntryType.Clone;
    this.isEditMode = true;
  }

  @action.bound
  public addNewDeal(): void {
    this.entry = { ...emptyDealEntry, type: EntryType.New };
    this.entryType = EntryType.New;
    this.isEditMode = true;
    this.legs = [];
    this.summaryLeg = null;
  }

  @action.bound
  public cancelAddOrClone(): void {
    this.reset();
  }

  public async updateDealEntry(partial: Partial<DealEntry>): Promise<void> {
    const { entry } = this;
    const fields: ReadonlyArray<string> = Object.keys(partial);
    if (partial.symbol) {
      this.reloadStrategies(partial.symbol.symbolID);
    }
    const legs = ((legs: ReadonlyArray<Leg>): ReadonlyArray<Leg> => {
      return legs.map(
        (leg: Leg, index: number): Leg => {
          const reducer: (leg: Leg, field: string) => Leg = legsReducer(
            index,
            partial
          );
          return fields.reduce(reducer, leg);
        }
      );
    })(this.legs);
    // Check if legs changed
    if (!deepEqual(this.legs, legs)) {
      this.legs = legs;
    }
    this.entry = {
      ...entry,
      ...partial,
      size: isNumber(partial.not1) ? partial.not1 / 1e6 : entry.size,
      legs: legs.length,
    };
    // Keep a list of modified fields
    fields.forEach((field: string): void => {
      this.addModifiedField(field);
    });
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
          console.warn(SOFT_SEF_ERROR);
        }, config.RequestTimeout);
      })
      .catch((error: any): void => {
        this.setError({
          status: "Unknown problem",
          code: 1,
          error: "Unexpected error",
          content: typeof error === "string" ? error : error.content(),
        });
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
        this.isEditMode = false;
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
        this.isEditMode = false;
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
  public setWorking(isWorking: boolean) {
    this.isWorking = isWorking;
  }

  @action.bound
  public async addDeal(deal: Deal): Promise<void> {
    const { deals } = this;
    const index: number = deals.findIndex(
      (each: Deal): boolean => each.id === deal.id
    );
    if (index === -1) {
      this.deals = [deal, ...deals];
      // If the user is editing we should not set
      // the new deal
      if (this.isEditMode) return;
      const task: Task<void> = this.setDeal(deal);
      // Execute the add deal task
      await task.execute();
    } else {
      const removed: Deal = deals[index];
      this.deals = [...deals.slice(0, index), deal, ...deals.slice(index + 1)];
      // If the user is editing we should not set
      // the new deal
      if (this.isEditMode) return;
      if (this.selectedDealID === deal.id && !deepEqual(deal, removed)) {
        const task: Task<DealEntry> = createDealEntry(deal);
        task
          .execute()
          .then((entry: DealEntry): void => {
            this.setEntry(entry);
          })
          .catch(console.warn);
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
      const task: Task<void> = this.setDeal(null);
      return task.execute();
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
        this.setStatus(MoStatus.Normal);
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
      })
      .finally((): void => {
        this.setStatus(MoStatus.Normal);
      });
  }

  @action.bound
  public lockDeal(id: string): void {
    this.lockedDeals = [...this.lockedDeals, id];
  }

  @action.bound
  public unlockDeal(id: string): void {
    const { lockedDeals } = this;
    const index: number = lockedDeals.findIndex(
      (dealId: string): boolean => dealId === id
    );
    if (index === -1) {
      console.warn("trying to unlock an unlocked deal");
    } else {
      this.lockedDeals = [
        ...lockedDeals.slice(0, index),
        ...lockedDeals.slice(index + 1),
      ];
    }
  }

  public async updateSEFStatus(update: SEFUpdate): Promise<void> {
    await this.updateSEFInDealsBlotter(update);
    await this.updateSEFInDealEntry(update);
    // Reset status to normal to hide the progress window
    this.setStatus(MoStatus.Normal);
  }

  public findStrategyById(name: string): Product | undefined {
    const values: ReadonlyArray<Product> = Object.values(
      workareaStore.products
    );
    return values.find((product: Product): boolean => {
      return name === product.name;
    });
  }

  @action.bound
  public setName(name: string): void {
    this.name = name;
  }

  @action.bound setModified(value: boolean): void {
    this.modified = value;
  }

  private getFilteredLegAdjustValues(
    strategy: Product,
    symbol: Symbol
  ): ReadonlyArray<LegAdjustValue> {
    const { _legAdjustValues } = this;
    return _legAdjustValues
      .filter((value: LegAdjustValue): boolean => {
        if (symbol.ccyGroup.toLowerCase() !== value.ccyGroup.toLowerCase())
          return false;
        return value.OptionProductType === strategy.OptionProductType;
      })
      .sort((v1: LegAdjustValue, v2: LegAdjustValue): number => {
        if (v1.defaultvalue) return -1;
        if (v2.defaultvalue) return 1;
        return 0;
      });
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

  private addModifiedField(name: string): void {
    const { modifiedFields } = this;
    if (modifiedFields.includes(name)) {
      return;
    }
    modifiedFields.push(name);
  }

  private isFieldEditable(name: string): boolean {
    const { entry } = this;
    const flag: EditableFlag = MoStore.getFieldEditableFlag(
      "",
      name,
      entry.strategy
    );
    return !(
      flag === EditableFlag.NotEditable || flag === EditableFlag.NotApplicable
    );
  }

  private getCurrentLegs(): Task<{ legs: ReadonlyArray<Leg> } | null> {
    const { legs } = this;
    return {
      execute: async (): Promise<{ legs: ReadonlyArray<Leg> } | null> => {
        return { legs };
      },
      cancel: (): void => {},
    };
  }

  @action.bound
  private setEntry(entry: DealEntry) {
    if (deepEqual(entry, this.entry)) return;
    this.entry = entry;
  }

  private buildRequest(): DealEntry {
    const { entry } = this;
    const { summaryLeg } = this;
    const otherFields = ((
      summaryLeg: SummaryLeg | null
    ): { extra_fields?: { [key: string]: number | string | null } } => {
      if (summaryLeg === null) return {};
      return {
        extra_fields: {
          spot: summaryLeg.spot,
          fwdrate1: summaryLeg.fwdrate1,
          fwdpts1: summaryLeg.fwdpts1,
          fwdrate2: summaryLeg.fwdrate2,
          fwdpts2: summaryLeg.fwdpts2,
        },
      };
    })(summaryLeg);
    return {
      ...entry,
      ...otherFields,
    };
  }

  @action.bound
  private onDealSaved(id: string): void {
    const { deals } = this;
    const deal: Deal | undefined = deals.find(
      (each: Deal): boolean => each.id === id
    );
    this.isEditMode = false;
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
    if (deal !== undefined) {
      const task: Task<DealEntry> = createDealEntry(deal);
      task
        .execute()
        .then((entry: DealEntry): void => {
          this.setEntry(entry);
        })
        .catch(console.warn);
    }
  }

  @action.bound
  private async updateSEFInDealsBlotter(update: SEFUpdate): Promise<void> {
    const { deals } = this;
    const foundIndex: number = deals.findIndex(
      (deal: Deal): boolean => deal.id === update.dealId
    );
    if (foundIndex === -1) {
      console.warn("this message doesn't seem to belong to this app");
      return;
    }
    this.deals = [
      ...deals.slice(0, foundIndex),
      {
        ...deals[foundIndex],
        status: update.status,
        usi: update.usi,
        sef_namespace: update.namespace,
        error_msg: update.errorMsg,
      },
      ...deals.slice(foundIndex + 1),
    ];
  }

  @action.bound
  private async updateSEFInDealEntry(update: SEFUpdate): Promise<void> {
    // We don't care if updated deal was not the selected deal
    if (update.dealId !== this.selectedDealID) return;
    const { deals } = this;
    const foundIndex: number = deals.findIndex(
      (deal: Deal): boolean => deal.id === update.dealId
    );
    if (foundIndex === -1) {
      console.warn("this message doesn't seem to belong to this app");
      return;
    }
    const task1: Task<DealEntry> = await createDealEntry({
      ...deals[foundIndex],
      error_msg: update.errorMsg,
    });
    const task2: Task<{ legs: ReadonlyArray<Leg> } | null> = API.getLegs(
      update.dealId
    );
    const legsResponse: {
      legs: ReadonlyArray<Leg>;
    } | null = await task2.execute();
    this.entry = await task1.execute();
    if (legsResponse !== null) {
      const [adjustedLegs, summaryLeg] = handleLegsResponse(
        this.entry,
        parseDates(legsResponse.legs),
        this.cuts
      );
      this.setLegs(adjustedLegs, summaryLeg);
    }
  }

  private setLegAdjustValues(value: ReadonlyArray<LegAdjustValue>) {
    this._legAdjustValues = value;
  }
}

export default new MoStore();

/*


 */

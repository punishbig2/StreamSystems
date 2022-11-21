import { API, BankEntitiesQueryResponse, HTTPError, Task } from 'API';
import { isTenor } from 'components/FormField/helpers';
import {
  addFwdRates,
  createDefaultLegsFromDeal,
  handleLegsResponse,
} from 'components/MiddleOffice/DealEntryForm/hooks/useLegs';
import { emailNotSet } from 'components/MiddleOffice/helpers';
import { Cut } from 'components/MiddleOffice/types/cut';
import { BackendDeal, Deal } from 'components/MiddleOffice/types/deal';
import { Leg } from 'components/MiddleOffice/types/leg';
import { LegOptionsDefIn, LegOptionsDefOut } from 'components/MiddleOffice/types/legOptionsDef';
import { ValuationModel } from 'components/MiddleOffice/types/pricer';
import { SummaryLeg } from 'components/MiddleOffice/types/summaryLeg';
import { toast, ToastType } from 'components/toast';
import config from 'config';
import deepEqual from 'deep-equal';
import { EditableFilter } from 'forms/fieldDef';
import { action, computed, makeObservable, observable } from 'mobx';
import workareaStore from 'mobx/stores/workareaStore';
import React from 'react';
import signalRClient from 'signalR/signalRClient';
import { BankEntity } from 'types/bankEntity';
import { CalendarVolDatesResponse } from 'types/calendarFXPair';
import { DealEntry, emptyDealEntry, EntryType } from 'types/dealEntry';
import { DealStatus } from 'types/dealStatus';
import { FixTenorResult } from 'types/fixTenorResult';
import { FXSymbol, InvalidSymbol } from 'types/FXSymbol';
import { LegAdjustValue } from 'types/legAdjustValue';
import { MOErrorMessage } from 'types/middleOfficeError';
import { PricingMessage } from 'types/pricingMessage';
import { EditableFlag, InvalidStrategy, Product, StrategyMap } from 'types/product';
import { SEFUpdate } from 'types/sefUpdate';
import { InvalidTenor, Tenor } from 'types/tenor';
import { OtherUser } from 'types/user';
import { Workspace } from 'types/workspace';
import { WorkspaceType } from 'types/workspaceType';
import {
  createDealEntry,
  createDealFromBackendMessage,
  resolveEntityToBank,
} from 'utils/dealUtils';
import { isNumeric } from 'utils/isNumeric';
import { legsReducer } from 'utils/legsReducer';
import { calculateNetValue, createLegsFromDefinitionAndDeal, parseDates } from 'utils/legsUtils';
import { forceParseDate, safeForceParseDate, toUTC } from 'utils/timeUtils';

const SOFT_SEF_ERROR: string =
  'Timed out while waiting for the submission result, please refresh the screen. ' +
  'If the deal is not submitted yet, try again as this is a problem that should not happen and never be repeated. ' +
  'If otherwise the problem persists, please contact support.';

export enum MiddleOfficeProcessingState {
  Normal,
  Submitting,
  SilentlySubmitting,
  Pricing,
  LoadingDeal,
  CreatingDeal,
  UpdatingDeal,
}

interface LegDefinitions {
  [strategy: string]: {
    in: readonly LegOptionsDefIn[];
    out: readonly LegOptionsDefOut[];
  };
}

export type ModelParameters = any;

export interface InternalValuationModel {
  ValuationModelID: number;
  OptionModel: string;
  OptionModelDesc: string;
  OptionModelParameters: ModelParameters;
}

export const messages: {
  [key in MiddleOfficeProcessingState]: string;
} = {
  [MiddleOfficeProcessingState.Normal]: '',
  [MiddleOfficeProcessingState.SilentlySubmitting]: '',
  [MiddleOfficeProcessingState.Pricing]: 'Pricing in progress',
  [MiddleOfficeProcessingState.Submitting]: 'Submitting',
  [MiddleOfficeProcessingState.CreatingDeal]: 'Creating Deal',
  [MiddleOfficeProcessingState.UpdatingDeal]: 'Updating Deal',
  [MiddleOfficeProcessingState.LoadingDeal]: 'Loading Deal',
};

export interface MoGenericMessage {
  title: string;
  text: string;
}

const savingDealError = (reason: any): MOErrorMessage => {
  const message: string =
    typeof reason === 'string'
      ? reason
      : typeof reason.getMessage === 'function'
      ? reason.getMessage()
      : 'Server error';
  return {
    status: '801',
    code: 801,
    content: message === '' ? 'Server error' : message,
    error: 'Cannot create or save the deal',
  };
};

export class MiddleOfficeStore implements Workspace {
  public readonly type: WorkspaceType = WorkspaceType.MiddleOffice;

  public legs: readonly Leg[] = [];
  public summaryLeg: SummaryLeg | null = null;
  public isInitialized = false;
  public progress = 0;
  public error: MOErrorMessage | null = null;
  public isEditMode = false;
  public status: MiddleOfficeProcessingState = MiddleOfficeProcessingState.Normal;
  public successMessage: MoGenericMessage | null = null;
  public entryType: EntryType = EntryType.Empty;
  public isWorking = false;
  public entry: DealEntry = { ...emptyDealEntry };
  public deals: readonly Deal[] = [];
  public selectedDealID: string | null = null;
  public isLoadingLegs = false;
  public lockedDeals: readonly string[] = [];
  public strategies: { [key: string]: Product } = {};
  public name = 'Middle Office';
  public modified = false;
  public loadingDeals = false;

  public entities: BankEntitiesQueryResponse = {};
  public entitiesMap: { [p: string]: BankEntity } = {};
  public styles: readonly string[] = [];
  public models: readonly InternalValuationModel[] = [];
  public legDefinitions: LegDefinitions = {};
  public cuts: readonly Cut[] = [];
  public deltaStyles: readonly string[] = [];
  public premiumStyles: readonly string[] = [];
  private originalEntry: DealEntry = { ...emptyDealEntry };
  private originalLegs: readonly Leg[] = [];
  private originalSummaryLeg: SummaryLeg | null = null;
  private operationsCount = 9;
  private modifiedFields: string[] = [];
  private computedSpotDate: Date | null = null;

  _legAdjustValues: readonly LegAdjustValue[] = [];

  constructor() {
    makeObservable(this, {
      legs: observable.ref,
      summaryLeg: observable.ref,
      isInitialized: observable,
      progress: observable,
      error: observable,
      isEditMode: observable,
      status: observable,
      successMessage: observable,
      entryType: observable,
      isWorking: observable,
      entry: observable,
      deals: observable.ref,
      selectedDealID: observable,
      isLoadingLegs: observable,
      lockedDeals: observable.ref,
      strategies: observable,
      name: observable,
      modified: observable,
      loadingDeals: observable,
      _legAdjustValues: observable,
      tenors: computed,
      isDealEditable: computed,
      banks: computed,
      symbols: computed,
      isReadyForSubmission: computed,
      isModified: computed,
      minimumNotional: computed,
      setSummaryLeg: action.bound,
      setLegs: action.bound,
      setError: action.bound,
      setEditMode: action.bound,
      setStatus: action.bound,
      setSuccessMessage: action.bound,
      setErrorMessage: action.bound,
      setSoftError: action.bound,
      updateSummaryLeg: action.bound,
      setDeal: action.bound,
      reset: action.bound,
      cloneDeal: action.bound,
      addNewDeal: action.bound,
      cancelAddOrClone: action.bound,
      submit: action.bound,
      saveCurrentEntry: action.bound,
      createOrClone: action.bound,
      setWorking: action.bound,
      addDeal: action.bound,
      removeDeal: action.bound,
      lockDeal: action.bound,
      unlockDeal: action.bound,
      setName: action.bound,
      setModified: action.bound,
      setProgress: action.bound,
      setInitialized: action.bound,
      setCuts: action.bound,
      setStyles: action.bound,
      setDeltaStyles: action.bound,
      setPremiumStyles: action.bound,
      setBankEntities: action.bound,
      setModels: action.bound,
      refreshCurrentDeal: action.bound,
      loadDeals: action.bound,
      setEntry: action.bound,
      onDealSaved: action.bound,
      updateSEFInDealsBlotter: action.bound,
      updateSEFInDealEntry: action.bound,
      buyers: computed,
      sellers: computed,
    });
  }

  public get tenors(): readonly string[] {
    return workareaStore.tenors;
  }

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
      case DealStatus.SEFComplete:
        return emailNotSet(entry.seller_useremail) || emailNotSet(entry.buyer_useremail);
      case DealStatus.STPComplete:
      default:
        return false;
    }
  }

  public get banks(): readonly string[] {
    return workareaStore.banks;
  }

  get symbols(): readonly FXSymbol[] {
    const { symbols, user } = workareaStore;
    return symbols.filter((symbol: FXSymbol): boolean => {
      const { regions } = user;
      if (regions === undefined) return false;
      return regions.includes(symbol.ccyGroup);
    });
  }

  public get isReadyForSubmission(): boolean {
    const { entry } = this;
    if (entry.symbol === InvalidSymbol) return false;
    if (entry.strategy === InvalidStrategy) return false;
    if (entry.buyer === '') return false;
    if (entry.seller === '') return false;
    if (entry.buyer === entry.seller) return false;
    if (entry.model === '') return false;
    if (entry.tenor1 === null) {
      return false;
    } else if (this.isFieldEditable('tenor2') && entry.tenor2 === null) {
      return false;
    }
    if (entry.premstyle === '') return false;
    return entry.deltastyle !== '';
  }

  public get isModified(): boolean {
    if (!this.isEditMode) return false;
    if (this.entryType === EntryType.New || this.entryType === EntryType.Clone) return true;

    const entriesEqual = deepEqual(this.entry, this.originalEntry);
    const legsEqual = deepEqual(this.legs, this.originalLegs);
    const summaryLegsEqual = deepEqual(this.summaryLeg, this.originalSummaryLeg);

    return !(entriesEqual && legsEqual && summaryLegsEqual);
  }

  public get minimumNotional(): number {
    const { strategy } = this.entry;
    if (strategy.OptionProductType === 'Spread') {
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
    if (!originalTenor || !isTenor(originalTenor) || originalTenor.name === '') {
      return {
        execute: async (): Promise<FixTenorResult> => {
          return {
            tenor: null,
            horizonDateUTC: '',
            spotDate: '',
            tradeDate: '',
          };
        },
        cancel: (): void => {
          return;
        },
      };
    }
    const task: Task<CalendarVolDatesResponse> = ((): Task<CalendarVolDatesResponse> => {
      if (originalTenor.name === 'SPECIFIC') {
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
            ...safeForceParseDate('deliveryDate', dates.DeliveryDates[0]),
            ...safeForceParseDate('expiryDate', dates.ExpiryDates[0]),
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
    if (strategy.productid === '') return EditableFlag.Editable;
    const { f1 } = strategy.fields;
    const key: string | undefined = ((prefix: string | null, name: string): string | undefined => {
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
    status?: number,
    isAllowedToEdit: (entry: DealEntry) => boolean = (): boolean => true
  ): EditableFilter {
    return (name: string, entry: DealEntry, editable: boolean, prefix: string): boolean => {
      if (!editable) return false;
      const flag: EditableFlag = MiddleOfficeStore.getFieldEditableFlag(
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
          if (name === 'strategy' || name === 'symbol') {
            // Always editable provided that it's a new deal
            return entry.type === EntryType.New || entry.type === EntryType.Clone;
          }
          return false;
      }
      return MiddleOfficeStore.isEntryEditable(allowedTypes, entry, isAllowedToEdit);
    };
  }

  private static async doSubmit(dealID: string, status: DealStatus): Promise<string> {
    if (status === DealStatus.Priced) {
      return API.sendTradeCaptureReport(dealID);
    } else if (status === DealStatus.SEFComplete) {
      return API.stpSendReport(dealID);
    } else {
      return 'Not in the appropriate state, cannot submit';
    }
  }

  public getDefaultLegAdjust(strategy: Product, symbol: FXSymbol): string {
    const values: readonly LegAdjustValue[] = this.getFilteredLegAdjustValues(strategy, symbol);
    if (values.length === 0) return '';
    return values[0].VegaLegAdjustValue;
  }

  public get legAdjustValues(): readonly LegAdjustValue[] {
    const { strategy, symbol } = this.entry;
    return this.getFilteredLegAdjustValues(strategy, symbol);
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
      // Load leg definitions
      const inDefs: {
        [strategy: string]: LegOptionsDefIn[];
      } = this.legOptionsReducer<LegOptionsDefIn>(await API.getOptionLegsDefIn());
      const outDefs: {
        [strategy: string]: LegOptionsDefOut[];
      } = this.legOptionsReducer<LegOptionsDefOut>(await API.getOptionLegsDefOut());
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

  public connectListeners(): () => void {
    const remove1 = signalRClient.addPricingResponseListener((data: PricingMessage): void => {
      const { entry } = this;
      const legDefs = this.legDefinitions[entry.strategy.productid];
      if (this.isEditMode || entry.dealID !== data.dealId) {
        return;
      }

      // Reset the extra fields
      entry.extra_fields = {
        fwdpts1: data.legs[1].fwdPts,
        fwdrate1: data.legs[1].fwdRate,
        fwdpts2: data.legs.length > 2 ? data.legs[2].fwdPts : null,
        fwdrate2: data.legs.length > 2 ? data.legs[2].fwdRate : null,
      };
      // It is the deal of interest so update
      // visible legs now
      const [legs, summaryLeg] = handleLegsResponse(
        entry,
        parseDates(data.legs),
        this.cuts,
        this.summaryLeg,
        legDefs
      );
      this.setLegsAndUpdateSpotDate(entry.dealID, legs, summaryLeg);
    });
    const remove2 = signalRClient.connectMiddleOfficeStore(this);

    return (): void => {
      remove1();
      remove2();
    };
  }

  public reloadStrategies(currency: string): void {
    const { products, symbols } = workareaStore;
    const symbol: FXSymbol | undefined = symbols.find(
      (symbol: FXSymbol): boolean => symbol.symbolID === currency
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

  public setSummaryLeg(summaryLeg: SummaryLeg | null): void {
    this.summaryLeg = summaryLeg;
  }

  public setLegs(legs: readonly Leg[], summaryLeg: SummaryLeg | null, reset = false): void {
    const spotDate = summaryLeg?.spotDate ?? this.computedSpotDate;
    this.summaryLeg = summaryLeg ? new SummaryLeg(summaryLeg, spotDate) : null;
    this.originalSummaryLeg = summaryLeg;
    this.legs = legs.slice();
    this.originalLegs = this.legs;
    this.isLoadingLegs = false;
    if (reset) {
      this.status = MiddleOfficeProcessingState.Normal;
    }
  }

  public getValuationModelById(id: number): ValuationModel {
    const { models } = this;
    const model: InternalValuationModel | undefined = models.find(
      (model: InternalValuationModel): boolean => {
        return model.ValuationModelID === id;
      }
    );
    if (model === undefined) throw new Error('cannot find the valuation model');
    return {
      OptionModelType: model.OptionModel,
      OptionModelParamaters: model.OptionModelParameters ? model.OptionModelParameters : {},
    };
  }

  public getOutLegsCount(strategy: string): number {
    const definition:
      | {
          in: readonly LegOptionsDefIn[];
          out: readonly LegOptionsDefOut[];
        }
      | undefined = this.legDefinitions[strategy];
    if (definition !== undefined) {
      const { out }: { out: readonly LegOptionsDefOut[] } = definition;
      if (!out) return 0;
      return out.length;
    } else {
      return 0;
    }
  }

  public setError(error: MOErrorMessage | null): void {
    this.error = error;
  }

  public async updateLeg(index: number, key: keyof Leg, value: any): Promise<void> {
    const { legs, summaryLeg } = this;
    this.legs = [
      ...legs.slice(0, index),
      {
        ...legs[index],
        [key]: value,
      },
      ...legs.slice(index + 1),
    ];
    if (['hedge', 'price', 'premium'].includes(key) && summaryLeg !== null) {
      const { entry } = this;
      const { strategy } = entry;
      const legDefs = this.legDefinitions[strategy.productid];
      const dealOutput = {
        ...summaryLeg.dealOutput,
        hedge: calculateNetValue(strategy, this.legs, 'hedge', legDefs),
        premium: calculateNetValue(entry.strategy, this.legs, 'premium', legDefs),
        price: calculateNetValue(entry.strategy, this.legs, 'price', legDefs),
      };

      // Update summary net hedge
      this.summaryLeg = new SummaryLeg(
        {
          ...summaryLeg,
          dealOutput: dealOutput,
        },
        this.computedSpotDate
      );
    }
    this.addModifiedField(key);
  }

  public findSymbolById(currencyPair: string): FXSymbol {
    // Search all system symbols
    const { symbols } = workareaStore;
    const found: FXSymbol | undefined = symbols.find(
      (symbol: FXSymbol) => symbol.symbolID === currencyPair
    );
    if (found !== undefined) {
      return found;
    } else {
      return InvalidSymbol;
    }
  }

  public setEditMode(mode: boolean): void {
    this.isEditMode = mode;
  }

  public setStatus(status: MiddleOfficeProcessingState): void {
    this.status = status;
  }

  public setSuccessMessage(message: MoGenericMessage | null): void {
    this.successMessage = message;
    this.status = MiddleOfficeProcessingState.Normal;
  }

  public setErrorMessage(error: MOErrorMessage | null): void {
    this.error = error;
  }

  public setSoftError(message: string): void {
    if (
      this.status === MiddleOfficeProcessingState.Submitting ||
      this.status === MiddleOfficeProcessingState.Pricing
    ) {
      this.status = MiddleOfficeProcessingState.Normal;
      // Show a toast message (soft error message)
      toast.show(message, ToastType.Error, -1);
    }
  }

  public updateSummaryLeg(fieldName: keyof SummaryLeg, value: any): void {
    this.summaryLeg = { ...this.summaryLeg, [fieldName]: value } as SummaryLeg;
    if (fieldName.startsWith('fwd')) {
      this.legs = addFwdRates(this.legs, this.summaryLeg);
    }
    this.addModifiedField(fieldName);
  }

  public getModifiedFields(): string[] {
    return this.modifiedFields;
  }

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
        execute: async (): Promise<void> => {
          return;
        },
        cancel: (): void => {
          return;
        },
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
      const task1: Task<{ legs: readonly Leg[] } | null> =
        this.status === MiddleOfficeProcessingState.CreatingDeal
          ? this.getCurrentLegs()
          : API.getLegs(deal.id);
      const legDefs = this.legDefinitions[deal.strategy];

      const strategy = this.findStrategyById(deal.strategy);

      const task2: Task<DealEntry> = createDealEntry(
        deal,
        this.getOutLegsCount(deal.strategy),
        deal.symbol,
        strategy,
        this.getDefaultLegAdjust(strategy, deal.symbol)
      );
      return {
        execute: async (): Promise<void> => {
          try {
            // Reset the legs now
            this.setLegs([], null);
            // Attempt to load new
            this.isLoadingLegs = this.status !== MiddleOfficeProcessingState.CreatingDeal;
            // Start loading now
            const response = await task1.execute();
            this.entry = await task2.execute();
            this.originalEntry = this.entry;
            if (response !== null) {
              const [legs, summary] = handleLegsResponse(
                this.entry,
                parseDates(response.legs),
                this.cuts,
                this.summaryLeg,
                legDefs
              );
              this.setLegs(legs, summary);
            } else {
              const [legs, summary] = createDefaultLegsFromDeal(
                this.cuts,
                this.entry,
                legDefs,
                this.computedSpotDate
              );
              this.setLegs(legs, summary);
            }
            this.isLoadingLegs = false;
          } catch (error) {
            if (error !== 'aborted') {
              throw error;
            }
          }
          await this.resetSpotDate();
        },
        cancel: (): void => {
          task2.cancel();
          task1.cancel();
        },
      };
    }
    // This is because we are going to load the legs as soon
    // as this method returns because we're going to use the
    // change in the `entry' object to reload the legs
    this.legs = [];
    this.summaryLeg = null;
    return {
      execute: async (): Promise<void> => {
        await this.resetSpotDate();
      },
      cancel: (): void => {
        return;
      },
    };
  }

  private async resetSpotDate(): Promise<void> {
    const { entry, summaryLeg } = this;
    const result: FixTenorResult = await MiddleOfficeStore.fixTenorDates(
      entry.tenor1,
      entry
    ).execute();

    this.computedSpotDate = forceParseDate(result.spotDate);
    if (
      summaryLeg &&
      (!summaryLeg.spotDate ||
        entry.status === DealStatus.Pending ||
        entry.status === DealStatus.Priced)
    ) {
      this.summaryLeg = new SummaryLeg(summaryLeg, this.computedSpotDate);
    }
  }

  public reset(): void {
    this.modifiedFields = [];
    this.isEditMode = false;
    this.legs = [];
    this.summaryLeg = null;
    this.originalEntry = { ...emptyDealEntry };
    this.entry = { ...emptyDealEntry };

    this.setDeal(null);
  }

  public cloneDeal(): void {
    const { strategy } = this.entry;

    this.entry = {
      ...this.entry,
      type: EntryType.Clone,
      dealID: undefined,
    };
    this.legs = createLegsFromDefinitionAndDeal(
      this.legDefinitions[strategy.productid].in,
      this.entry
    );
    this.entryType = EntryType.Clone;
    this.isEditMode = true;
  }

  public addNewDeal(): void {
    this.entry = { ...emptyDealEntry, type: EntryType.New };
    this.entryType = EntryType.New;
    this.isEditMode = true;
    this.legs = [];
    this.summaryLeg = null;
  }

  public cancelAddOrClone(): void {
    this.reset();
  }

  public async updateDealEntry(partial: Partial<DealEntry>): Promise<void> {
    const { entry } = this;
    const fields: readonly string[] = Object.keys(partial);
    if (partial.symbol) {
      this.reloadStrategies(partial.symbol.symbolID);
    }

    const legs = ((legs: readonly Leg[]): readonly Leg[] => {
      return legs.map((leg: Leg, index: number): Leg => {
        const reducer: (leg: Leg, field: string) => Leg = legsReducer(index, partial, entry);
        return fields.reduce(reducer, leg);
      });
    })(this.legs);
    // Check if legs changed
    if (!deepEqual(this.legs, legs)) {
      this.legs = legs;
    }
    this.entry = {
      ...entry,
      ...partial,
      size: isNumeric(partial.not1) ? partial.not1 / 1e6 : entry.size,
      legs: legs.length,
    };
    // Keep a list of modified fields
    fields.forEach((field: string): void => {
      this.addModifiedField(field);
    });
  }

  public submit(): void {
    const { dealID, status } = this.entry;
    if (dealID === undefined) {
      throw new Error('cannot send a trade capture without a deal id');
    }

    if (status === DealStatus.Priced) {
      this.setStatus(MiddleOfficeProcessingState.Submitting);
    } else {
      this.setStatus(MiddleOfficeProcessingState.SilentlySubmitting);
    }

    const startedAt = Date.now();
    const onError = (error: any): void => {
      const errorData = {
        status: '',
        code: 1,
        error: '',
        content:
          typeof error === 'string'
            ? error
            : typeof error.content === 'function'
            ? error.content()
            : error.message,
      };

      this.setError(errorData);
    };

    MiddleOfficeStore.doSubmit(dealID, status)
      .then((message: string): void => {
        if (message !== '' && message !== 'Success') {
          onError(message);
          return;
        }

        setTimeout((): void => {
          if (this.status === MiddleOfficeProcessingState.Normal) {
            return;
          } else if (status === DealStatus.Priced) {
            toast.show(SOFT_SEF_ERROR, ToastType.Error);
          }
        }, startedAt + config.RequestTimeout - Date.now());
      })
      .catch(onError)
      .finally((): void => {
        setTimeout((): void => {
          this.setStatus(MiddleOfficeProcessingState.Normal);
        }, startedAt + 500 - Date.now());
      });
  }

  public saveCurrentEntry(): void {
    const modifiedFields: string[] = this.getModifiedFields();
    const request = this.buildRequest();
    this.setStatus(MiddleOfficeProcessingState.UpdatingDeal);
    // Call the backend
    API.updateDeal(
      request,
      this.legs,
      this.summaryLeg,
      this.entitiesMap,
      this.entities,
      modifiedFields
    )
      .then((): void => {
        if (request.dealID) {
          // Note: dealID must be defined here
          this.onDealSaved(request.dealID);
        }
      })
      .catch((error: any): void => {
        this.setError(savingDealError(error));
      });
  }

  public createOrClone(): void {
    const { legs, summaryLeg } = this;
    switch (this.entryType) {
      case EntryType.Empty:
      case EntryType.ExistingDeal:
        throw new Error('this function should not be called in current state');
      case EntryType.New:
        this.isEditMode = false;
        this.setStatus(MiddleOfficeProcessingState.CreatingDeal);
        API.createDeal(this.buildRequest(), legs, summaryLeg, this.entitiesMap, this.entities, [])
          .then((id: string) => {
            this.onDealSaved(id);
          })
          .catch((reason: any) => {
            this.setError(savingDealError(reason));
          });
        break;
      case EntryType.Clone:
        this.isEditMode = false;
        this.setStatus(MiddleOfficeProcessingState.CreatingDeal);
        API.cloneDeal(this.buildRequest(), legs, summaryLeg, this.entitiesMap, this.entities, [])
          .then((id: string) => {
            this.onDealSaved(id);
          })
          .catch((reason: any) => {
            this.setError(savingDealError(reason));
          });
        break;
    }
  }

  public setWorking(isWorking: boolean): void {
    this.isWorking = isWorking;
  }

  public async addDeal(backendDeal: BackendDeal): Promise<void> {
    const { deals } = this;
    const index: number = deals.findIndex((each: Deal): boolean => each.id === backendDeal.linkid);
    const deal: Deal = (await this.convertToMiddleOfficeDeal(backendDeal)) as Deal;
    if (index === -1) {
      this.deals = [deal, ...deals];
      // Select it now
      if (deal.id === this.selectedDealID) {
        this.setDeal(deal);
      }
    } /* Replace and thus update changed deal */ else {
      const removed: Deal = deals[index];
      this.deals = [...deals.slice(0, index), deal, ...deals.slice(index + 1)];
      // If the user is editing we should not set
      // the new deal
      if (this.isEditMode) {
        console.warn("the deal you're editing has changed");
      }
      if (this.selectedDealID === deal.id && !deepEqual(deal, removed)) {
        this.loadDealEntryFromDeal(deal);
      }
    }
  }

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
    const { entry, legs, summaryLeg } = this;
    if (entry.strategy === undefined) throw new Error('invalid deal found');
    if (entry.model === '') throw new Error('node model specified');
    const valuationModel: ValuationModel = this.getValuationModelById(entry.model);
    const { strategy, symbol } = entry;
    // Set the status to pricing to show a loading spinner
    this.status = MiddleOfficeProcessingState.Pricing;

    const legDefs = this.legDefinitions[strategy.productid];
    if (!legDefs) {
      throw new Error(`could not find leg definitions for: ${strategy.productid}`);
    }
    // Send the request
    API.sendPricingRequest(
      entry,
      legs,
      summaryLeg,
      valuationModel,
      strategy,
      this.getDefaultLegAdjust(strategy, symbol),
      legDefs
    )
      .then(() => {
        this.setStatus(MiddleOfficeProcessingState.Normal);
      })
      .catch((error: HTTPError | any) => {
        if (error !== undefined) {
          if (typeof error.getMessage === 'function') {
            const message: string = error.getMessage();
            this.setError({
              code: error.getCode(),
              ...JSON.parse(message),
            });
          } else {
            console.warn(error);
          }
        } else {
          console.warn('undefined error, WTF?');
        }
      })
      .finally((): void => {
        this.setStatus(MiddleOfficeProcessingState.Normal);
      });
  }

  public lockDeal(id: string): void {
    this.lockedDeals = [...this.lockedDeals, id];
  }

  public unlockDeal(id: string): void {
    const { lockedDeals } = this;
    const index: number = lockedDeals.findIndex((dealId: string): boolean => dealId === id);
    if (index === -1) {
      console.warn('trying to unlock an unlocked deal');
    } else {
      this.lockedDeals = [...lockedDeals.slice(0, index), ...lockedDeals.slice(index + 1)];
    }
  }

  public async updateSEFStatus(update: SEFUpdate): Promise<void> {
    await this.updateSEFInDealsBlotter(update);
    if (!this.isEditMode) {
      await this.updateSEFInDealEntry(update);
    }
    this.setStatus(MiddleOfficeProcessingState.Normal);
  }

  public findStrategyById(name: string): Product {
    const values: readonly Product[] = Object.values(workareaStore.products);
    const found = values.find((product: Product): boolean => {
      return name === product.productid;
    });
    if (found === undefined) {
      throw new Error(`cannot find strategy ${name}`);
    }
    return found;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public setModified(value: boolean): void {
    this.modified = value;
  }

  private getFilteredLegAdjustValues(
    strategy: Product,
    symbol: FXSymbol
  ): readonly LegAdjustValue[] {
    const { _legAdjustValues } = this;
    const { ccyGroup } = symbol;
    const originalCCYGroup = ccyGroup.toLowerCase();
    return _legAdjustValues
      .filter((value: LegAdjustValue): boolean => {
        if (originalCCYGroup !== value.ccyGroup.toLowerCase()) return false;
        return value.OptionProductType === strategy.OptionProductType;
      })
      .sort((v1: LegAdjustValue, v2: LegAdjustValue): number => {
        if (v1.defaultvalue) return -1;
        if (v2.defaultvalue) return 1;
        return 0;
      });
  }

  public setProgress(value: number): void {
    this.progress = Math.min(Math.max(value, 0), 100);
  }

  public setInitialized(): void {
    this.isInitialized = true;
  }

  private increaseProgress(): void {
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  public setCuts(cuts: Cut[]): void {
    this.cuts = cuts;
    this.increaseProgress();
  }

  public setStyles(styles: string[]): void {
    this.styles = styles;
    this.increaseProgress();
  }

  public setDeltaStyles(styles: readonly string[]): void {
    this.deltaStyles = styles;
    this.increaseProgress();
  }

  public setPremiumStyles(styles: readonly string[]): void {
    this.premiumStyles = styles;
    this.increaseProgress();
  }

  public setBankEntities(entities: BankEntitiesQueryResponse): void {
    this.entities = entities;
    this.entitiesMap = Object.values(entities)
      .reduce((accum: BankEntity[], next: BankEntity[]): BankEntity[] => [...accum, ...next], [])
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

  public setModels(models: InternalValuationModel[]): void {
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

  private async convertToMiddleOfficeDeal(
    data: readonly BackendDeal[] | BackendDeal
  ): Promise<readonly Deal[] | Deal> {
    const { legs } = this;
    const mapper = (item: BackendDeal): Promise<Deal> => {
      const strategy = this.findStrategyById(item.strategy);
      const symbol = this.findSymbolById(item.symbol);
      return createDealFromBackendMessage(
        item,
        symbol,
        strategy,
        this.getDefaultLegAdjust(strategy, symbol),
        legs
      );
    };
    if (data instanceof Array) {
      return (await Promise.all(data.map(mapper))).sort(
        ({ tradeDate: d1 }: Deal, { tradeDate: d2 }: Deal): number => d2.getTime() - d1.getTime()
      );
    } else {
      return mapper(data);
    }
  }

  public refreshCurrentDeal(): void {
    const { deals, entry } = this;
    const currentDeal = deals.find((deal: Deal): boolean => {
      return deal.id === entry.dealID;
    });

    if (currentDeal) {
      this.loadDealEntryFromDeal(currentDeal);
    }
  }

  public async loadDeals(): Promise<void> {
    try {
      this.setLoadingDeals(true);
      // Update deals list
      this.deals = (await this.convertToMiddleOfficeDeal(await API.getDeals())) as readonly Deal[];
    } finally {
      this.setLoadingDeals(false);
    }
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
    const flag: EditableFlag = MiddleOfficeStore.getFieldEditableFlag('', name, entry.strategy);
    return !(flag === EditableFlag.NotEditable || flag === EditableFlag.NotApplicable);
  }

  private getCurrentLegs(): Task<{ legs: readonly Leg[] } | null> {
    const { legs } = this;
    return {
      execute: async (): Promise<{ legs: readonly Leg[] } | null> => {
        return { legs };
      },
      cancel: (): void => {
        return;
      },
    };
  }

  public setEntry(entry: DealEntry): void {
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

  public onDealSaved(id: string): void {
    const { deals } = this;
    const deal: Deal | undefined = deals.find((each: Deal): boolean => each.id === id);
    this.isEditMode = false;
    this.selectedDealID = id;
    this.successMessage = {
      title: 'Saved Successfully',
      text: 'The deal was correctly created with id `' + id + "', please close this window now",
    };
    this.entryType = EntryType.ExistingDeal;
    this.status = MiddleOfficeProcessingState.Normal;
    if (deal !== undefined) {
      this.loadDealEntryFromDeal(deal);
    }
  }

  private loadDealEntryFromDeal(deal: Deal): void {
    const strategy = this.findStrategyById(deal.strategy);
    const task: Task<DealEntry> = createDealEntry(
      deal,
      this.getOutLegsCount(deal.strategy),
      deal.symbol,
      strategy,
      this.getDefaultLegAdjust(strategy, deal.symbol)
    );
    task
      .execute()
      .then((entry: DealEntry): void => {
        this.setEntry(entry);
      })
      .catch(console.warn);
  }

  public async updateSEFInDealsBlotter(update: SEFUpdate): Promise<void> {
    const { deals } = this;
    const foundIndex: number = deals.findIndex((deal: Deal): boolean => deal.id === update.dealId);
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

  public async updateSEFInDealEntry(update: SEFUpdate): Promise<void> {
    // We don't care if updated deal was not the selected deal
    if (update.dealId !== this.selectedDealID) return;
    const { deals } = this;
    const foundIndex: number = deals.findIndex((deal: Deal): boolean => deal.id === update.dealId);
    if (foundIndex === -1) {
      console.warn("this message doesn't seem to belong to this app");
      return;
    }
    const deal = deals[foundIndex];
    const strategy = this.findStrategyById(deal.strategy);
    const task1: Task<DealEntry> = await createDealEntry(
      {
        ...deal,
        error_msg: update.errorMsg,
      },
      this.getOutLegsCount(deal.strategy),
      deal.symbol,
      strategy,
      this.getDefaultLegAdjust(strategy, deal.symbol)
    );
    const task2: Task<{ legs: readonly Leg[] } | null> = API.getLegs(update.dealId);
    const legsResponse: {
      legs: readonly Leg[];
    } | null = await task2.execute();
    this.entry = await task1.execute();
    const legDefs = this.legDefinitions[strategy.productid];
    if (legsResponse !== null) {
      const [adjustedLegs, summaryLeg] = handleLegsResponse(
        this.entry,
        parseDates(legsResponse.legs),
        this.cuts,
        this.summaryLeg,
        legDefs
      );
      void this.setLegsAndUpdateSpotDate(update.dealId, adjustedLegs, summaryLeg);
    }
  }

  private setLegAdjustValues(value: readonly LegAdjustValue[]): void {
    this._legAdjustValues = value;
    this.increaseProgress();
  }

  public static fromJson(data: { [key: string]: any }): MiddleOfficeStore {
    const newStore = new MiddleOfficeStore();
    newStore.name = data.name;
    return newStore;
  }

  public get serialized(): { [key: string]: any } {
    return {
      name: this.name,
      type: this.type,
    };
  }

  private setLoadingDeals(reloadingDeals: boolean): void {
    this.loadingDeals = reloadingDeals;
  }

  public get buyers(): readonly OtherUser[] {
    const { entry } = this;
    const { users } = workareaStore;
    const firm = resolveEntityToBank(entry.buyer, this.entitiesMap);
    return users.filter((user: OtherUser): boolean => user.firm === firm);
  }

  public get sellers(): readonly OtherUser[] {
    const { entry } = this;
    const { users } = workareaStore;
    const firm = resolveEntityToBank(entry.seller, this.entitiesMap);
    return users.filter((user: OtherUser): boolean => user.firm === firm);
  }

  private setLegsAndUpdateSpotDate(
    dealID: string,
    legs: readonly Leg[],
    summaryLeg: SummaryLeg | null
  ): void {
    void API.saveLegs(dealID, legs, summaryLeg);
    this.setLegs(legs, summaryLeg);
  }
}

export const MiddleOfficeStoreContext = React.createContext<MiddleOfficeStore>(
  new MiddleOfficeStore()
);

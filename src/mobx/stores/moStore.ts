import { API, BankEntitiesQueryResponse } from "API";
import { Cut } from "components/MiddleOffice/types/cut";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/types/legOptionsDef";
import {
  MOStrategy,
  StrategyMap,
} from "components/MiddleOffice/types/moStrategy";
import { ValuationModel } from "components/MiddleOffice/types/pricer";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { mapToLeg } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/helpers/getValueHelpers";
import { action, computed, observable } from "mobx";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import dealsStore from "mobx/stores/dealsStore";

import workareaStore from "mobx/stores/workareaStore";
import { DealEntry } from "structures/dealEntry";
import { toast, ToastType } from "toast";
import { BankEntity } from "types/bankEntity";
import { MiddleOfficeError } from "types/middleOfficeError";
import { Symbol } from "types/symbol";

export enum MOStatus {
  Normal,
  Submitting,
  Pricing,
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
  [key: number]: string;
} = {
  [MOStatus.Pricing]: "Pricing in progress",
  [MOStatus.Submitting]: "Submitting",
  [MOStatus.CreatingDeal]: "Creating Deal",
  [MOStatus.UpdatingDeal]: "Updating Deal",
};

interface GenericMessage {
  title: string;
  text: string;
}

export class MoStore {
  @observable deal: Deal | null = null;
  @observable legs: Leg[] = [];
  @observable summaryLeg: SummaryLeg | null = null;
  @observable isInitialized: boolean = false;
  @observable progress: number = 0;
  @observable error: MiddleOfficeError | null = null;
  @observable isEditMode: boolean = false;
  @observable status: MOStatus = MOStatus.Normal;
  @observable successMessage: GenericMessage | null = null;

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

  @action.bound
  private setCuts(cuts: Cut[]): void {
    this.cuts = cuts;
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  @action.bound
  private setStrategies(array: MOStrategy[]): void {
    this.strategies = array.reduce(
      (strategies: StrategyMap, next: MOStrategy): StrategyMap => {
        return { ...strategies, [next.productid]: next };
      },
      {}
    );
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  @action.bound
  private setStyles(styles: string[]): void {
    this.styles = styles;
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  @action.bound
  private setDeltaStyles(styles: ReadonlyArray<string>): void {
    this.deltaStyles = styles;
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  @action.bound
  private setPremiumStyles(styles: ReadonlyArray<string>): void {
    this.premiumStyles = styles;
    this.setProgress(this.progress + 100 / this.operationsCount);
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
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  @action.bound
  private setModels(models: InternalValuationModel[]): void {
    this.models = models;
    this.setProgress(this.progress + 100 / this.operationsCount);
  }

  private legOptionsReducer<T extends LegOptionsDefIn | LegOptionsDefOut>(
    array: any[]
  ): { [id: string]: T[] } {
    return array.reduce((groups: { [strategy: string]: T[] }, option: T) => {
      const key: string = option.productid;
      const group: T[] = groups[key];
      if (group === undefined) {
        groups[key] = [option];
      } else {
        group.push(option);
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
    this.setProgress(this.progress + 100 / this.operationsCount);
    // Update deals list
    return dealsStore.loadDeals();
  }

  @action.bound
  public setDeal(
    deal: Deal | null,
    deStore: DealEntryStore | null = null
  ): void {
    this.deal = deal;
    this.legs = [];
    this.summaryLeg = null;
    this.isEditMode = false;
    // Update the deal entry store
    if (deStore !== null) {
      deStore.setDeal(deal);
    }
  }

  @action.bound
  public setLegs(
    legs: ReadonlyArray<Leg>,
    summaryLeg: SummaryLeg | null
  ): void {
    if (summaryLeg) {
      this.summaryLeg = summaryLeg;
    }
    this.legs = [...legs];
  }

  public getStrategyById(id: string): MOStrategy {
    return this.strategies[id];
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
  public setError(error: MiddleOfficeError | null): void {
    this.error = error;
    this.status = MOStatus.Normal;
  }

  @action.bound
  public updateLegs(entry: DealEntry, name: keyof DealEntry): void {
    const { legs } = this;
    const symbol: Symbol | undefined = this.findSymbolById(entry.ccypair, false);
    if (symbol === undefined) return;
    this.legs = legs.map(
      (each: Leg, index: number): Leg => {
        const result: [keyof Leg, any][] = mapToLeg(
          entry,
          name,
          each,
          symbol,
          index
        );
        return result.reduce(
          (
            all: { [k in keyof Leg]: any },
            [key, value]: [keyof Leg, any]
          ): { [k in keyof Leg]: any } => {
            return { ...all, [key]: value };
          },
          each
        );
      }
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

  public findSymbolById(
    currencyPair: string,
    throwOnNotFound = true
  ): Symbol | undefined {
    // Search all system symbols
    const { symbols } = workareaStore;
    const found: Symbol | undefined = symbols.find(
      (symbol: Symbol) => symbol.symbolID === currencyPair
    );
    if (found !== undefined) {
      return found;
    } else if (throwOnNotFound) {
      throw new Error(`symbol not found \`${currencyPair}'`);
    } else {
      return undefined;
    }
  }

  @action.bound
  public setEditMode(mode: boolean): void {
    this.isEditMode = mode;
  }

  @action.bound
  public setStatus(status: MOStatus): void {
    this.status = status;
  }

  @action.bound
  public setSuccessMessage(message: GenericMessage | null): void {
    this.successMessage = message;
    this.status = MOStatus.Normal;
  }

  @action.bound
  public setErrorMessage(error: MiddleOfficeError | null): void {
    this.error = error;
  }

  @action.bound
  public setSoftError(message: string) {
    if (
      this.status === MOStatus.Submitting ||
      this.status === MOStatus.Pricing
    ) {
      this.status = MOStatus.Normal;
      // Show a toast message (soft error message)
      toast.show(message, ToastType.Error, -1);
    }
  }

  @action.bound
  public updateSummaryLeg(fieldName: string, value: any): void {
    this.summaryLeg = { ...this.summaryLeg, [fieldName]: value } as SummaryLeg;
  }
}

export default new MoStore();

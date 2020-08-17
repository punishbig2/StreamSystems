import { API, BankEntitiesQueryResponse } from "API";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/interfaces/legOptionsDef";
import {
  MOStrategy,
  StrategyMap,
} from "components/MiddleOffice/interfaces/moStrategy";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { action, computed, observable } from "mobx";
import { DealEntryStore } from "mobx/stores/dealEntryStore";

import workareaStore from "mobx/stores/workareaStore";
import { toast, ToastType } from "toast";
import { BankEntity } from "types/bankEntity";
import { MiddleOfficeError } from "types/middleOfficeError";
import { Sides } from "types/sides";
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

  public entities: BankEntitiesQueryResponse = {};
  public entitiesMap: { [p: string]: BankEntity } = {};
  public strategies: { [id: string]: MOStrategy } = {};
  public styles: string[] = [];
  public models: InternalValuationModel[] = [];
  public legDefinitions: LegDefinitions = {};
  public cuts: Cut[] = [];

  @computed
  public get tenors(): string[] {
    return workareaStore.tenors;
  }

  public async loadReferenceData(): Promise<void> {
    if (!this.isInitialized) {
      this.setCuts(await API.getCuts());
      this.setStrategies(await API.getProductsEx());
      this.setStyles(await API.getOptexStyle());
      this.setModels(await API.getValuModel());
      this.setBankEntities(await API.getBankEntities());
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
      this.setProgress(100);
      setTimeout(() => {
        this.setInitialized();
      }, 0);
    }
  }

  @action.bound
  private setProgress(value: number): void {
    this.progress = value;
  }

  @action.bound
  private setInitialized(): void {
    this.isInitialized = true;
  }

  @action.bound
  private setCuts(cuts: Cut[]): void {
    this.cuts = cuts;
    this.setProgress(20);
  }

  @action.bound
  private setStrategies(array: MOStrategy[]): void {
    this.strategies = array.reduce(
      (strategies: StrategyMap, next: MOStrategy): StrategyMap => {
        return { ...strategies, [next.productid]: next };
      },
      {}
    );
    this.setProgress(40);
  }

  @action.bound
  private setStyles(styles: string[]): void {
    this.styles = styles;
    this.setProgress(60);
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
    this.setProgress(90);
  }

  @action.bound
  private setModels(models: InternalValuationModel[]): void {
    this.models = models;
    this.setProgress(80);
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
  public get banks(): string[] {
    return workareaStore.banks;
  }

  @computed
  get symbols(): Symbol[] {
    return workareaStore.symbols;
  }

  @action.bound
  public createSummaryLeg(cut: Cut): void {
    const { deal } = this;
    if (deal === null) return;
    const { symbol } = deal;
    this.summaryLeg = {
      cutCity: cut.City,
      cutTime: cut.LocalTime,
      dealOutput: {
        premiumDate: deal.spotDate,
        deliveryDate: deal.deliveryDate,
        expiryDate: deal.expiryDate,
        side: Sides.None,
        option: "",
        vol: null,
        fwdPts: null,
        fwdRate: null,
        premium: null,
        strike: null,
        delta: null,
        gamma: null,
        hedge: null,
        pricePercent: null,
        vega: null,
        premiumCurrency: "USD",
        usi: null,
        rates: [
          {
            currency: "",
            value: 0,
          },
          {
            currency: "",
            value: 0,
          },
        ],
      },
      delivery: symbol.SettlementType,
      source: symbol.FixingSource,
      spot: null,
      spotDate: deal.spotDate,
      tradeDate: deal.tradeDate,
      usi: null,
      strategy: this.strategies[deal.strategy]!.description,
    };
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
  public setLegs(legs: Leg[], summaryLeg: SummaryLeg | null): void {
    if (summaryLeg) {
      this.summaryLeg = summaryLeg;
    }
    this.legs = legs;
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

  public updateLeg(index: number, key: keyof Leg, value: any): void {
    const { legs } = this;
    this.legs = [
      ...legs.slice(0, index),
      {
        ...legs[index],
        [key]: value,
        custom: {
          fwdRate: key === "fwdRate",
        },
      },
      ...legs.slice(index + 1),
    ];
  }

  public findSymbolById(currencyPair: string): Symbol {
    const symbols: Symbol[] = this.symbols;
    const found: Symbol | undefined = symbols.find(
      (symbol: Symbol) => symbol.symbolID === currencyPair
    );
    if (found !== undefined) {
      return found;
    } else {
      throw new Error(`symbol not found \`${currencyPair}'`);
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
}

export default new MoStore();

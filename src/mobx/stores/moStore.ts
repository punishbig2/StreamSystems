import { Deal } from "components/MiddleOffice/interfaces/deal";
import { observable, action, computed } from "mobx";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { API } from "API";

import workareaStore from "mobx/stores/workareaStore";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/interfaces/legOptionsDef";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";
import { Sides } from "interfaces/sides";
import { DealEntryStore } from "mobx/stores/dealEntryStore";

interface LegDefinitions {
  [strategy: string]: {
    in: LegOptionsDefIn[];
    out: LegOptionsDefOut[];
  };
}

interface Error {
  error: string;
  code: number;
  message: string;
  status: string;
}

export interface InternalValuationModel {
  ValuationModelID: number;
  OptionModel: string;
  OptionModelDesc: string;
  OptionModelParameters: string;
}

export class MoStore {
  @observable deal: Deal | null = null;
  @observable legs: Leg[] = [];
  @observable summaryLeg: SummaryLeg | null = null;
  @observable isInitialized: boolean = false;
  @observable loadingReferenceDataProgress: number = 0;
  @observable isSendingPricingRequest: boolean = false;
  @observable error: Error | null = null;

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
  private setProgress(value: number) {
    this.loadingReferenceDataProgress = value;
  }

  @action.bound
  private setInitialized() {
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
      (
        strategies: { [name: string]: MOStrategy },
        strategy: MOStrategy
      ): { [name: string]: MOStrategy } => {
        return { ...strategies, [strategy.name]: strategy };
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
  public get banks() {
    return workareaStore.banks;
  }

  @computed
  get symbols() {
    return workareaStore.symbols;
  }

  @action.bound
  public createSummaryLeg(cut: Cut): void {
    const { deal } = this;
    if (deal === null) return;
    const { symbol } = deal;
    this.summaryLeg = {
      brokerage: { buyerComm: null, sellerComm: null },
      cutCity: cut.City,
      cutTime: cut.LocalTime,
      dealOutput: {
        premiumDate: deal.spotDate,
        deliveryDate: deal.deliveryDate,
        expiryDate: deal.expiryDate,
        side: Sides.Buy,
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
  public setDeal(deal: Deal | null, deStore: DealEntryStore | null = null) {
    this.deal = deal;
    this.legs = [];
    this.summaryLeg = null;
    // Update the deal entry store
    if (deStore !== null) {
      deStore.setDeal(deal);
    }
  }

  @action.bound
  public setLegs(legs: Leg[], summary: SummaryLeg | null) {
    this.summaryLeg = summary;
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

  @action.bound
  public setSendingPricingRequest(value: boolean) {
    this.isSendingPricingRequest = value;
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
  public setError(error: Error | null) {
    this.error = error;
  }

  public updateLeg(index: number, key: keyof Leg, value: any) {
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
}

export default new MoStore();

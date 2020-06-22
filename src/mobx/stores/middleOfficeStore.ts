import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable, action, computed } from "mobx";
import { Leg } from "components/MiddleOffice/interfaces/leg";

import moment from "moment";
import { Sides } from "interfaces/sides";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { parseTime } from "timeUtils";
import { Globals } from "golbals";
import { Symbol } from "interfaces/symbol";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { API } from "API";

import workareaStore from "mobx/stores/workareaStore";
import { LegOptionsDef } from "components/MiddleOffice/interfaces/legOptionsDef";
import { DealEntry } from "structures/dealEntry";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";

export interface StubLegInfo {
  notional: number | null;
  party: string;
  side: Sides;
  vol: number | undefined;
  strike: string | undefined;
  optionOut: string;
  optionIn: string;
  currencies: [string, string];
}

export interface InternalValuationModel {
  ValuationModelID: number;
  OptionModel: string;
  OptionModelDesc: string;
  OptionModelParameters: string;
}

export class MiddleOfficeStore {
  @observable deal: Deal | null = null;
  @observable legs: Leg[] = [];
  @observable summaryLeg: SummaryLeg | null = null;
  @observable isInitialized: boolean = false;
  @observable loadingReferenceDataProgress: number = 0;

  public strategies: { [id: string]: MOStrategy } = {};
  public styles: string[] = [];
  public models: InternalValuationModel[] = [];
  public legOptionsDefinitions: { [strategy: string]: LegOptionsDef[] } = {};
  public cuts: Cut[] = [];

  public async loadReferenceData(): Promise<void> {
    if (!this.isInitialized) {
      this.setCuts(await API.getCuts());
      this.setStrategies(await API.getProductsEx());
      this.setStyles(await API.getOptexStyle());
      this.setModels(await API.getValuModel());
      this.setLegOptionsDefinitions(await API.getOptionLegsDef());
      // Update this is initialized
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

  @action.bound
  private setLegOptionsDefinitions(array: any[]) {
    this.legOptionsDefinitions = array.reduce(
      (
        groups: { [strategy: string]: LegOptionsDef[] },
        option: LegOptionsDef
      ) => {
        const key: string = option.productid;
        const group: LegOptionsDef[] = groups[key];
        if (group === undefined) {
          groups[key] = [option];
        } else {
          group.push(option);
        }
        return groups;
      },
      {}
    );
    this.setProgress(100);
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
  public createSummaryLeg(entry: DealEntry, cut: Cut, symbol: Symbol): void {
    const { legs, deal } = this;
    if (legs.length === 0 || deal === null) return;
    this.summaryLeg = {
      brokerage: { buyerComm: null, sellerComm: null },
      cutCity: cut.City,
      cutTime: cut.LocalTime,
      dealOutput: {
        delta: null,
        gamma: null,
        hedge: null,
        premiumAMT: null,
        pricePercent: null,
        vega: null,
      },
      delivery: symbol.SettlementType,
      source: symbol.FixingSource,
      spot: null,
      spotDate: moment(),
      spread: entry.spread,
      tradeDate: moment(parseTime(deal.transactionTime, Globals.timezone)),
      usi: null,
      strategy: legs[0].optionOut,
    };
  }

  @action.bound
  public setDeal(deal: Deal) {
    this.deal = deal;
    this.resetLegs();
  }

  @action.bound
  public resetLegs() {
    this.summaryLeg = null;
    this.legs = [];
  }

  @action.bound
  public addStubLeg(info: StubLegInfo) {
    const { legs } = this;
    const stub: Leg = {
      depo: [
        {
          currency: info.currencies[0],
          value: 0,
        },
        {
          currency: info.currencies[1],
          value: 0,
        },
      ],
      expiryDate: moment(),
      deliveryDate: moment(),
      days: null,
      delta: null,
      fwdPts: null,
      fwdRate: null,
      gamma: null,
      hedge: null,
      notional: info.notional,
      optionOut: info.optionOut,
      optionIn: info.optionIn,
      party: info.party,
      premium: null,
      premiumDate: moment(),
      price: null,
      side: info.side,
      strike: null,
      vega: null,
      vol: info.vol || null,
    };
    legs.push(stub);
  }

  public getValuationModelById(id: number): ValuationModel {
    const { models } = this;
    console.log(models, id);
    const model: InternalValuationModel | undefined = models.find(
      (model: InternalValuationModel): boolean => {
        return model.ValuationModelID === id;
      }
    );
    if (model === undefined) throw new Error("cannot find the valuation model");
    return {
      OptionModelType: model.OptionModel,
      OptionModelParamaters: model.OptionModelParameters,
    };
  }
}

export default new MiddleOfficeStore();
